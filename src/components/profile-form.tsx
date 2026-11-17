"use client";

import { useMemo } from "react";
import { AlertTriangle, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { JobProfile, JobSourceToggles } from "@/types/job-hunt";
import { DEFAULT_PROFILE, SEARCH_PRESETS } from "@/types/job-hunt";
import type { CareerArea, SearchPreset } from "@/types/job-hunt";
import { saveProfile } from "@/lib/storage";
import { analyzeKeywords } from "@/lib/jobs/profile-search-terms";

type Props = {
  profile: JobProfile;
  onProfileChange: (p: JobProfile) => void;
};

const AGE_OPTIONS = [3, 7, 14, 21, 30];
const AREA_OPTIONS: { value: CareerArea; label: string; hint: string }[] = [
  { value: "tech", label: "Tecnologia", hint: "Dev, dados, design digital, Power Platform…" },
  { value: "other", label: "Outra área", hint: "Engenharia, administrativo, logística, RH, saúde…" },
];

/** Exemplos dos campos de texto conforme a área escolhida. */
const PLACEHOLDERS: Record<CareerArea, { headline: string; keywords: string; skills: string; exclude: string; summary: string }> = {
  tech: {
    headline: "Desenvolvedor Full Stack",
    keywords: "desenvolvedor react júnior, desenvolvedor node.js júnior, power platform",
    skills: "JavaScript, TypeScript, React, Node.js, SQL",
    exclude: "java, php, vendas, suporte técnico",
    summary: "O que você entrega, stack principal, tipo de empresa que busca…",
  },
  other: {
    headline: "Engenheiro Químico",
    keywords: "engenheiro químico júnior, engenheiro de processos júnior, analista de qualidade",
    skills: "Controle de qualidade, ISO 9001, Lean, AutoCAD, Excel",
    exclude: "vendas, estágio, temporário",
    summary: "Sua formação, o que você já fez e o tipo de empresa que busca…",
  },
};

const SCORE_OPTIONS = [
  { value: 20, label: "Mais vagas" },
  { value: 30, label: "Equilibrado" },
  { value: 45, label: "Só as melhores" },
];

const SOURCE_LABELS: { key: keyof JobSourceToggles; label: string; hint: string }[] = [
  { key: "linkedin", label: "LinkedIn", hint: "Maior volume de vagas no Brasil." },
  { key: "gupy", label: "Gupy", hint: "Itaú, Ambev, Localiza e milhares de outras." },
  { key: "companies", label: "Sites de empresas", hint: "Nubank, Inter, XP, Stone, Mercado Livre… (têm vagas de várias áreas)." },
  { key: "remoteBoards", label: "Sites remotos internacionais", hint: "Remotive, RemoteOK, Arbeitnow, Jobicy. Em inglês e quase só de TI." },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-t pt-6 first:border-t-0 first:pt-0 sm:col-span-2">
      <div className="space-y-1">
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function CheckRow({
  id,
  checked,
  onChange,
  label,
  hint,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="mt-0.5"
      />
      <div className="space-y-0.5">
        <Label htmlFor={id} className="cursor-pointer font-medium">
          {label}
        </Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function OptionButtons<T extends number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
            value === o.value
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-card hover:bg-muted",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ProfileForm({ profile, onProfileChange }: Props) {
  function update(partial: Partial<JobProfile>) {
    const next = { ...profile, ...partial };
    onProfileChange(next);
    saveProfile(next);
  }

  function updateSource(key: keyof JobSourceToggles, value: boolean) {
    update({ sources: { ...profile.sources, [key]: value } });
  }

  function setArea(area: CareerArea) {
    if (area === profile.careerArea) return;
    update({
      careerArea: area,
      // Os sites remotos internacionais são quase só de TI.
      sources: area === "other" ? { ...profile.sources, remoteBoards: false } : profile.sources,
    });
  }

  function applyPreset(preset: SearchPreset) {
    update({
      careerArea: preset.area,
      sources:
        preset.area === "other" && preset.area !== profile.careerArea
          ? { ...profile.sources, remoteBoards: false }
          : profile.sources,
      headline: preset.headline,
      keywords: preset.keywords,
      skills: preset.skills,
    });
  }

  function resetSearchSettings() {
    update({
      includeInternships: DEFAULT_PROFILE.includeInternships,
      includeMidLevel: DEFAULT_PROFILE.includeMidLevel,
      includeSenior: DEFAULT_PROFILE.includeSenior,
      acceptRemote: DEFAULT_PROFILE.acceptRemote,
      acceptOnsite: DEFAULT_PROFILE.acceptOnsite,
      regionBaixada: DEFAULT_PROFILE.regionBaixada,
      regionGreaterSP: DEFAULT_PROFILE.regionGreaterSP,
      maxAgeDays: DEFAULT_PROFILE.maxAgeDays,
      minScore: DEFAULT_PROFILE.minScore,
      preferCompanySites: DEFAULT_PROFILE.preferCompanySites,
      sources: DEFAULT_PROFILE.sources,
    });
  }

  const ph = PLACEHOLDERS[profile.careerArea];
  const visiblePresets = SEARCH_PRESETS.filter((p) => p.area === profile.careerArea);
  const analysis = useMemo(() => analyzeKeywords(profile), [profile]);
  const noPlace =
    !profile.acceptRemote &&
    (!profile.acceptOnsite ||
      (!profile.regionBaixada && !profile.regionGreaterSP && !profile.extraCities.trim()));
  const noSource = !Object.values(profile.sources).some(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seu perfil de busca</CardTitle>
        <CardDescription>
          Tudo aqui muda o que aparece em Para você, os links prontos e os textos de
          candidatura. Salva sozinho a cada alteração.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        <Section title="Quem você é">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input
              id="fullName"
              value={profile.fullName}
              onChange={(e) => update({ fullName: e.target.value })}
              placeholder="Seu nome"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="headline">Título profissional</Label>
            <Input
              id="headline"
              value={profile.headline}
              onChange={(e) => update({ headline: e.target.value })}
              placeholder={ph.headline}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Cidade (para os links prontos)</Label>
            <Input
              id="location"
              value={profile.location}
              onChange={(e) => update({ location: e.target.value })}
              placeholder="Ex.: Campinas, SP"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="years">Anos de experiência</Label>
            <Input
              id="years"
              value={profile.yearsExperience}
              onChange={(e) => update({ yearsExperience: e.target.value })}
              placeholder="1"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="linkedin">URL do seu LinkedIn</Label>
            <Input
              id="linkedin"
              value={profile.linkedInUrl}
              onChange={(e) => update({ linkedInUrl: e.target.value })}
              placeholder="https://linkedin.com/in/..."
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="summary">Resumo curto (usado nos textos de candidatura)</Label>
            <Textarea
              id="summary"
              rows={3}
              value={profile.resumeSummary}
              onChange={(e) => update({ resumeSummary: e.target.value })}
              placeholder={ph.summary}
            />
          </div>
        </Section>

        <Section
          title="O que buscar"
          description="Cada palavra-chave vira uma busca separada no LinkedIn e na Gupy. Separe por vírgula ou uma por linha."
        >
          <div className="space-y-2 sm:col-span-2">
            <Label>Sua área</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {AREA_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={profile.careerArea === opt.value}
                  onClick={() => setArea(opt.value)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-colors",
                    profile.careerArea === opt.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "bg-card hover:border-primary/50",
                  )}
                >
                  <span className="block text-sm font-medium">{opt.label}</span>
                  <span className="block text-xs text-muted-foreground">{opt.hint}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {profile.careerArea === "tech"
                ? "Liga os filtros de TI: esconde vagas de suporte, vendas e RH que usam palavras de dev, e busca termos extras como “full stack” e “software”."
                : "Busca neutra: só as suas palavras-chave e skills decidem o que aparece. Funciona para qualquer profissão."}
            </p>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Começar com um modelo (você pode editar tudo depois)</Label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {visiblePresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <span className="block text-sm font-medium">{preset.label}</span>
                  <span className="block text-xs text-muted-foreground">{preset.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="keywords">Palavras-chave (uma busca por item)</Label>
            <Textarea
              id="keywords"
              rows={3}
              value={profile.keywords}
              onChange={(e) => update({ keywords: e.target.value })}
              placeholder={ph.keywords}
            />
          </div>

          <div className="space-y-2 rounded-xl border bg-muted/30 p-3 sm:col-span-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Search className="size-4" />
              Buscas que serão feitas ({analysis.searches.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.searches.map((s) => (
                <span key={s} className="rounded-full bg-card px-2.5 py-1 text-xs ring-1 ring-border">
                  {s}
                </span>
              ))}
            </div>
            {analysis.issues.length > 0 && (
              <ul className="space-y-1 pt-1">
                {analysis.issues.map((issue) => (
                  <li key={issue} className="flex gap-2 text-xs text-amber-700">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              {profile.careerArea === "tech"
                ? "Depois das suas palavras-chave, o site completa com o título e as primeiras skills (até 8 buscas)."
                : "Depois das suas palavras-chave, o site completa com o título (até 8 buscas). As skills contam só na nota de encaixe."}
            </p>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="skills">Skills (separadas por vírgula, as mais importantes primeiro)</Label>
            <Textarea
              id="skills"
              rows={3}
              value={profile.skills}
              onChange={(e) => update({ skills: e.target.value })}
              placeholder={ph.skills}
            />
            <p className="text-xs text-muted-foreground">
              {profile.careerArea === "tech"
                ? "Cada skill encontrada na vaga aumenta o encaixe. Sinônimos contam (React ↔ Next.js, Power Platform ↔ Power BI, SQL ↔ PostgreSQL)."
                : "Cada skill encontrada no texto da vaga aumenta o encaixe. Use os termos que aparecem nos anúncios da sua área."}
            </p>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="exclude">Evitar vagas com estes termos no título</Label>
            <Input
              id="exclude"
              value={profile.excludeKeywords}
              onChange={(e) => update({ excludeKeywords: e.target.value })}
              placeholder={ph.exclude}
            />
          </div>
        </Section>

        <Section
          title="Nível da vaga"
          description="Júnior e trainee sempre entram. Marque o que mais você aceita."
        >
          <CheckRow
            id="includeInternships"
            checked={profile.includeInternships}
            onChange={(v) => update({ includeInternships: v })}
            label="Incluir estágio"
            hint="Busca também estágios ligados à sua área."
          />
          <CheckRow
            id="includeMidLevel"
            checked={profile.includeMidLevel}
            onChange={(v) => update({ includeMidLevel: v })}
            label="Incluir pleno"
            hint={profile.includeSenior ? "Pleno e especialista entram com nota alta." : "Aparecem com nota menor que as júnior."}
          />
          <CheckRow
            id="includeSenior"
            checked={profile.includeSenior}
            onChange={(v) => update({ includeSenior: v })}
            label="Incluir sênior e gestão"
            hint="Sênior, coordenação, supervisão e gerência. Para quem já tem experiência."
          />
        </Section>

        <Section title="Onde trabalhar">
          <CheckRow
            id="acceptRemote"
            checked={profile.acceptRemote}
            onChange={(v) => update({ acceptRemote: v })}
            label="Remoto"
            hint="Vagas remotas abertas para o Brasil."
          />
          <CheckRow
            id="acceptOnsite"
            checked={profile.acceptOnsite}
            onChange={(v) => update({ acceptOnsite: v })}
            label="Presencial ou híbrido"
            hint="Só nas regiões marcadas abaixo."
          />
          {profile.acceptOnsite && (
            <>
              <CheckRow
                id="regionBaixada"
                checked={profile.regionBaixada}
                onChange={(v) => update({ regionBaixada: v })}
                label="Baixada Santista"
                hint="Santos, São Vicente, Guarujá, Praia Grande, Cubatão…"
              />
              <CheckRow
                id="regionGreaterSP"
                checked={profile.regionGreaterSP}
                onChange={(v) => update({ regionGreaterSP: v })}
                label="Grande São Paulo"
                hint="Capital, ABC, Osasco, Barueri, Guarulhos…"
              />
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="extraCities">Outras cidades (separadas por vírgula)</Label>
                <Input
                  id="extraCities"
                  value={profile.extraCities}
                  onChange={(e) => update({ extraCities: e.target.value })}
                  placeholder="Campinas, São José dos Campos"
                />
              </div>
            </>
          )}
          {profile.acceptOnsite &&
            !profile.regionBaixada &&
            !profile.regionGreaterSP &&
            !profile.extraCities.trim() && (
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Para ver vagas presenciais ou híbridas, marque uma região acima ou escreva a sua
                cidade em “Outras cidades”.
              </p>
            )}
          {noPlace && (
            <p className="flex gap-2 text-sm text-amber-700 sm:col-span-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              Do jeito que está, nenhuma vaga vai aparecer: marque remoto ou alguma região.
            </p>
          )}
        </Section>

        <Section title="Filtros">
          <div className="space-y-2 sm:col-span-2">
            <Label>Publicadas nos últimos</Label>
            <OptionButtons
              value={profile.maxAgeDays}
              options={AGE_OPTIONS.map((d) => ({ value: d, label: `${d} dias` }))}
              onChange={(v) => update({ maxAgeDays: v })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Encaixe mínimo</Label>
            <OptionButtons
              value={profile.minScore}
              options={SCORE_OPTIONS.map((o) => ({ value: o.value, label: `${o.label} (${o.value}%)` }))}
              onChange={(v) => update({ minScore: v })}
            />
          </div>
        </Section>

        <Section title="Onde procurar">
          {SOURCE_LABELS.map((s) => (
            <CheckRow
              key={s.key}
              id={`source-${s.key}`}
              checked={profile.sources[s.key]}
              onChange={(v) => updateSource(s.key, v)}
              label={s.label}
              hint={s.hint}
            />
          ))}
          <div className="sm:col-span-2">
            <CheckRow
              id="preferCompanySites"
              checked={profile.preferCompanySites}
              onChange={(v) => update({ preferCompanySites: v })}
              label="Priorizar vagas no site da empresa"
              hint="Vagas da Gupy e de páginas de carreira sobem na lista. Candidatura direta costuma ter menos concorrência que a do LinkedIn."
            />
          </div>
          {noSource && (
            <p className="flex gap-2 text-sm text-amber-700 sm:col-span-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              Marque pelo menos um lugar para procurar.
            </p>
          )}
        </Section>

        <Section title="Rotina">
          <div className="space-y-2">
            <Label htmlFor="goal">Meta diária de candidaturas</Label>
            <Input
              id="goal"
              type="number"
              min={1}
              max={50}
              value={profile.dailyApplyGoal}
              onChange={(e) => update({ dailyApplyGoal: Number(e.target.value) || 5 })}
            />
          </div>
        </Section>

        <div className="flex flex-wrap gap-2 border-t pt-6 sm:col-span-2">
          <Button type="button" variant="outline" onClick={resetSearchSettings}>
            Restaurar filtros padrão
          </Button>
          <p className="self-center text-xs text-muted-foreground">
            Volta nível, locais, idade das vagas, encaixe e fontes para o padrão. Seus textos ficam.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
