"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { JobProfile } from "@/types/job-hunt";
import { saveProfile } from "@/lib/storage";

type Props = {
  profile: JobProfile;
  onProfileChange: (p: JobProfile) => void;
};

export function ProfileForm({ profile, onProfileChange }: Props) {
  function update(partial: Partial<JobProfile>) {
    const next = { ...profile, ...partial };
    onProfileChange(next);
    saveProfile(next);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seu perfil de busca</CardTitle>
        <CardDescription>
          Isso alimenta links do LinkedIn, match de vagas e textos de
          candidatura. Quanto mais específico, melhor.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="fullName">Nome completo</Label>
          <Input
            id="fullName"
            value={profile.fullName}
            onChange={(e) => update({ fullName: e.target.value })}
            placeholder="Danilo Silva"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="headline">Título profissional</Label>
          <Input
            id="headline"
            value={profile.headline}
            onChange={(e) => update({ headline: e.target.value })}
            placeholder="Desenvolvedor Full Stack"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Local / região</Label>
          <Input
            id="location"
            value={profile.location}
            onChange={(e) => update({ location: e.target.value })}
            placeholder="São Paulo, Brasil ou Remoto"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="years">Anos de experiência</Label>
          <Input
            id="years"
            value={profile.yearsExperience}
            onChange={(e) => update({ yearsExperience: e.target.value })}
            placeholder="3"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="keywords">Palavras-chave (busca LinkedIn)</Label>
          <Input
            id="keywords"
            value={profile.keywords}
            onChange={(e) => update({ keywords: e.target.value })}
            placeholder="react node typescript pleno"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="skills">Skills (separadas por vírgula)</Label>
          <Textarea
            id="skills"
            rows={3}
            value={profile.skills}
            onChange={(e) => update({ skills: e.target.value })}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="summary">Resumo curto (2–3 frases)</Label>
          <Textarea
            id="summary"
            rows={4}
            value={profile.resumeSummary}
            onChange={(e) => update({ resumeSummary: e.target.value })}
            placeholder="O que você entrega, stack principal, tipo de empresa que busca…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="linkedin">URL do seu LinkedIn</Label>
          <Input
            id="linkedin"
            value={profile.linkedInUrl}
            onChange={(e) => update({ linkedInUrl: e.target.value })}
            placeholder="https://linkedin.com/in/..."
          />
        </div>
        <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4 sm:col-span-2">
          <Checkbox
            id="includeInternships"
            checked={profile.includeInternships}
            onCheckedChange={(checked) =>
              update({ includeInternships: checked === true })
            }
            className="mt-0.5"
          />
          <div className="space-y-1">
            <Label htmlFor="includeInternships" className="cursor-pointer font-medium">
              Incluir vagas de estágio
            </Label>
            <p className="text-sm text-muted-foreground">
              Desmarcado (padrão): só trainee, júnior e entry level — estágios ficam
              de fora. Marcado: estágio e estagiário também aparecem em Para você.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal">Meta diária de candidaturas</Label>
          <Input
            id="goal"
            type="number"
            min={1}
            max={30}
            value={profile.dailyApplyGoal}
            onChange={(e) =>
              update({ dailyApplyGoal: Number(e.target.value) || 5 })
            }
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="button" variant="secondary" onClick={() => saveProfile(profile)}>
            Perfil salvo automaticamente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
