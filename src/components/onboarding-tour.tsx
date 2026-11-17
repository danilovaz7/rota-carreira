"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CloudUpload,
  HardDrive,
  KeyRound,
  ListChecks,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DONE_KEY = "rota-carreira-onboarding-v1";

export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(DONE_KEY) === "1";
  } catch {
    return true;
  }
}

function markOnboardingSeen() {
  try {
    localStorage.setItem(DONE_KEY, "1");
  } catch {
    // navegador sem armazenamento: o tutorial só volta a aparecer
  }
}

type Point = { icon: LucideIcon; title: string; text: string };

type Step = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  intro: string;
  points: Point[];
  tone: string;
};

const STEPS: Step[] = [
  {
    icon: Sparkles,
    eyebrow: "Bem-vindo",
    title: "Suas vagas chegam prontas aqui",
    intro:
      "O site procura vagas no LinkedIn, na Gupy e nos sites de carreira das empresas, filtra o que combina com você e mostra tudo numa lista só, da melhor para a pior.",
    tone: "from-indigo-500 to-violet-500",
    points: [
      { icon: Search, title: "Para você", text: "As vagas que combinam com o seu perfil, com a nota de encaixe e o motivo." },
      { icon: ListChecks, title: "Rastreador", text: "Tudo o que você salvou ou já enviou, para não se perder." },
      { icon: CheckCircle2, title: "Meta do dia", text: "Quantas candidaturas você mandou hoje, no topo da página." },
    ],
  },
  {
    icon: UserRound,
    eyebrow: "Passo 1",
    title: "Monte seu perfil de busca",
    intro:
      "Sem perfil o site não sabe o que procurar. Vá na aba Perfil e preencha o básico. Leva 2 minutos.",
    tone: "from-sky-500 to-indigo-500",
    points: [
      { icon: Sparkles, title: "Comece por um modelo", text: "Desenvolvimento, Dados e BI, Design ou Power Platform. Ele preenche tudo e você ajusta." },
      { icon: Search, title: "Palavras-chave", text: "Cada item separado por vírgula vira uma busca. Ex.: desenvolvedor react júnior, analista de dados júnior." },
      { icon: CheckCircle2, title: "Skills", text: "As mais importantes primeiro. Cada skill encontrada na vaga aumenta a nota de encaixe." },
    ],
  },
  {
    icon: SlidersHorizontal,
    eyebrow: "Passo 2",
    title: "Deixe a busca do seu jeito",
    intro: "Ainda na aba Perfil, cada opção muda na hora o que aparece em Para você.",
    tone: "from-emerald-500 to-teal-500",
    points: [
      { icon: MapPin, title: "Onde trabalhar", text: "Remoto, presencial ou híbrido, e em quais regiões ou cidades." },
      { icon: SlidersHorizontal, title: "Nível e filtros", text: "Incluir estágio ou pleno, idade máxima das vagas e encaixe mínimo." },
      { icon: Search, title: "Fontes e termos a evitar", text: "Escolha onde procurar e esconda vagas com palavras que não te interessam (ex.: vendas)." },
    ],
  },
  {
    icon: HardDrive,
    eyebrow: "Passo 3 · importante",
    title: "Seus dados ficam só neste navegador",
    intro:
      "Não existe login. Perfil e candidaturas são salvos no navegador deste aparelho. Se você limpar os dados do navegador, usar aba anônima ou trocar de aparelho, eles não vão junto.",
    tone: "from-amber-500 to-orange-500",
    points: [
      { icon: KeyRound, title: "Gere um código de sincronização", text: "Em Perfil → “Celular e PC sempre iguais”, toque em Gerar código, crie um PIN e ative. Anote os dois." },
      { icon: CloudUpload, title: "Salvo na nuvem, criptografado", text: "Com o código ativo, tudo é salvo sozinho. Em outro aparelho, use o mesmo código e PIN e seus dados aparecem." },
      { icon: HardDrive, title: "Sem nuvem?", text: "Use “Copiar backup” e guarde o texto (e-mail, WhatsApp, notas). Para restaurar, é só colar." },
    ],
  },
  {
    icon: CheckCircle2,
    eyebrow: "Pronto",
    title: "Sua rotina no dia a dia",
    intro: "Depois de configurar, o uso diário é rápido.",
    tone: "from-violet-500 to-fuchsia-500",
    points: [
      { icon: Search, title: "1. Abra Para você", text: "Veja as vagas novas e as de maior encaixe primeiro." },
      { icon: ArrowRight, title: "2. Candidate-se", text: "Abra a vaga, mande o currículo e volte aqui." },
      { icon: ListChecks, title: "3. Marque “Já enviei”", text: "A vaga vai para o Rastreador e conta na sua meta do dia." },
    ],
  },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado no último passo, para levar a pessoa direto ao Perfil. */
  onFinish: () => void;
};

