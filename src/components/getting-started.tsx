"use client";

import { useState } from "react";
import { CheckCircle2, Circle, CircleHelp, KeyRound, Send, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HIDDEN_KEY = "rota-carreira-checklist-hidden-v1";

function isHidden(): boolean {
  try {
    return localStorage.getItem(HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

type Props = {
  profileReady: boolean;
  syncActive: boolean;
  hasSentApplication: boolean;
  onOpenProfile: () => void;
  onOpenSync: () => void;
  onOpenTour: () => void;
  /** Sem perfil o card vira a tela principal do Para você (não dá para esconder). */
  variant?: "full" | "compact";
};

export function GettingStarted({
  profileReady,
  syncActive,
  hasSentApplication,
  onOpenProfile,
  onOpenSync,
  onOpenTour,
  variant = "compact",
}: Props) {
  const [hidden, setHidden] = useState(isHidden);

  const steps = [
    {
      done: profileReady,
      icon: UserRound,
      title: "Monte seu perfil de busca",
      text: "Escolha um modelo (Dev, Dados, Design…) ou escreva suas palavras-chave e skills.",
      action: { label: "Ir para o Perfil", onClick: onOpenProfile },
    },
    {
      done: syncActive,
      icon: KeyRound,
      title: "Proteja seus dados",
      text: "Eles ficam só neste navegador. Gere um código + PIN para salvar na nuvem e usar no celular e no PC.",
      action: { label: "Gerar código", onClick: onOpenSync },
    },
    {
      done: hasSentApplication,
      icon: Send,
      title: "Mande sua primeira candidatura",
      text: "Abra uma vaga em Para você, candidate-se e toque em “Já enviei”.",
      action: null,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  if (variant === "compact" && (hidden || allDone)) return null;

  function hide() {
    try {
      localStorage.setItem(HIDDEN_KEY, "1");
    } catch {
      // ignora
    }
    setHidden(true);
  }

  return (
    <section
      className={cn(
        "space-y-4 rounded-2xl border bg-card p-4 shadow-xs sm:p-5",
        variant === "full" && "border-primary/30 bg-primary/[0.03] sm:p-6",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className={cn("font-semibold", variant === "full" ? "text-lg sm:text-xl" : "text-base")}>
            {variant === "full" ? "Vamos configurar sua busca" : "Primeiros passos"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {variant === "full"
              ? "Para as vagas aparecerem aqui, o site precisa saber o que você procura."
              : `${doneCount} de ${steps.length} concluídos`}
          </p>
        </div>
        <div className="flex gap-1">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onOpenTour}>
            <CircleHelp className="size-4" />
            Ver tutorial
          </Button>
          {variant === "compact" && (
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Esconder primeiros passos" onClick={hide}>
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ol className="space-y-2">
        {steps.map((step, i) => {
          const StepIcon = step.icon;
          return (
            <li
              key={step.title}
              className={cn(
                "flex flex-wrap items-start gap-3 rounded-xl border p-3 sm:flex-nowrap sm:items-center",
                step.done ? "bg-emerald-50/60 dark:bg-emerald-950/20" : "bg-background",
              )}
            >
              {step.done ? (
                <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="size-5 shrink-0 text-muted-foreground/50" />
              )}
              <div className="min-w-0 flex-1 space-y-0.5">
                <p
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-medium",
                    step.done && "text-muted-foreground line-through decoration-muted-foreground/40",
                  )}
                >
                  <span className="text-muted-foreground">{i + 1}.</span>
                  <StepIcon className="size-4 text-primary" />
                  {step.title}
                </p>
                {!step.done && <p className="text-xs text-muted-foreground">{step.text}</p>}
              </div>
              {!step.done && step.action && (
                <Button type="button" size="sm" className="w-full sm:w-auto" onClick={step.action.onClick}>
                  {step.action.label}
                </Button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
