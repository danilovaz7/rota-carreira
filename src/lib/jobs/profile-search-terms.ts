import type { JobProfile } from "@/types/job-hunt";

const STOP = new Set([
  "para",
  "com",
  "sem",
  "dos",
  "das",
  "nos",
  "nas",
  "uma",
  "uns",
  "the",
  "and",
  "de",
  "da",
  "do",
  "em",
  "na",
  "no",
  "ou",
  "e",
  "a",
  "o",
  "as",
  "os",
  "que",
  "por",
  "como",
  "mais",
  "seu",
  "sua",
  "anos",
  "experiencia",
  "formacao",
  "curso",
  "universidade",
  "linkedin",
  "remoto",
  "santos",
  "paulo",
  "brasil",
  "junior",
  "trainee",
  "pleno",
  "senior",
  "estagio",
  "estagiario",
  "estagiaria",
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s/+.-]/gu, " ");
}

/** Termos de busca no LinkedIn/Gupy a partir do perfil (não só TI). */
export function buildSearchTermsFromProfile(profile: JobProfile, max = 10): string[] {
  const seen = new Set<string>();
  const add = (raw: string, list: string[]) => {
    const t = raw.trim().replace(/\s+/g, " ");
    if (t.length < 3) return;
    const key = normalize(t);
    if (seen.has(key)) return;
    seen.add(key);
    list.push(t);
  };

  const out: string[] = [];

  for (const chunk of profile.keywords.split(/[,;\n]+/)) add(chunk, out);

  const headline = profile.headline.trim();
  if (headline) {
    add(headline, out);
    if (!/\b(j[uú]nior|trainee|jr\.?|est[aá]gio)\b/i.test(headline)) {
      add(`${headline} júnior`, out);
      add(`${headline} trainee`, out);
    }
  }

  const skillParts = profile.skills.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
  for (const skill of skillParts.slice(0, 8)) {
    add(skill, out);
    if (skill.split(/\s+/).length <= 4 && !/\b(j[uú]nior|trainee)\b/i.test(skill)) {
      add(`${skill} júnior`, out);
    }
  }

  const resumeWords = normalize(profile.resumeSummary)
    .split(/\s+/)
    .filter((w) => w.length >= 5 && !STOP.has(w));
  for (const w of [...new Set(resumeWords)].slice(0, 4)) add(w, out);

  if (out.length === 0) {
    return ["trainee", "júnior", "analista junior", "assistente", "técnico"];
  }

  return out.slice(0, max);
}

/** Busca de estágio ligada à área do perfil (sem “estágio” genérico solto). */
export function buildInternshipSearchTerms(profile: JobProfile, max = 12): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (raw: string) => {
    const t = raw.trim().replace(/\s+/g, " ");
    if (t.length < 5) return;
    if (/^est[aá]gio$/i.test(t)) return;
    const key = normalize(t);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(t);
  };

  const headline = profile.headline.trim();
  if (headline) {
    add(`estágio ${headline}`);
    add(`${headline} estagiário`);
    const short = headline.split(/\s+/).slice(0, 3).join(" ");
    if (short !== headline) add(`estágio ${short}`);
  }

  for (const chunk of profile.keywords.split(/[,;\n]+/).slice(0, 6)) {
    const k = chunk.trim();
    if (k.length >= 3) add(`estágio ${k}`);
  }

  for (const skill of profile.skills.split(/[,;\n]+/).slice(0, 6)) {
    const s = skill.trim();
    if (s.length >= 3 && s.split(/\s+/).length <= 5) add(`estágio ${s}`);
  }

  if (out.length === 0 && headline) {
    return [`estágio ${headline}`, `${headline} estagiário`].slice(0, max);
  }

  return out.slice(0, max);
}
