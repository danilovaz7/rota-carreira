"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  Bookmark,
  BookmarkCheck,
  Building2,
  Check,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  GraduationCap,
  MapPin,
  RefreshCw,
  SearchX,
  Sparkles,
  Undo2,
  Wifi,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Application, ApplicationStatus, JobProfile } from "@/types/job-hunt";
import type { ScoredJob } from "@/lib/jobs/types";
import { isInternshipJob } from "@/lib/jobs/profile-matcher";
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
  { value: "onsite", label: "Presencial · SP/Santos" },
];

type OriginFilter = "all" | "linkedin" | "gupy" | "company" | "remote-boards";

const ORIGIN_LABELS: Record<Exclude<OriginFilter, "all">, string> = {
  linkedin: "LinkedIn",
  gupy: "Gupy",
  company: "Sites de empresas",
  "remote-boards": "Sites remotos",
};

function originOf(job: ScoredJob): Exclude<OriginFilter, "all"> {
  if (job.source === "LinkedIn") return "linkedin";
  if (job.source === "Gupy") return "gupy";
  if (job.source === "Site da empresa") return "company";
  return "remote-boards";
}

function sourceLabel(job: ScoredJob): string {
  if (job.source === "Gupy") return "Site da empresa · Gupy";
  return job.source;
}

function formatAge(ageDays: number | null): string {
  if (ageDays === null) return "Data não informada";
  if (ageDays === 0) return "Hoje";
  if (ageDays === 1) return "Ontem";
  return `Há ${ageDays} dias`;
}

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];

function avatarFor(company: string) {
  const clean = company.replace(/[^\p{L}\p{N} ]/gu, "").trim() || "?";
  const initials = clean
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  let hash = 0;
  for (const ch of company) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return { initials, color: AVATAR_COLORS[hash % AVATAR_COLORS.length] };
}

