import type { JobProfile } from "@/types/job-hunt";
import { DEFAULT_PROFILE, DEFAULT_SOURCES } from "@/types/job-hunt";

function str(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function num(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * Completa um perfil salvo (ou vindo da URL) com os padrões e corrige tipos.
 * Perfis antigos, sem os campos novos, continuam funcionando.
 */
export function normalizeProfile(input: unknown): JobProfile {
  const p = (input && typeof input === "object" ? input : {}) as Partial<
    Record<keyof JobProfile, unknown>
  >;
  const d = DEFAULT_PROFILE;
  const src = (p.sources && typeof p.sources === "object" ? p.sources : {}) as Partial<
    Record<keyof typeof DEFAULT_SOURCES, unknown>
  >;

  return {
    careerArea: p.careerArea === "other" ? "other" : "tech",
    fullName: str(p.fullName, d.fullName),
    headline: str(p.headline, d.headline),
    location: str(p.location, d.location),
    keywords: str(p.keywords, d.keywords),
    skills: str(p.skills, d.skills),
    excludeKeywords: str(p.excludeKeywords, d.excludeKeywords),
    yearsExperience: str(p.yearsExperience, d.yearsExperience),
    linkedInUrl: str(p.linkedInUrl, d.linkedInUrl),
    resumeSummary: str(p.resumeSummary, d.resumeSummary),
    dailyApplyGoal: num(p.dailyApplyGoal, d.dailyApplyGoal, 1, 50),
    includeInternships: bool(p.includeInternships, d.includeInternships),
    includeMidLevel: bool(p.includeMidLevel, d.includeMidLevel),
    includeSenior: bool(p.includeSenior, d.includeSenior),
    acceptRemote: bool(p.acceptRemote, d.acceptRemote),
    acceptOnsite: bool(p.acceptOnsite, d.acceptOnsite),
    regionBaixada: bool(p.regionBaixada, d.regionBaixada),
    regionGreaterSP: bool(p.regionGreaterSP, d.regionGreaterSP),
    extraCities: str(p.extraCities, d.extraCities),
    maxAgeDays: num(p.maxAgeDays, d.maxAgeDays, 1, 60),
    minScore: num(p.minScore, d.minScore, 0, 90),
    preferCompanySites: bool(p.preferCompanySites, d.preferCompanySites),
    sources: {
      linkedin: bool(src.linkedin, DEFAULT_SOURCES.linkedin),
      gupy: bool(src.gupy, DEFAULT_SOURCES.gupy),
      companies: bool(src.companies, DEFAULT_SOURCES.companies),
      remoteBoards: bool(src.remoteBoards, DEFAULT_SOURCES.remoteBoards),
    },
  };
}

/** True quando a pessoa já disse o que procura (título ou palavras-chave). */
export function isProfileConfigured(profile: JobProfile): boolean {
  return Boolean(profile.headline.trim() || profile.keywords.trim());
}

export function isTechProfile(profile: JobProfile): boolean {
  return profile.careerArea !== "other";
}
