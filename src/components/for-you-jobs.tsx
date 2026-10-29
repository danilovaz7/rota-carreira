"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Application, ApplicationStatus, JobProfile } from "@/types/job-hunt";
import type { ScoredJob } from "@/lib/jobs/types";
import { newApplicationId, saveApplications } from "@/lib/storage";
import { MONITORED_COMPANIES } from "@/lib/jobs/company-sources";

type Props = {
  profile: JobProfile;
  applications: Application[];
  onApplicationsChange: (apps: Application[]) => void;
};

const SENT_STATUSES: ApplicationStatus[] = ["applied", "interview", "offer", "rejected"];

type WorkplaceFilter = "all" | "remote" | "onsite";
type SortMode = "fit" | "newest";

const WORKPLACE_FILTERS: { value: WorkplaceFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "remote", label: "Remoto" },
  { value: "onsite", label: "Presencial/híbrido (SP e Santos)" },
];

function sourceLabel(job: ScoredJob): string {
  if (job.source === "Gupy") return "Site da empresa (Gupy)";
  return job.source;
}

function formatAge(ageDays: number | null): string {
  if (ageDays === null) return "Data não informada";
  if (ageDays === 0) return "Publicada hoje";
  if (ageDays === 1) return "Publicada ontem";
  return `Publicada há ${ageDays} dias`;
}

type ApiResponse = {
  jobs: ScoredJob[];
  scanned: number;
  count: number;
  refreshedAt: string;
  error?: string;
};

