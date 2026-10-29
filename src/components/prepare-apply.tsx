"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Application, JobProfile } from "@/types/job-hunt";
import {
  buildEasyApplyChecklist,
  buildLinkedInNoteShort,
  buildOutreachMessage,
  computeMatchScore,
} from "@/lib/prepare-application";
import { newApplicationId, saveApplications } from "@/lib/storage";

type Props = {
  profile: JobProfile;
  applications: Application[];
  onApplicationsChange: (apps: Application[]) => void;
};

export function PrepareApply({
  profile,
  applications,
  onApplicationsChange,
}: Props) {
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const match = computeMatchScore(profile, jobDescription);
  const checklist = buildEasyApplyChecklist();
  const message = buildOutreachMessage(
    profile,
    company || "empresa",
    title || "vaga",
    jobDescription,
  );
  const shortNote = buildLinkedInNoteShort(profile, title || "vaga");

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
  }

  function markApplied() {
    const app: Application = {
      id: newApplicationId(),
      company: company.trim() || "—",
      title: title.trim() || "Vaga",
      url: url.trim() || "#",
      source: "LinkedIn",
      status: "applied",
      notes: `Match ${match.score}%`,
      jobDescription,
      createdAt: new Date().toISOString(),
      appliedAt: new Date().toISOString(),
    };
    const next = [app, ...applications];
    onApplicationsChange(next);
    saveApplications(next);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Preparar candidatura</CardTitle>
          <CardDescription>
            Cole a descrição da vaga (LinkedIn → copiar texto). Use o match
            para decidir se vale aplicar agora ou ajustar o perfil primeiro.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>URL da vaga</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.linkedin.com/jobs/view/..."
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descrição da vaga</Label>
            <Textarea
              rows={10}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Cole aqui requisitos, responsabilidades, stack…"
            />
          </div>

          {jobDescription.trim().length > 40 && (
            <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Match com seu perfil</p>
                <span className="text-lg font-semibold tabular-nums">
                  {match.score}%
                </span>
              </div>
              <Progress value={match.score} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {match.score >= 60
                  ? "Boa candidata — aplique hoje."
                  : match.score >= 40
                    ? "Parcial — destaque projetos que cubram o que falta."
                    : "Fraca — considere outra vaga ou upskill rápido nos requisitos."}
              </p>
              {match.matched.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {match.matched.map((m) => (
                    <Badge key={m} variant="secondary" className="text-xs">
                      ✓ {m}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Checklist Easy Apply</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Button
              type="button"
              className="mt-4 w-full sm:w-auto"
              onClick={markApplied}
            >
              Marcar como aplicada
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mensagem pós-apply (recrutador)</CardTitle>
            <CardDescription>
              Opcional: envie no LinkedIn após candidatar-se.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea readOnly rows={8} value={message} className="text-sm" />
            <Button type="button" variant="outline" onClick={() => void copy(message)}>
              Copiar mensagem longa
            </Button>
            <Textarea readOnly rows={3} value={shortNote} className="text-sm" />
            <Button type="button" variant="outline" onClick={() => void copy(shortNote)}>
              Copiar nota curta
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
