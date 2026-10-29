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

type RemotiveJob = {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category: string;
  publication_date: string;
  candidate_required_location: string;
  tags: string[];
};

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
    profile.keywords.split(/\s+/).slice(0, 3).join(" "),
  );
  const [jobs, setJobs] = useState<RemotiveJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = encodeURIComponent(search.trim());
      const res = await fetch(`/api/jobs/remotive?search=${q}&limit=40`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha na busca");
      setJobs(data.jobs ?? []);
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

  function saveJob(job: RemotiveJob) {
    if (isSaved(job.url)) return;
    const app: Application = {
      id: newApplicationId(),
      company: job.company_name,
      title: job.title,
      url: job.url,
      source: "Remotive",
      status: "saved",
      notes: "",
      jobDescription: "",
      createdAt: new Date().toISOString(),
    };
    const next = [app, ...applications];
    onApplicationsChange(next);
    saveApplications(next);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vagas remotas (Remotive)</CardTitle>
        <CardDescription>
          Lista complementar ao LinkedIn. Abra o link original, leia a vaga e
          aplique no site da empresa ou onde indicado. Fonte:{" "}
          <a
            href="https://remotive.com"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            remotive.com
          </a>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ex: react brazil backend"
            onKeyDown={(e) => e.key === "Enter" && void fetchJobs()}
          />
          <Button type="button" onClick={() => void fetchJobs()} disabled={loading}>
            {loading ? "Buscando…" : "Buscar"}
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
              Nenhuma vaga com esses filtros. Tente termos mais genéricos (ex:
              &quot;software&quot;, &quot;frontend&quot;).
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
                  {job.company_name} · {job.category}
                </p>
                <div className="flex flex-wrap gap-1">
                  {(job.tags ?? []).slice(0, 5).map((t) => (
                    <Badge key={t} variant="outline" className="text-xs">
                      {t}
                    </Badge>
                  ))}
                </div>
                {job.candidate_required_location && (
                  <p className="text-xs text-muted-foreground">
                    Local: {job.candidate_required_location}
                  </p>
                )}
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
                  {isSaved(job.url) ? "Salva" : "Salvar no rastreador"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