export function ForYouJobs({
  profile,
  applications,
  onApplicationsChange,
}: Props) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workplaceFilter, setWorkplaceFilter] = useState<WorkplaceFilter>("all");
  const [onlyNew, setOnlyNew] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("fit");
  const [showSent, setShowSent] = useState(false);

  const sentUrls = useMemo(
    () =>
      new Set(
        applications.filter((a) => SENT_STATUSES.includes(a.status)).map((a) => a.url),
      ),
    [applications],
  );

  const hiddenSentCount = useMemo(
    () => (data?.jobs ?? []).filter((j) => sentUrls.has(j.url)).length,
    [data, sentUrls],
  );

  const visibleJobs = useMemo(() => {
    const jobs = (data?.jobs ?? []).filter(
      (j) =>
        (showSent || !sentUrls.has(j.url)) &&
        (workplaceFilter === "all" || j.workplace === workplaceFilter) &&
        (!onlyNew || j.isNew),
    );
    if (sortMode === "newest") {
      return [...jobs].sort(
        (a, b) => (a.ageDays ?? 99) - (b.ageDays ?? 99) || b.score - a.score,
      );
    }
    return jobs;
  }, [data, workplaceFilter, onlyNew, sortMode, showSent, sentUrls]);

  const newCount = useMemo(
    () => (data?.jobs ?? []).filter((j) => j.isNew).length,
    [data],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: "50",
        headline: profile.headline,
        skills: profile.skills,
        keywords: profile.keywords,
        location: profile.location,
      });
      const res = await fetch(`/api/jobs/for-you?${params}`);
      const json = (await res.json()) as ApiResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Falha ao buscar");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void load();
  }, [load]);

  function isSaved(url: string) {
    return applications.some((a) => a.url === url);
  }

  function saveJob(job: ScoredJob) {
    if (isSaved(job.url)) return;
    const app = {
      id: newApplicationId(),
      company: job.company,
      title: job.title,
      url: job.url,
      source: job.source,
      status: "saved" as const,
      notes: `Match ${job.score}% — ${job.reasons.slice(0, 2).join("; ")}`,
      jobDescription: job.description ?? "",
      createdAt: new Date().toISOString(),
    };
    persist([app, ...applications]);
  }

  function persist(next: Application[]) {
    onApplicationsChange(next);
    saveApplications(next);
  }

  function markSent(job: ScoredJob) {
    const now = new Date().toISOString();
    const existing = applications.find((a) => a.url === job.url);
    if (existing) {
      persist(
        applications.map((a) =>
          a.id === existing.id ? { ...a, status: "applied", appliedAt: a.appliedAt ?? now } : a,
        ),
      );
      return;
    }
    persist([
      {
        id: newApplicationId(),
        company: job.company,
        title: job.title,
        url: job.url,
        source: job.source,
        status: "applied",
        notes: `Match ${job.score}%`,
        jobDescription: job.description ?? "",
        createdAt: now,
        appliedAt: now,
      },
      ...applications,
    ]);
  }

  function undoSent(job: ScoredJob) {
    persist(
      applications.map((a) =>
        a.url === job.url ? { ...a, status: "saved", appliedAt: undefined } : a,
      ),
    );
  }

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Vagas para você</CardTitle>
        <CardDescription>
          Links encontrados automaticamente no LinkedIn e nos sites de
          carreira das empresas, sem estágio, focados em trainee/júnior e no
          seu currículo. Remoto vale de qualquer lugar;
          presencial e híbrido só em São Paulo, Santos e região. Vagas da
          última semana, com as mais novas em destaque.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <details className="rounded-lg border bg-muted/30 p-3 text-sm">
          <summary className="cursor-pointer font-medium">
            Sites de empresas monitorados
          </summary>
          <p className="mt-2 text-muted-foreground">
            {MONITORED_COMPANIES.join(" · ")}
          </p>
        </details>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={() => void load()} disabled={loading}>
            {loading ? "Procurando vagas…" : "Atualizar lista"}
          </Button>
          {data && !loading && (
            <span className="text-xs text-muted-foreground">
              {data.count} links · {newCount} novas · {data.scanned} analisadas
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {WORKPLACE_FILTERS.map((f) => (
            <Button
              key={f.value}
              type="button"
              size="sm"
              variant={workplaceFilter === f.value ? "default" : "outline"}
              onClick={() => setWorkplaceFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant={onlyNew ? "default" : "outline"}
            onClick={() => setOnlyNew((v) => !v)}
          >
            Só novas (até 2 dias)
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setSortMode((m) => (m === "fit" ? "newest" : "fit"))}
          >
            Ordenar: {sortMode === "fit" ? "melhor fit" : "mais novas"}
          </Button>
          {hiddenSentCount > 0 && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowSent((v) => !v)}
            >
              {showSent
                ? "Esconder enviadas"
                : `Mostrar enviadas (${hiddenSentCount})`}
            </Button>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {loading && (
          <p className="text-sm text-muted-foreground">
            Varrendo LinkedIn (Brasil) e bases remotas… pode levar ~20s na
            primeira vez.
          </p>
        )}

        {!loading && data && visibleJobs.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma vaga com esses filtros agora. Troque o filtro ou toque em
            Atualizar lista daqui a pouco.
          </p>
        )}

        <ul className="space-y-3">
          {visibleJobs.map((job) => (
            <li
              key={job.id}
              className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {sentUrls.has(job.url) && <Badge variant="secondary">Enviada</Badge>}
                  {job.isNew && <Badge variant="destructive">Nova</Badge>}
                  <Badge className="tabular-nums">{job.score}% fit</Badge>
                  <Badge variant="outline">
                    {job.workplace === "remote" ? "Remoto" : "Presencial/híbrido"}
                  </Badge>
                  <Badge variant="outline">{sourceLabel(job)}</Badge>
                </div>
                <p className="font-semibold leading-snug">{job.title}</p>
                <p className="text-sm text-muted-foreground">
                  {job.company}
                  {job.location ? ` · ${job.location}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatAge(job.ageDays)}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {job.reasons.filter((r) => r !== "Vaga nova").join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:w-36">
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ size: "lg" }), "w-full text-center")}
                >
                  Abrir vaga
                </a>
                {sentUrls.has(job.url) ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => undoSent(job)}
                  >
                    Desfazer envio
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => markSent(job)}
                    >
                      Já enviei
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isSaved(job.url)}
                      onClick={() => saveJob(job)}
                    >
                      {isSaved(job.url) ? "Salva" : "Salvar para depois"}
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
