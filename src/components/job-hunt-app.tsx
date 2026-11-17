"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BriefcaseBusiness,
  CalendarCheck,
  CircleHelp,
  ListChecks,
  NotebookPen,
  Search,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import type { Application, JobProfile } from "@/types/job-hunt";
import { loadApplications, loadProfile } from "@/lib/storage";
import { ProfileForm } from "@/components/profile-form";
import { SyncPanel } from "@/components/sync-panel";
import { LinkedInHub } from "@/components/linkedin-hub";
import { DiscoverJobs } from "@/components/discover-jobs";
import { ApplicationTracker } from "@/components/application-tracker";
import { PrepareApply } from "@/components/prepare-apply";
import { ForYouJobs } from "@/components/for-you-jobs";
import { SyncStatusPill } from "@/components/sync-status-pill";
import { useAutoSync } from "@/hooks/use-auto-sync";
import { OnboardingTour, hasSeenOnboarding } from "@/components/onboarding-tour";
import { GettingStarted } from "@/components/getting-started";
import { isProfileConfigured } from "@/lib/profile";

const TABS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "para-voce", label: "Para você", icon: Sparkles },
  { value: "rastreador", label: "Rastreador", icon: ListChecks },
  { value: "vagas", label: "Achar vagas", icon: Search },
  { value: "linkedin", label: "LinkedIn", icon: BriefcaseBusiness },
  { value: "preparar", label: "Preparar", icon: NotebookPen },
  { value: "hoje", label: "Rotina", icon: CalendarCheck },
  { value: "perfil", label: "Perfil", icon: UserRound },
];

