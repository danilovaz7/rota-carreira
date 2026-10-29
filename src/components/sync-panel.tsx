"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Cloud,
  CloudDownload,
  CloudUpload,
  Copy,
  ClipboardPaste,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Application, JobProfile } from "@/types/job-hunt";
import {
  applySnapshot,
  buildSnapshot,
  clearSyncMeta,
  loadSyncMeta,
  saveSyncMeta,
  snapshotFromPortableText,
  snapshotToPortableText,
} from "@/lib/sync-snapshot";
import {
  decryptFromSync,
  encryptForSync,
  generateSyncCode,
} from "@/lib/sync-crypto";

type Props = {
  profile: JobProfile;
  applications: Application[];
  onSynced: () => void;
};

export function SyncPanel({ profile, applications, onSynced }: Props) {
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [paste, setPaste] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cloudOk, setCloudOk] = useState<boolean | null>(null);

  useEffect(() => {
    const meta = loadSyncMeta();
    if (meta?.code) setCode(meta.code);
  }, []);

  useEffect(() => {
    fetch("/api/sync/health")
      .then((r) => r.json())
      .then((d: { cloud?: boolean }) => setCloudOk(Boolean(d.cloud)))
      .catch(() => setCloudOk(false));
  }, []);

  const notify = useCallback((text: string) => {
    setMessage(text);
    setError(null);
  }, []);

  async function copyBackup() {
    setBusy(true);
    try {
      const text = snapshotToPortableText(buildSnapshot(profile, applications));
      await navigator.clipboard.writeText(text);
      notify("Backup copiado. Cole no celular (WhatsApp, e-mail ou notas).");
    } catch {
      setError("Não deu para copiar. Tente colar manualmente o campo abaixo.");
    } finally {
      setBusy(false);
    }
  }

  function importPaste() {
    setBusy(true);
    setError(null);
    try {
      const snapshot = snapshotFromPortableText(paste);
      applySnapshot(snapshot);
      onSynced();
      setPaste("");
      notify("Dados importados neste aparelho.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Backup inválido");
    } finally {
      setBusy(false);
    }
  }

  async function pushCloud() {
    if (!code.trim() || pin.length < 4) {
      setError("Informe o código de sync e um PIN com pelo menos 4 dígitos.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const snapshot = buildSnapshot(profile, applications);
      const payload = await encryptForSync(code, pin, JSON.stringify(snapshot));
      const res = await fetch(`/api/sync/${encodeURIComponent(code.trim())}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });
      const data = (await res.json()) as { error?: string; hint?: string };
      if (!res.ok) throw new Error(data.hint ? `${data.error} ${data.hint}` : data.error);
      saveSyncMeta({ code: code.trim().toUpperCase(), lastPushAt: new Date().toISOString() });
      notify("Enviado para a nuvem. No outro aparelho, use o mesmo código e PIN.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao enviar");
    } finally {
      setBusy(false);
    }
  }

  async function pullCloud() {
    if (!code.trim() || pin.length < 4) {
      setError("Informe o código de sync e o PIN.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/sync/${encodeURIComponent(code.trim())}`);
      const data = (await res.json()) as { payload?: string; error?: string; hint?: string };
      if (!res.ok) throw new Error(data.hint ? `${data.error} ${data.hint}` : data.error);
      const plain = await decryptFromSync(code, pin, data.payload!);
      const snapshot = JSON.parse(plain) as ReturnType<typeof buildSnapshot>;
      applySnapshot(snapshot);
      saveSyncMeta({ code: code.trim().toUpperCase(), lastPullAt: new Date().toISOString() });
      onSynced();
      notify("Baixado da nuvem — perfil e candidaturas atualizados.");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message.includes("decrypt") || e.message.includes("operation")
            ? "PIN incorreto ou backup inválido."
            : e.message
          : "Falha ao baixar",
      );
    } finally {
      setBusy(false);
    }
  }

  function newCode() {
    setCode(generateSyncCode());
    notify("Novo código gerado. Escolha um PIN e envie para a nuvem.");
  }

  return (
    <div className="space-y-6 rounded-2xl border bg-card p-5 shadow-xs">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Usar no celular e no PC</h3>
        <p className="text-sm text-muted-foreground">
          O mesmo link, dados iguais nos dois: perfil, vagas salvas e marcadas como
          enviadas. Escolha um jeito abaixo.
        </p>
      </div>

      <section className="space-y-3 rounded-xl border bg-muted/30 p-4">
        <p className="text-sm font-medium">1. Copiar e colar (sempre funciona)</p>
        <p className="text-xs text-muted-foreground">
          No PC: copie o backup → mande para você (WhatsApp, e-mail). No celular:
          cole e importe.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="default" className="gap-2" disabled={busy} onClick={() => void copyBackup()}>
            <Copy className="size-4" />
            Copiar backup
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="paste-backup">Colar backup do outro aparelho</Label>
          <textarea
            id="paste-backup"
            className="min-h-[72px] w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono"
            placeholder="CEMPREGO1:..."
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            disabled={busy || !paste.trim()}
            onClick={importPaste}
          >
            <ClipboardPaste className="size-4" />
            Importar aqui
          </Button>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Cloud className="size-4" />
          2. Sync na nuvem (código + PIN)
        </div>
        {cloudOk === false && (
          <p className="text-xs text-muted-foreground">
            Neste link público a nuvem ainda não está ligada — use copiar/colar acima.
            Quem publicar na Vercel pode conectar Upstash Redis (grátis) para ativar.
          </p>
        )}
        {cloudOk === true && (
          <p className="text-xs text-muted-foreground">
            Mesmo código e PIN nos dois aparelhos. O PIN não sai do seu navegador — só
            dados criptografados vão pro servidor.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sync-code">Código de sync</Label>
            <div className="flex gap-2">
              <Input
                id="sync-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABCD-1234"
                className="font-mono uppercase"
              />
              <Button type="button" variant="outline" onClick={newCode}>
                Novo
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sync-pin">PIN (mín. 4 caracteres)</Label>
            <Input
              id="sync-pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Só você sabe"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="gap-2"
            disabled={busy || cloudOk === false}
            onClick={() => void pushCloud()}
          >
            <CloudUpload className="size-4" />
            Enviar deste aparelho
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            disabled={busy || cloudOk === false}
            onClick={() => void pullCloud()}
          >
            <CloudDownload className="size-4" />
            Baixar no aparelho
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              clearSyncMeta();
              notify("Código lembrado neste aparelho foi limpo.");
            }}
          >
            Esquecer código salvo
          </Button>
        </div>
      </section>

      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <RefreshCw className="mt-0.5 size-3.5 shrink-0" />
        Depois de importar ou baixar, abra de novo a aba Para você se a lista não
        atualizar sozinha.
      </p>
    </div>
  );
}
