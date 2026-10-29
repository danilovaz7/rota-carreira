"use client";

import { useCallback, useEffect, useState } from "react";
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
import type { Application, JobProfile } from "@/types/job-hunt";
import type { ScoredJob } from "@/lib/jobs/types";
import { newApplicationId, saveApplications } from "@/lib/storage";

type Props = {
  profile: JobProfile;
  applications: Application[];
  onApplicationsChange: (apps: Application[]) => void;
};

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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: "35",
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
    const next = [app, ...applications];
    onApplicationsChange(next);
    saveApplications(next);
  }

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Vagas para você</CardTitle>
        <CardDescription>
          Buscamos links automaticamente (LinkedIn BR + APIs remotas), filtramos{" "}
          estágio e priorizamos trainee/júnior{" "}
          alinhadas ao seu currículo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={() => void load()} disabled={loading}>
            {loading ? "Procurando vagas…" : "Atualizar lista"}
          </Button>
          {data && !loading && (
            <span className="text-xs text-muted-foreground">
              {data.count} links · {data.scanned} vagas analisadas
            </span>
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

        {!loading && data && data.jobs.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma vaga passou nos filtros agora. Toque em Atualizar em alguns
            minutos ou ajuste skills em Perfil.
          </p>
        )}

        <ul className="space-y-3">
          {data?.jobs.map((job) => (
            <li
              key={job.id}
              className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="tabular-nums">{job.score}% fit</Badge>
                  <Badge variant="outline">{job.source}</Badge>
                </div>
                <p className="font-semibold leading-snug">{job.title}</p>
                <p className="text-sm text-muted-foreground">
                  {job.company}
                  {job.location ? ` · ${job.location}` : ""}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {job.reasons.join(" · ")}
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
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isSaved(job.url)}
                  onClick={() => saveJob(job)}
                >
                  {isSaved(job.url) ? "Salva" : "Salvar"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