export function OnboardingTour({ open, onOpenChange, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const last = index === STEPS.length - 1;
  const Icon = step.icon;

  function close(next: boolean) {
    if (!next) {
      markOnboardingSeen();
      setIndex(0);
    }
    onOpenChange(next);
  }

  function finish() {
    markOnboardingSeen();
    setIndex(0);
    onOpenChange(false);
    onFinish();
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="flex max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 [&>[data-slot=dialog-close]]:text-white [&>[data-slot=dialog-close]]:hover:bg-white/20 sm:max-h-[calc(100dvh-4rem)] sm:max-w-lg">
        <div className={cn("relative shrink-0 bg-gradient-to-br px-4 py-4 pr-10 text-white sm:p-6 sm:pr-12", step.tone)}>
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/15 blur-2xl"
          />
          <div className="relative flex items-center gap-3 sm:items-start sm:gap-4">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur sm:size-12 sm:rounded-2xl">
              <Icon className="size-5 sm:size-6" />
            </div>
            <div className="min-w-0 space-y-0.5 sm:space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/80 sm:text-xs">
                {step.eyebrow}
              </p>
              <DialogTitle className="text-base font-semibold leading-snug text-white sm:text-xl">
                {step.title}
              </DialogTitle>
            </div>
          </div>
        </div>

        <div
          key={index}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:space-y-4 sm:p-6">
          <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
            {step.intro}
          </DialogDescription>

          <ul className="space-y-2 sm:space-y-3">
            {step.points.map((p) => {
              const PointIcon = p.icon;
              return (
                <li key={p.title} className="flex gap-2.5 rounded-xl border bg-muted/30 p-2.5 sm:gap-3 sm:p-3">
                  <PointIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium text-foreground">{p.title}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{p.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="shrink-0 space-y-3 border-t bg-popover px-4 py-3 sm:flex sm:items-center sm:justify-between sm:gap-3 sm:space-y-0 sm:px-6 sm:py-4">
          <div
            className="flex items-center justify-center gap-1.5 sm:justify-start"
            aria-label={`Passo ${index + 1} de ${STEPS.length}`}
          >
            {STEPS.map((s, i) => (
              <button
                key={s.title}
                type="button"
                aria-label={`Ir para o passo ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60",
                )}
              />
            ))}
            <span className="ml-2 text-xs text-muted-foreground sm:hidden">
              {index + 1}/{STEPS.length}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {index === 0 ? (
              <Button type="button" variant="ghost" onClick={() => close(false)}>
                Pular
              </Button>
            ) : (
              <Button type="button" variant="ghost" className="gap-1" onClick={() => setIndex(index - 1)}>
                <ArrowLeft className="size-4" />
                Voltar
              </Button>
            )}
            {last ? (
              <Button type="button" className="gap-1" onClick={finish}>
                <span className="sm:hidden">Ir ao perfil</span>
                <span className="hidden sm:inline">Montar meu perfil</span>
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button type="button" className="gap-1" onClick={() => setIndex(index + 1)}>
                Próximo
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
