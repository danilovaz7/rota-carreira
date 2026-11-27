"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Plus, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Application, ApplicationStatus } from "@/types/job-hunt";
import { STATUS_LABELS } from "@/types/job-hunt";
import { newApplicationId, saveApplications } from "@/lib/storage";

type Props = {
  applications: Application[];
  onApplicationsChange: (apps: Application[]) => void;
};

/** Ordem do funil: do que você guardou até a resposta da empresa. */
const PIPELINE: ApplicationStatus[] = ["saved", "applied", "interview", "offer", "rejected"];

const STATUS_DOT: Record<ApplicationStatus, string> = {
  saved: "bg-stone-400",
  applied: "bg-primary",
  interview: "bg-amber-500",
  offer: "bg-emerald-500",
  rejected: "bg-rose-400",
  dismissed: "bg-stone-300",
};

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}

export function ApplicationTracker({ applications, onApplicationsChange }: Props) {
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ company: "", title: "", url: "", source: "LinkedIn" });

  const sorted = useMemo(
    () =>
      [...applications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [applications],
  );

  // Descartadas só aparecem quando você filtra por elas.
  const visible = sorted.filter((a) =>
    filter === "all" ? a.status !== "dismissed" : a.status === filter,
  );

  const stats = useMemo(() => {
    const c: Partial<Record<ApplicationStatus, number>> = {};
    for (const a of applications) c[a.status] = (c[a.status] ?? 0) + 1;
    return c;
  }, [applications]);

  const activeTotal = applications.length - (stats.dismissed ?? 0);

  function persist(next: Application[]) {
    onApplicationsChange(next);
    saveApplications(next);
  }

  function updateStatus(id: string, status: ApplicationStatus) {
    persist(
      applications.map((a) => {
        if (a.id !== id) return a;
        const appliedAt =
          status === "applied" && !a.appliedAt ? new Date().toISOString() : a.appliedAt;
        return { ...a, status, appliedAt };
      }),
    );
  }

  function updateNotes(id: string, notes: string) {
    persist(applications.map((a) => (a.id === id ? { ...a, notes } : a)));
  }

  function remove(id: string) {
    persist(applications.filter((a) => a.id !== id));
  }

  function addManual() {
    if (!draft.title.trim() || !draft.url.trim()) return;
    const app: Application = {
      id: newApplicationId(),
      company: draft.company.trim() || "—",
      title: draft.title.trim(),
      url: draft.url.trim(),
      source: draft.source.trim() || "LinkedIn",
      status: "saved",
      notes: "",
      jobDescription: "",
      createdAt: new Date().toISOString(),
    };
    persist([app, ...applications]);
    setDraft({ company: "", title: "", url: "", source: "LinkedIn" });
    setAdding(false);
  }

  const canAdd = draft.title.trim() && draft.url.trim();

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Minhas vagas</h2>
          <p className="text-sm text-muted-foreground">
            {activeTotal === 0
              ? "Nada por aqui ainda."
              : `${activeTotal} no funil · ${(stats.applied ?? 0) + (stats.interview ?? 0) + (stats.offer ?? 0)} em andamento`}
          </p>
        </div>
        <Button
          type="button"
          variant={adding ? "outline" : "default"}
          className="h-10 shrink-0 gap-1.5 px-3"
          onClick={() => setAdding((v) => !v)}
          aria-expanded={adding}
        >
          {adding ? <X className="size-4" /> : <Plus className="size-4" />}
          {adding ? "Fechar" : "Adicionar"}
        </Button>
      </div>

      {adding && (
        <form
          className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            addManual();
          }}
        >
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="add-url">Link da vaga</Label>
            <Input
              id="add-url"
              className="h-10"
              placeholder="https://…"
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-title">Cargo</Label>
            <Input
              id="add-title"
              className="h-10"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-company">Empresa</Label>
            <Input
              id="add-company"
              className="h-10"
              value={draft.company}
              onChange={(e) => setDraft({ ...draft, company: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button type="submit" className="h-10 px-4" disabled={!canAdd}>
              Salvar vaga
            </Button>
            {!canAdd && (
              <span className="text-xs text-muted-foreground">Preencha o link e o cargo.</span>
            )}
          </div>
        </form>
      )}

      {/* Funil: cada etapa é um filtro. */}
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <FunnelChip active={filter === "all"} onClick={() => setFilter("all")} label="Todas" count={activeTotal} />
        {PIPELINE.map((s) => (
          <FunnelChip
            key={s}
            active={filter === s}
            onClick={() => setFilter(s)}
            label={STATUS_LABELS[s]}
            count={stats[s] ?? 0}
            dot={STATUS_DOT[s]}
          />
        ))}
        {(stats.dismissed ?? 0) > 0 && (
          <FunnelChip
            active={filter === "dismissed"}
            onClick={() => setFilter("dismissed")}
            label={STATUS_LABELS.dismissed}
            count={stats.dismissed ?? 0}
            dot={STATUS_DOT.dismissed}
          />
        )}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card px-6 py-10 text-center">
          <p className="font-medium">
            {filter === "all" ? "Nenhuma vaga salva ainda" : `Nenhuma vaga em "${STATUS_LABELS[filter]}"`}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {filter === "all"
              ? "No Para você, use o marcador para salvar ou \"Já enviei\" para registrar a candidatura. Vaga de outro site? Toque em Adicionar."
              : "Troque o filtro acima para ver as outras etapas."}
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {visible.map((a) => (
            <li key={a.id} className="space-y-2.5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-baseline gap-1 font-semibold leading-snug underline-offset-2 hover:underline focus-visible:rounded focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <span className="break-words">{a.title}</span>
                    <ExternalLink className="size-3.5 shrink-0 translate-y-0.5 text-muted-foreground" />
                  </a>
                  <p className="text-sm text-muted-foreground">
                    {a.company} · {a.source}
                    {a.appliedAt
                      ? ` · enviada em ${formatDate(a.appliedAt)}`
                      : ` · salva em ${formatDate(a.createdAt)}`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="size-10 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(a.id)}
                  aria-label={`Apagar ${a.title} de vez`}
                  title="Apagar de vez"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="relative inline-flex shrink-0 items-center">
                  <span className="sr-only">Status</span>
                  <span
                    className={cn("pointer-events-none absolute left-3 size-2 rounded-full", STATUS_DOT[a.status])}
                    aria-hidden
                  />
                  {/* Select nativo: abre o seletor do próprio celular e mostra o nome em português. */}
                  <select
                    value={a.status}
                    onChange={(e) => updateStatus(a.id, e.target.value as ApplicationStatus)}
                    className="h-10 w-full appearance-none rounded-lg border bg-background pr-8 pl-7 text-sm font-medium transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-40"
                  >
                    {[...PIPELINE, "dismissed" as const].map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-2.5 size-4 text-muted-foreground"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </label>
                <Input
                  value={a.notes}
                  onChange={(e) => updateNotes(a.id, e.target.value)}
                  placeholder="Notas: recrutador, data da entrevista, retorno…"
                  aria-label="Notas"
                  className="h-10 flex-1 text-sm"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FunnelChip({
  active,
  onClick,
  label,
  count,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        active
          ? "border-foreground bg-foreground text-background"
          : "bg-card text-foreground hover:bg-muted",
      )}
    >
      {dot && <span className={cn("size-2 rounded-full", dot)} aria-hidden />}
      {label}
      <span className={cn("tabular-nums", active ? "text-background/70" : "text-muted-foreground")}>
        {count}
      </span>
    </button>
  );
}