export function JobHuntApp() {
  const [profile, setProfile] = useState<JobProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [tab, setTab] = useState("para-voce");
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setApplications(loadApplications());
    // Primeira visita: mostra o tutorial.
    if (!hasSeenOnboarding()) setTourOpen(true);
  }, []);

  const openProfile = useCallback(() => {
    setTab("perfil");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const openSync = useCallback(() => {
    setTab("perfil");
    // Espera a aba montar para rolar até o painel de sincronização.
    window.setTimeout(() => {
      document.getElementById("sincronizacao")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }, []);

  const reloadFromStorage = useCallback(() => {
    setProfile(loadProfile());
    setApplications(loadApplications());
  }, []);
  const changeKey = useMemo(() => [profile, applications], [profile, applications]);
  const sync = useAutoSync({
    ready: profile !== null,
    changeKey,
    onRemoteApplied: reloadFromStorage,
  });

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

  const sentTotal = applications.filter((a) => a.status !== "saved").length;
  const firstName = profile.fullName.trim().split(/\s+/)[0];
  const syncActive = sync.code !== null && sync.state !== "off";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-16 pt-6 sm:px-6 sm:pt-10 lg:max-w-5xl">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-5 text-white shadow-lg shadow-indigo-600/20 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl"
        />
        <div className="relative space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-100">
              <BriefcaseBusiness className="size-4" />
              Central de Emprego
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTourOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/25 transition-colors hover:bg-white/25"
              >
                <CircleHelp className="size-3.5" />
                Como usar
              </button>
              <SyncStatusPill sync={sync} onOpenSettings={openSync} />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {firstName ? `Bora, ${firstName}!` : "Bora achar sua vaga!"}
            </h1>
            <p className="max-w-lg text-sm text-indigo-100 sm:text-base">
              As vagas chegam prontas aqui. Abra o link, candidate-se e marque
              como enviada.
            </p>
          </div>

          <div className="grid grid-cols-[1fr_auto] items-stretch gap-3">
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1.5 text-indigo-100">
                  <Target className="size-4" />
                  Meta de hoje
                </span>
                <span className="font-semibold tabular-nums">
                  {appliedToday}/{goal}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-2.5 text-center ring-1 ring-white/15 backdrop-blur">
              <p className="text-xl font-semibold tabular-nums">{sentTotal}</p>
              <p className="text-[11px] uppercase tracking-wide text-indigo-100">Enviadas</p>
            </div>
          </div>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="w-full gap-4">
        <TabsList className="h-auto w-full rounded-2xl bg-card p-1.5 shadow-xs ring-1 ring-border max-md:flex max-md:justify-start max-md:gap-1 max-md:overflow-x-auto max-md:[scrollbar-width:thin] max-md:[&::-webkit-scrollbar]:h-1.5 max-md:[&::-webkit-scrollbar-thumb]:rounded-full max-md:[&::-webkit-scrollbar-thumb]:bg-border md:flex md:flex-nowrap md:gap-1 md:overflow-visible md:p-2">
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="max-md:shrink-0 max-md:gap-1.5 max-md:px-3 max-md:py-2 md:!flex-none md:basis-0 md:grow md:gap-1.5 md:rounded-xl md:px-1 md:py-3 md:text-[13px] md:leading-snug lg:gap-2 lg:px-2 lg:text-sm xl:py-3.5 data-active:bg-primary data-active:text-primary-foreground md:data-active:shadow-sm"
            >
              <Icon className="size-4 shrink-0 lg:size-[1.125rem]" />
              <span className="max-md:whitespace-nowrap md:text-center md:whitespace-normal md:[text-wrap:balance]">
                {label}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="para-voce" className="mt-4 space-y-4">
          {isProfileConfigured(profile) ? (
            <>
              <GettingStarted
                profileReady
                syncActive={syncActive}
                hasSentApplication={sentTotal > 0}
                onOpenProfile={openProfile}
                onOpenSync={openSync}
                onOpenTour={() => setTourOpen(true)}
              />
              <ForYouJobs
                profile={profile}
                applications={applications}
                onApplicationsChange={setApplications}
              />
            </>
          ) : (
            <GettingStarted
              variant="full"
              profileReady={false}
              syncActive={syncActive}
              hasSentApplication={sentTotal > 0}
              onOpenProfile={openProfile}
              onOpenSync={openSync}
              onOpenTour={() => setTourOpen(true)}
            />
          )}
        </TabsContent>

        <TabsContent value="hoje" className="mt-4 space-y-4">
          <div className="rounded-xl border bg-muted/30 p-4 text-sm leading-relaxed">
            <p className="font-medium">Rotina sugerida (45–60 min)</p>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-muted-foreground">
              <li>
                Abra{" "}
                <button
                  type="button"
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                  onClick={() => setTab("vagas")}
                >
                  Achar vagas
                </button>{" "}
                (Gupy, Programathor, agregador remoto) +{" "}
                <button
                  type="button"
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                  onClick={() => setTab("linkedin")}
                >
                  LinkedIn
                </button>
                .
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
              Dica: na aba Preparar, cole a descrição da vaga para ver o quanto ela
              combina com você e gerar um texto de apresentação.
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

        <TabsContent value="perfil" className="mt-4 space-y-6">
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 text-sm">
            <p className="font-medium">Como funciona esta aba</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>
                <strong className="text-foreground">Salve seus dados:</strong> tudo fica só neste
                navegador. Gere um código + PIN abaixo para guardar na nuvem e abrir no celular e no PC.
              </li>
              <li>
                <strong className="text-foreground">Monte o perfil:</strong> escolha um modelo ou
                escreva suas palavras-chave e skills. A caixa “Buscas que serão feitas” mostra o que
                o site vai procurar.
              </li>
              <li>
                <strong className="text-foreground">Personalize:</strong> nível, onde trabalhar,
                idade das vagas, encaixe mínimo e fontes. Salva sozinho e muda na hora o Para você.
              </li>
            </ol>
          </div>
          <div id="sincronizacao" className="scroll-mt-4">
          <SyncPanel
            profile={profile}
            applications={applications}
            sync={sync}
            onSynced={reloadFromStorage}
          />
          </div>
          <ProfileForm profile={profile} onProfileChange={setProfile} />
        </TabsContent>
      </Tabs>

      <OnboardingTour open={tourOpen} onOpenChange={setTourOpen} onFinish={openProfile} />
    </div>
  );
}
