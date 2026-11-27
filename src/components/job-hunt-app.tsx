"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CircleHelp,
  Globe,
  ListChecks,
  NotebookPen,
  Route,
  Sparkles,
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
import { cn } from "@/lib/utils";

/** `short` é o rótulo da barra inferior no celular, onde cabem ~9 letras. */
const TABS: { value: string; label: string; short: string; icon: LucideIcon }[] = [
  { value: "para-voce", label: "Para você", short: "Para você", icon: Sparkles },
  { value: "rastreador", label: "Minhas vagas", short: "Minhas", icon: ListChecks },
  { value: "outros-sites", label: "Outros sites", short: "Sites", icon: Globe },
  { value: "preparar", label: "Preparar", short: "Preparar", icon: NotebookPen },
  { value: "perfil", label: "Perfil", short: "Perfil", icon: UserRound },
];

/**
 * Meta do dia desenhada como uma rota: cada candidatura é uma parada.
 * Com meta muito alta (mais de 15) vira uma barra simples para não espremer os pontos.
 */
function DailyRoute({ done, goal }: { done: number; goal: number }) {
  if (goal > 15) {
    const pct = Math.min(100, Math.round((done / goal) * 100));
    return (
      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    );
  }
  return (
    <ol className="flex items-center" aria-hidden>
      {Array.from({ length: goal }, (_, i) => (
        <li key={i} className={cn("flex items-center", i > 0 && "flex-1")}>
          {i > 0 && (
            <span
              className={cn(
                "h-0.5 flex-1 transition-colors duration-300",
                i < done ? "bg-primary" : "bg-border",
              )}
            />
          )}
          <span
            className={cn(
              "size-2.5 shrink-0 rounded-full border-2 transition-colors duration-300",
              i < done ? "border-primary bg-primary" : "border-border bg-card",
            )}
          />
        </li>
      ))}
    </ol>
  );
}

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
  const remaining = Math.max(0, goal - appliedToday);

  const sentTotal = applications.filter(
    (a) => a.status !== "saved" && a.status !== "dismissed",
  ).length;
  const firstName = profile.fullName.trim().split(/\s+/)[0];
  const syncActive = sync.code !== null && sync.state !== "off";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-28 pt-4 sm:px-6 sm:pt-8 md:pb-16 lg:max-w-5xl">
      <header className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Route className="size-4" />
            </span>
            Rota Carreira
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTourOpen(true)}
              aria-label="Como usar"
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <CircleHelp className="size-4" />
              <span className="max-sm:sr-only">Como usar</span>
            </button>
            <SyncStatusPill sync={sync} onOpenSettings={openSync} />
          </div>
        </div>

        <section
          aria-label="Meta de hoje"
          className="flex items-end justify-between gap-4 rounded-2xl border bg-card p-4 sm:p-5"
        >
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {firstName ? `Hoje, ${firstName}` : "Hoje"}
              </p>
              <h1 className="mt-0.5 text-xl font-semibold tracking-tight sm:text-2xl">
                <span className="tabular-nums">{appliedToday}</span>
                <span className="text-muted-foreground"> de {goal} candidaturas</span>
              </h1>
            </div>
            <DailyRoute done={appliedToday} goal={goal} />
            <p className="text-xs text-muted-foreground">
              {remaining > 0
                ? `Faltam ${remaining} para a meta. Marque "Já enviei" em cada vaga que mandar.`
                : "Meta do dia batida. O que vier agora é bônus."}
            </p>
          </div>
          <div className="shrink-0 border-l pl-4 text-right">
            <p className="text-2xl font-semibold tabular-nums sm:text-3xl">{sentTotal}</p>
            <p className="text-xs text-muted-foreground">enviadas<br className="sm:hidden" /> no total</p>
          </div>
        </section>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="w-full gap-4">
        {/* Celular: barra fixa embaixo (todas as abas visíveis, perto do polegar). PC: abas com sublinhado. */}
        <TabsList
          variant="line"
          className="h-auto w-full gap-0 p-0 group-data-horizontal/tabs:h-auto max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 max-md:grid max-md:grid-cols-5 max-md:rounded-none max-md:border-t max-md:bg-card/95 max-md:px-1 max-md:pt-1 max-md:pb-[max(0.25rem,env(safe-area-inset-bottom))] max-md:backdrop-blur md:justify-start md:gap-1 md:border-b"
        >
          {TABS.map(({ value, label, short, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              aria-label={label}
              className="h-auto rounded-lg text-muted-foreground data-active:text-primary max-md:flex-col max-md:gap-1 max-md:py-2 max-md:text-[11px] max-md:after:hidden md:flex-none md:gap-2 md:rounded-none md:px-3 md:py-3 md:text-sm md:data-active:text-foreground md:after:bottom-[-1px] md:after:bg-primary"
            >
              <Icon className="size-5 md:size-4" />
              <span className="md:hidden">{short}</span>
              <span className="max-md:hidden">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="para-voce" className="md:mt-2 space-y-4">
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

        <TabsContent value="outros-sites" className="md:mt-2 space-y-6">
          <p className="text-sm text-muted-foreground">
            O <strong className="text-foreground">Para você</strong> já busca sozinho no LinkedIn, na Gupy e
            nos sites das empresas. Aqui ficam os atalhos para o que ele não cobre: buscas prontas no
            LinkedIn (para criar alertas), outros portais brasileiros e vagas remotas internacionais.
          </p>
          <LinkedInHub profile={profile} />
          <DiscoverJobs
            profile={profile}
            applications={applications}
            onApplicationsChange={setApplications}
          />
        </TabsContent>

        <TabsContent value="preparar" className="md:mt-2">
          <PrepareApply
            profile={profile}
            applications={applications}
            onApplicationsChange={setApplications}
          />
        </TabsContent>

        <TabsContent value="rastreador" className="md:mt-2">
          <ApplicationTracker
            applications={applications}
            onApplicationsChange={setApplications}
          />
        </TabsContent>

        <TabsContent value="perfil" className="md:mt-2 space-y-6">
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
