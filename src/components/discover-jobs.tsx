"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Application, JobProfile } from "@/types/job-hunt";
import { newApplicationId, saveApplications } from "@/lib/storage";
import type { UnifiedJob } from "@/lib/jobs/types";
import { BrazilJobBoards } from "@/components/brazil-job-boards";

type Props = {
  profile: JobProfile;
  applications: Application[];
  onApplicationsChange: (apps: Application[]) => void;
};

export function DiscoverJobs({
  profile,
  applications,
  onApplicationsChange,
}: Props) {
  const [search, setSearch] = useState(
    "react node typescript junior",
  );
  const [jobs, setJobs] = useState<UnifiedJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = encodeURIComponent(search.trim());
      const res = await fetch(`/api/jobs/aggregate?search=${q}&limit=60`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha na busca");
      setJobs(data.jobs ?? []);
      setSources(data.sources ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  function isSaved(url: string) {
    return applications.some((a) => a.url === url);
  }

  function saveJob(job: UnifiedJob) {
    if (isSaved(job.url)) return;
    const app: Application = {
      id: newApplicationId(),
      company: job.company,
      title: job.title,
      url: job.url,
      source: job.source,
      status: "saved",
      notes: job.location ? `Local: ${job.location}` : "",
      jobDescription: "",
      createdAt: new Date().toISOString(),
    };
    const next = [app, ...applications];
    onApplicationsChange(next);
    saveApplications(next);
  }

  return (
    <div className="space-y-6">
      <BrazilJobBoards profile={profile} />

      <Card>
        <CardHeader>
          <CardTitle>Vagas agregadas (remoto / internacional)</CardTitle>
          <CardDescription>
            Fontes: {sources.length ? sources.join(", ") : "Remotive, RemoteOK, Arbeitnow"}.
            Complemento aos portais BR — filtre por stack e salve no rastreador antes de aplicar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ex: react junior brazil node"
              onKeyDown={(e) => e.key === "Enter" && void fetchJobs()}
            />
            <Button type="button" onClick={() => void fetchJobs()} disabled={loading}>
              {loading ? "Buscando…" : "Buscar vagas"}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <ul className="divide-y rounded-lg border">
            {jobs.length === 0 && !loading && (
              <li className="p-4 text-sm text-muted-foreground">
                Nenhuma vaga com esses termos. Tente &quot;junior&quot;,
                &quot;frontend&quot;, &quot;full stack&quot; ou remova filtros.
              </li>
            )}
            {jobs.map((job) => (
              <li
                key={job.id}
                className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline"
                  >
                    {job.title}
                  </a>
                  <p className="text-sm text-muted-foreground">
                    {job.company}
                    {job.location ? ` · ${job.location}` : ""}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {job.source}
                  </Badge>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {job.tags.slice(0, 6).map((t) => (
                      <Badge key={`${job.id}-${t}`} variant="secondary" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                  >
                    Abrir
                  </a>
                  <Button
                    size="sm"
                    type="button"
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
    </div>
  );
}
