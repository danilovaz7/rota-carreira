"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Application, JobProfile } from "@/types/job-hunt";
import { loadApplications, loadProfile } from "@/lib/storage";
import { ProfileForm } from "@/components/profile-form";
import { LinkedInHub } from "@/components/linkedin-hub";
import { DiscoverJobs } from "@/components/discover-jobs";
import { ApplicationTracker } from "@/components/application-tracker";
import { PrepareApply } from "@/components/prepare-apply";

export function JobHuntApp() {
  const [profile, setProfile] = useState<JobProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [tab, setTab] = useState("hoje");

  useEffect(() => {
    setProfile(loadProfile());
    setApplications(loadApplications());
  }, []);

  const [appliedToday, setAppliedToday] = useState(0);

  useEffect(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    setAppliedToday(
      applications.filter(
        (a) =>
          a.status === "applied" &&
          a.appliedAt &&
          new Date(a.appliedAt) >= start,
      ).length,
    );
  }, [applications]);

  if (!profile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Carregando…
      </div>
    );
  }

  const goal = profile.dailyApplyGoal || 5;
  const progress = Math.min(100, Math.round((appliedToday / goal) * 100));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Central de emprego
          </h1>
          <Badge variant="secondary">LinkedIn + rastreador</Badge>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Encontre mais vagas, prepare cada candidatura e registre o que já
          aplicou. No LinkedIn você ainda clica em “Candidatar-se” — aqui você
          ganha velocidade e organização.
        </p>
      </header>

      <section className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm font-medium">Meta de hoje</p>
            <p className="text-2xl font-semibold tabular-nums">
              {appliedToday}{" "}
              <span className="text-base font-normal text-muted-foreground">
                / {goal} candidaturas
              </span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Dica: 5 candidaturas bem feitas &gt; 20 genéricas.
          </p>
        </div>
        <Progress value={progress} className="h-2" />
      </section>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="hoje">Rotina</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          <TabsTrigger value="vagas">Vagas remotas</TabsTrigger>
          <TabsTrigger value="preparar">Preparar</TabsTrigger>
          <TabsTrigger value="rastreador">Rastreador</TabsTrigger>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="hoje" className="mt-4 space-y-4">
          <div className="rounded-xl border bg-muted/30 p-4 text-sm leading-relaxed">
            <p className="font-medium">Rotina sugerida (45–60 min)</p>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-muted-foreground">
              <li>
                Abra{" "}
                <button
                  type="button"
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                  onClick={() => setTab("linkedin")}
                >
                  buscas no LinkedIn
                </button>{" "}
                (comece por Remoto + Easy Apply).
              </li>
              <li>
                Salve 10–15 vagas no rastreador como “Salva” enquanto navega.
              </li>
              <li>
                Para cada vaga boa, use{" "}
                <button
                  type="button"
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                  onClick={() => setTab("preparar")}
                >
                  Preparar
                </button>{" "}
                e aplique no LinkedIn.
              </li>
              <li>Marque como “Aplicada” e anote data/contato.</li>
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">
              No chat do Cursor, cole o link da vaga e peça: “ajusta meu
              resumo para esta vaga” — eu personalizo texto com você.
            </p>
          </div>
          <LinkedInHub profile={profile} compact />
        </TabsContent>

        <TabsContent value="linkedin" className="mt-4">
          <LinkedInHub profile={profile} />
        </TabsContent>

        <TabsContent value="vagas" className="mt-4">
          <DiscoverJobs
            profile={profile}
            applications={applications}
            onApplicationsChange={setApplications}
          />
        </TabsContent>

        <TabsContent value="preparar" className="mt-4">
          <PrepareApply
            profile={profile}
            applications={applications}
            onApplicationsChange={setApplications}
          />
        </TabsContent>

        <TabsContent value="rastreador" className="mt-4">
          <ApplicationTracker
            applications={applications}
            onApplicationsChange={setApplications}
          />
        </TabsContent>

        <TabsContent value="perfil" className="mt-4">
          <ProfileForm profile={profile} onProfileChange={setProfile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
