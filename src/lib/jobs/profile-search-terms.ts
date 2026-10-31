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
  const add = (raw: string) => {
    const t = raw.trim().replace(/\s+/g, " ");
    if (t.length < 3) return;
    const key = normalize(t);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(t);
  };

  const out: string[] = [];

  for (const chunk of profile.keywords.split(/[,;\n]+/)) add(chunk);

  const headline = profile.headline.trim();
  if (headline) {
    add(headline);
    if (!/\b(j[uú]nior|trainee|jr\.?)\b/i.test(headline)) {
      add(`${headline} júnior`);
      add(`${headline} trainee`);
    }
  }

  const skillParts = profile.skills.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
  for (const skill of skillParts.slice(0, 8)) {
    add(skill);
    if (skill.split(/\s+/).length <= 4 && !/\b(j[uú]nior|trainee)\b/i.test(skill)) {
      add(`${skill} júnior`);
    }
  }

  const resumeWords = normalize(profile.resumeSummary)
    .split(/\s+/)
    .filter((w) => w.length >= 5 && !STOP.has(w));
  for (const w of [...new Set(resumeWords)].slice(0, 4)) add(w);

  if (out.length === 0) {
    return [
      "trainee",
      "júnior",
      "analista junior",
      "assistente",
      "técnico",
    ];
  }

  return out.slice(0, max);
}
