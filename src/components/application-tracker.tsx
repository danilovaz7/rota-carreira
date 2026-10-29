"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Application, ApplicationStatus } from "@/types/job-hunt";
import { STATUS_LABELS } from "@/types/job-hunt";
import { newApplicationId, saveApplications } from "@/lib/storage";

type Props = {
  applications: Application[];
  onApplicationsChange: (apps: Application[]) => void;
};

export function ApplicationTracker({
  applications,
  onApplicationsChange,
}: Props) {
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");
  const [draft, setDraft] = useState({
    company: "",
    title: "",
    url: "",
    source: "LinkedIn",
  });

  const sorted = useMemo(
    () =>
      [...applications].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [applications],
  );

  const visible = sorted.filter(
    (a) => filter === "all" || a.status === filter,
  );

  function persist(next: Application[]) {
    onApplicationsChange(next);
    saveApplications(next);
  }

  function updateStatus(id: string, status: ApplicationStatus) {
    persist(
      applications.map((a) => {
        if (a.id !== id) return a;
        const appliedAt =
          status === "applied" && !a.appliedAt
            ? new Date().toISOString()
            : a.appliedAt;
        return { ...a, status, appliedAt };
      }),
    );
  }

  function updateNotes(id: string, notes: string) {
    persist(applications.map((a) => (a.id === id ? { ...a, notes } : a)));
  }

  function remove(id: string) {
    persist(applications.filter((a) => a.id !== id));
  }

  function addManual() {
    if (!draft.title.trim() || !draft.url.trim()) return;
    const app: Application = {
      id: newApplicationId(),
      company: draft.company.trim() || "—",
      title: draft.title.trim(),
      url: draft.url.trim(),
      source: draft.source.trim() || "LinkedIn",
      status: "saved",
      notes: "",
      jobDescription: "",
      createdAt: new Date().toISOString(),
    };
    persist([app, ...applications]);
    setDraft({ company: "", title: "", url: "", source: "LinkedIn" });
  }

  const stats = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of applications) {
      c[a.status] = (c[a.status] ?? 0) + 1;
    }
    return c;
  }, [applications]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Rastreador de candidaturas</CardTitle>
          <CardDescription>
            {applications.length} no total · {stats.applied ?? 0} aplicadas ·{" "}
            {stats.interview ?? 0} entrevistas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Adicionar vaga do LinkedIn (cole URL)</Label>
              <Input
                placeholder="https://www.linkedin.com/jobs/view/..."
                value={draft.url}
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input
                value={draft.company}
                onChange={(e) =>
                  setDraft({ ...draft, company: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="button" onClick={addManual}>
                Salvar vaga
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-xs text-muted-foreground">Filtrar:</Label>
            <Select
              value={filter}
              onValueChange={(v) =>
                setFilter(v as ApplicationStatus | "all")
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map(
                  (s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vaga</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Notas</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      Nenhuma vaga ainda. Salve links enquanto navega no
                      LinkedIn.
                    </TableCell>
                  </TableRow>
                )}
                {visible.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="max-w-[240px]">
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline"
                      >
                        {a.title}
                      </a>
                      <p className="text-xs text-muted-foreground">
                        {a.company} · {a.source}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={a.status}
                        onValueChange={(v) =>
                          updateStatus(a.id, v as ApplicationStatus)
                        }
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map(
                            (s) => (
                              <SelectItem key={s} value={s}>
                                {STATUS_LABELS[s]}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Textarea
                        rows={2}
                        className="min-w-[200px] text-xs"
                        value={a.notes}
                        placeholder="Recrutador, data, feedback…"
                        onChange={(e) => updateNotes(a.id, e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(a.id)}
                      >
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
