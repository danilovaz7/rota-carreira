"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { JobProfile } from "@/types/job-hunt";
import {
  buildBrazilJobBoardLinks,
  SUGGESTED_SEARCHES_FOR_DANILO,
} from "@/lib/brazil-job-boards";

type Props = {
  profile: JobProfile;
};

export function BrazilJobBoards({ profile }: Props) {
  const boards = buildBrazilJobBoardLinks(profile);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portais além do LinkedIn</CardTitle>
        <CardDescription>
          Abra 2–3 sites por dia e salve links no rastreador. Gupy + Programathor +
          GeekHunter costumam ser o trio mais útil para dev júnior/pleno no BR.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
          <p className="font-medium">Buscas sugeridas para o seu perfil</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {SUGGESTED_SEARCHES_FOR_DANILO.map((s) => (
              <li key={s}>
                <Badge variant="secondary" className="font-normal">
                  {s}
                </Badge>
              </li>
            ))}
          </ul>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {boards.map((b) => (
            <li key={b.id}>
              <a
                href={b.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-full flex-col rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium hover:underline">{b.name}</span>
                  {b.tags.map((t) => (
                    <Badge key={t} variant="outline" className="text-[10px]">
                      {t}
                    </Badge>
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{b.description}</p>
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
