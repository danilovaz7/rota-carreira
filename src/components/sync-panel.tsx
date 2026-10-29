"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ClipboardPaste,
  Cloud,
  Copy,
  Laptop,
  Loader2,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Application, JobProfile } from "@/types/job-hunt";
import type { AutoSync } from "@/hooks/use-auto-sync";
import {
  applySnapshot,
  buildSnapshot,
  loadSyncMeta,
  snapshotFromPortableText,
  snapshotToPortableText,
} from "@/lib/sync-snapshot";
import { generateSyncCode } from "@/lib/sync-crypto";
import { formatSyncAgo, useNow } from "@/components/sync-status-pill";

type Props = {
  profile: JobProfile;
  applications: Application[];
  sync: AutoSync;
  onSynced: () => void;
};

export function SyncPanel({ profile, applications, sync, onSynced }: Props) {
  const [code, setCode] = useState(() => loadSyncMeta()?.code ?? "");
  const [pin, setPin] = useState("");
  const [paste, setPaste] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cloudOk, setCloudOk] = useState<boolean | null>(null);
  const [showPin, setShowPin] = useState(false);
  const now = useNow(15_000);

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

  async function activate() {
    const normalized = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalized)) {
      setError("O código tem o formato ABCD-1234. Toque em “Gerar código” se for o primeiro aparelho.");
      return;
    }
    if (pin.length < 4) {
      setError("Escolha um PIN com pelo menos 4 caracteres.");
      return;
    }
    setBusy(true);
    setError(null);
    const outcome = await sync.enable(normalized, pin);
    setBusy(false);
    if (outcome.kind === "error") {
      setError(
        outcome.wrongPin
          ? "PIN incorreto para este código. Use o mesmo PIN do outro aparelho."
          : outcome.message,
      );
      return;
    }
    if (outcome.kind === "unavailable") {
      setError("A nuvem não está ligada neste site. Veja a dica abaixo.");
      return;
    }
    setPin("");
    notify(
      outcome.kind === "pushed"
        ? "Pronto! Seus dados subiram. No outro aparelho, use o mesmo código e PIN."
        : "Pronto! Os dados da nuvem chegaram neste aparelho.",
    );
  }

  async function copyBackup() {
    setBusy(true);
    try {
      const text = snapshotToPortableText(buildSnapshot(profile, applications));
      await navigator.clipboard.writeText(text);
      notify("Backup copiado. Cole no outro aparelho (WhatsApp, e-mail ou notas).");
    } catch {
      setError("Não deu para copiar automaticamente neste navegador.");
    } finally {
      setBusy(false);
    }
  }

  function importPaste() {
    setError(null);
    try {
      applySnapshot(snapshotFromPortableText(paste));
      onSynced();
      setPaste("");
      notify("Dados importados neste aparelho.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Backup inválido");
    }
  }

  const active = sync.code !== null && sync.state !== "off";

  return (
    <div className="space-y-5 rounded-2xl border bg-card p-5 shadow-xs">
      <div className="space-y-1">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Smartphone className="size-5 text-primary" />
          <span>Celular e PC sempre iguais</span>
          <Laptop className="size-5 text-primary" />
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure uma vez em cada aparelho. Depois disso, marcar “Já enviei”, salvar
          vaga ou editar o perfil aparece sozinho no outro, sem apertar nada.
        </p>
      </div>

      {active ? (
        <section className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
              {sync.state === "syncing" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Sincronização automática ligada
            </p>
            <span className="rounded-md bg-background px-2 py-0.5 font-mono text-sm ring-1 ring-border">
              {sync.code}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {sync.state === "error" && sync.error
              ? `Último problema: ${sync.error}`
              : sync.state === "unavailable"
                ? "A nuvem está fora do ar agora. Seus dados continuam salvos aqui e sobem quando voltar."
                : sync.lastSyncAt
                  ? `Última sincronização: ${formatSyncAgo(sync.lastSyncAt, now)}.`
                  : "Sincronizando…"}{" "}
            No outro aparelho, abra o mesmo site, vá em Perfil e use este código com o
            mesmo PIN.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={sync.state === "syncing"}
              onClick={() => void sync.syncNow()}
            >
              <RefreshCw className="size-3.5" />
              Sincronizar agora
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                sync.disable();
                notify("Sync desligado neste aparelho. Os dados daqui continuam salvos.");
              }}
            >
              Desligar neste aparelho
            </Button>
          </div>
        </section>
      ) : (
        <section className="space-y-4 rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Cloud className="size-4" />
            Ligar sync automático
          </div>
          {cloudOk === false ? (
            <p className="rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Este site ainda não tem a nuvem conectada. Na Vercel, abra o projeto →
              Storage → conecte <strong>Upstash Redis</strong> (plano grátis) e faça
              Redeploy. Enquanto isso, use copiar/colar abaixo.
            </p>
          ) : (
            <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
              <li>
                No primeiro aparelho: toque em <strong>Gerar código</strong>, crie um PIN e
                ative.
              </li>
              <li>No segundo: digite o mesmo código e PIN e ative.</li>
            </ol>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sync-code">Código</Label>
              <div className="flex gap-2">
                <Input
                  id="sync-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABCD-1234"
                  autoCapitalize="characters"
                  autoComplete="off"
                  className="font-mono uppercase"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCode(generateSyncCode());
                    notify("Código gerado. Anote ele, crie um PIN e ative.");
                  }}
                >
                  Gerar código
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sync-pin">PIN (mín. 4 caracteres)</Label>
              <div className="flex gap-2">
                <Input
                  id="sync-pin"
                  type={showPin ? "text" : "password"}
                  autoComplete="off"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void activate();
                  }}
                  placeholder="Só você sabe"
                />
                <Button type="button" variant="ghost" onClick={() => setShowPin((v) => !v)}>
                  {showPin ? "Ocultar" : "Ver"}
                </Button>
              </div>
            </div>
          </div>
          <Button
            type="button"
            className="w-full gap-2 sm:w-auto"
            disabled={busy || cloudOk === false}
            onClick={() => void activate()}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Cloud className="size-4" />}
            Ativar neste aparelho
          </Button>
          <p className="text-xs text-muted-foreground">
            Os dados são criptografados no seu navegador com o código + PIN antes de subir.
            O servidor só guarda texto ilegível.
          </p>
        </section>
      )}

      {message && <p className="text-sm text-emerald-700 dark:text-emerald-400">{message}</p>}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <details className="group rounded-xl border bg-muted/30 p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Alternativa sem nuvem: copiar e colar backup
        </summary>
        <div className="mt-3 space-y-3">
          <Button type="button" variant="secondary" className="gap-2" disabled={busy} onClick={() => void copyBackup()}>
            <Copy className="size-4" />
            Copiar backup deste aparelho
          </Button>
          <div className="space-y-2">
            <Label htmlFor="paste-backup">Colar backup do outro aparelho</Label>
            <textarea
              id="paste-backup"
              className="min-h-[72px] w-full rounded-lg border bg-background px-3 py-2 font-mono text-xs"
              placeholder="CEMPREGO1:..."
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
            />
            <Button type="button" variant="outline" className="gap-2" disabled={!paste.trim()} onClick={importPaste}>
              <ClipboardPaste className="size-4" />
              Importar aqui
            </Button>
          </div>
        </div>
      </details>
    </div>
  );
}