function fitStyle(score: number) {
  if (score >= 70) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (score >= 50) return "bg-indigo-50 text-indigo-700 ring-indigo-200";
  return "bg-slate-50 text-slate-600 ring-slate-200";
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function JobSkeleton() {
  return (
    <li className="animate-pulse rounded-2xl border bg-card p-4">
      <div className="flex gap-3">
        <div className="size-11 shrink-0 rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
          <div className="h-3 w-1/3 rounded bg-muted" />
        </div>
      </div>
    </li>
  );
}

type ApiResponse = {
  jobs: ScoredJob[];
  scanned: number;
  count: number;
  refreshedAt: string;
  filters?: { focus?: string; searchTerms?: string[] };
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
  const [originFilter, setOriginFilter] = useState<OriginFilter>("all");
  const [onlyNew, setOnlyNew] = useState(false);
  const [onlyInternships, setOnlyInternships] = useState(false);
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

  const onlyInternshipFilter = profile.includeInternships && onlyInternships;

  const visibleJobs = useMemo(() => {
    const jobs = (data?.jobs ?? []).filter(
      (j) =>
        (showSent || !sentUrls.has(j.url)) &&
        (workplaceFilter === "all" || j.workplace === workplaceFilter) &&
        (originFilter === "all" || originOf(j) === originFilter) &&
        (!onlyNew || j.isNew) &&
        (!onlyInternshipFilter || isInternshipJob(j)),
    );
    if (sortMode === "newest") {
      return [...jobs].sort(
        (a, b) => (a.ageDays ?? 99) - (b.ageDays ?? 99) || b.score - a.score,
      );
    }
    return jobs;
  }, [data, workplaceFilter, originFilter, onlyNew, onlyInternshipFilter, sortMode, showSent, sentUrls]);

  const internshipCount = useMemo(() => {
    if (!profile.includeInternships) return 0;
    return (data?.jobs ?? []).filter(
      (j) => (showSent || !sentUrls.has(j.url)) && isInternshipJob(j),
    ).length;
  }, [data, profile.includeInternships, showSent, sentUrls]);

  const originCounts = useMemo(() => {
    const counts: Partial<Record<Exclude<OriginFilter, "all">, number>> = {};
    for (const j of data?.jobs ?? []) {
      if (!showSent && sentUrls.has(j.url)) continue;
      const o = originOf(j);
      counts[o] = (counts[o] ?? 0) + 1;
    }
    return counts;
  }, [data, showSent, sentUrls]);

  const newCount = useMemo(
    () => (data?.jobs ?? []).filter((j) => j.isNew).length,
    [data],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: profile.includeInternships ? "100" : "80",
        fullName: profile.fullName,
        headline: profile.headline,
        skills: profile.skills,
        keywords: profile.keywords,
        location: profile.location,
        resumeSummary: profile.resumeSummary,
        includeInternships: String(profile.includeInternships),
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
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Vagas para você</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Vagas de entrada (trainee/júnior) alinhadas ao{" "}
            <span className="font-medium text-foreground">
              {profile.headline.trim() || "seu perfil de busca"}
            </span>
            . LinkedIn, Gupy e sites de empresas. Remoto em todo o Brasil;
            presencial só em SP, Santos e região.
            {data?.filters?.searchTerms?.length ? (
              <>
                {" "}
                <span className="text-xs">
                  Buscando: {data.filters.searchTerms.slice(0, 4).join(" · ")}
                </span>
              </>
            ) : null}
          </p>
        </div>
        <Button type="button" onClick={() => void load()} disabled={loading} className="gap-2">
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          {loading ? "Buscando…" : "Atualizar"}
        </Button>
      </div>

      {data && !loading && (
        <div className="grid grid-cols-3 gap-2 sm:max-w-md">
          {[
            { label: "Vagas", value: data.count - hiddenSentCount },
            { label: "Novas", value: newCount },
            { label: "Analisadas", value: data.scanned.toLocaleString("pt-BR") },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-card px-3 py-2 text-center shadow-xs">
              <p className="text-lg font-semibold tabular-nums">{s.value}</p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="sticky top-0 z-10 -mx-4 bg-background/85 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-xl sm:px-0">
        <div className="scrollbar-none flex gap-2 overflow-x-auto">
          {WORKPLACE_FILTERS.map((f) => (
            <Chip
              key={f.value}
              active={workplaceFilter === f.value}
              onClick={() => setWorkplaceFilter(f.value)}
            >
              {f.value === "remote" && <Wifi className="size-3.5" />}
              {f.value === "onsite" && <MapPin className="size-3.5" />}
              {f.label}
            </Chip>
          ))}
          <Chip active={onlyNew} onClick={() => setOnlyNew((v) => !v)}>
            <Sparkles className="size-3.5" />
            Só novas
          </Chip>
          {profile.includeInternships && (
            <Chip active={onlyInternshipFilter} onClick={() => setOnlyInternships((v) => !v)}>
              <GraduationCap className="size-3.5" />
              Só estágio
              {internshipCount > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs tabular-nums",
                    onlyInternshipFilter ? "bg-white/20" : "bg-muted text-muted-foreground",
                  )}
                >
                  {internshipCount}
                </span>
              )}
            </Chip>
          )}
          <Chip
            active={sortMode === "newest"}
            onClick={() => setSortMode((m) => (m === "fit" ? "newest" : "fit"))}
          >
            <ArrowUpDown className="size-3.5" />
            {sortMode === "fit" ? "Melhor encaixe" : "Mais novas"}
          </Chip>
          {hiddenSentCount > 0 && (
            <Chip active={showSent} onClick={() => setShowSent((v) => !v)}>
              {showSent ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              Enviadas ({hiddenSentCount})
            </Chip>
          )}
        </div>
        {data && !loading && (
          <div className="scrollbar-none mt-2 flex items-center gap-2 overflow-x-auto">
            <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Origem
            </span>
            <Chip active={originFilter === "all"} onClick={() => setOriginFilter("all")}>
              Todas
            </Chip>
            {(Object.keys(ORIGIN_LABELS) as Exclude<OriginFilter, "all">[])
              .filter((o) => originCounts[o])
              .map((o) => (
                <Chip key={o} active={originFilter === o} onClick={() => setOriginFilter(o)}>
                  {ORIGIN_LABELS[o]}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-xs tabular-nums",
                      originFilter === o ? "bg-white/20" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {originCounts[o]}
                  </span>
                </Chip>
              ))}
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
        >
          <p className="font-medium text-destructive">Não deu para buscar as vagas agora.</p>
          <p className="text-muted-foreground">{error}</p>
          <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Varrendo LinkedIn e sites de empresas… na primeira vez pode levar uns 20 segundos.
          </p>
          <ul className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <JobSkeleton key={i} />
            ))}
          </ul>
        </div>
      )}

      {!loading && data && visibleJobs.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
          <SearchX className="size-8 text-muted-foreground" />
          <p className="font-medium">Nenhuma vaga com esses filtros</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Troque o filtro ou toque em Atualizar daqui a pouco — vagas novas
            entram ao longo do dia.
          </p>
        </div>
      )}

      {!loading && (
        <ul className="space-y-3">
          {visibleJobs.map((job) => {
            const sent = sentUrls.has(job.url);
            const saved = isSaved(job.url);
            const avatar = avatarFor(job.company);
            return (
              <li
                key={job.id}
                className={cn(
                  "group rounded-2xl border bg-card p-4 shadow-xs transition-shadow hover:shadow-md",
                  sent && "opacity-60",
                )}
              >
                <div className="flex gap-3">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold",
                      avatar.color,
                    )}
                    aria-hidden
                  >
                    {avatar.initials}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold leading-snug hover:text-primary"
                      >
                        {job.title}
                      </a>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ring-1",
                          fitStyle(job.score),
                        )}
                        title="Encaixe com seu currículo"
                      >
                        {job.score}%
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="size-3.5" />
                        {job.company}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        {job.workplace === "remote" ? (
                          <Wifi className="size-3.5" />
                        ) : (
                          <MapPin className="size-3.5" />
                        )}
                        {job.workplace === "remote"
                          ? "Remoto"
                          : job.location.split(",")[0] || "Presencial"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {formatAge(job.ageDays)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {sent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <Check className="size-3" />
                          Enviada
                        </span>
                      )}
                      {job.isNew && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <Sparkles className="size-3" />
                          Nova
                        </span>
                      )}
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {sourceLabel(job)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ size: "lg" }), "flex-1 gap-2")}
                  >
                    Abrir vaga
                    <ExternalLink className="size-4" />
                  </a>
                  {sent ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="gap-2"
                      onClick={() => undoSent(job)}
                    >
                      <Undo2 className="size-4" />
                      Desfazer
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        className="gap-2"
                        onClick={() => markSent(job)}
                      >
                        <Check className="size-4" />
                        Já enviei
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-lg"
                        disabled={saved}
                        onClick={() => saveJob(job)}
                        aria-label={saved ? "Vaga salva" : "Salvar para depois"}
                        title={saved ? "Vaga salva" : "Salvar para depois"}
                      >
                        {saved ? (
                          <BookmarkCheck className="size-4 text-primary" />
                        ) : (
                          <Bookmark className="size-4" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <details className="rounded-2xl border bg-card p-4 text-sm">
        <summary className="cursor-pointer font-medium">Sites de empresas monitorados</summary>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          {MONITORED_COMPANIES.join(" · ")}
        </p>
      </details>
    </section>
  );
}
