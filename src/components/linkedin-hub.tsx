"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { JobProfile } from "@/types/job-hunt";
import {
  buildGoogleJobsLink,
  buildIndeedBrLink,
  buildLinkedInSearchLinks,
} from "@/lib/linkedin-search";

type Props = {
  profile: JobProfile;
  compact?: boolean;
};

export function LinkedInHub({ profile, compact }: Props) {
  const links = buildLinkedInSearchLinks(profile);

  return (
    <div className="space-y-4">
      {!compact && (
        <Card>
          <CardHeader>
            <CardTitle>Alertas no LinkedIn (faça uma vez)</CardTitle>
            <CardDescription>
              Depois de abrir uma busca abaixo, clique em &quot;Criar alerta de
              vaga&quot; no LinkedIn. Você recebe e-mail quando surgir vaga nova
              — sem precisar ficar refreshando.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc space-y-1 pl-5">
              <li>Crie alerta para &quot;Remoto + Easy Apply&quot; e para &quot;Vagas recentes&quot;.</li>
              <li>Frequência: diária.</li>
              <li>Quando chegar e-mail, salve a vaga aqui no rastreador antes de aplicar.</li>
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{compact ? "Atalhos LinkedIn" : "Buscas prontas no LinkedIn"}</CardTitle>
          {!compact && (
            <CardDescription>
              Palavras-chave:{" "}
              <span className="font-medium text-foreground">
                {profile.keywords || profile.headline}
              </span>{" "}
              · Local:{" "}
              <span className="font-medium text-foreground">
                {profile.location || "—"}
              </span>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <p className="font-medium group-hover:underline">{link.label}</p>
              {!compact && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {link.description}
                </p>
              )}
            </a>
          ))}
        </CardContent>
      </Card>

      {!compact && (
        <Card>
          <CardHeader>
            <CardTitle>Outros lugares (além do LinkedIn)</CardTitle>
            <CardDescription>
              Mais superfície de busca = mais entrevistas. Use os mesmos
              keywords do perfil.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <a
              href={buildGoogleJobsLink(profile)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Google Jobs
            </a>
            <a
              href={buildIndeedBrLink(profile)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Indeed Brasil
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
