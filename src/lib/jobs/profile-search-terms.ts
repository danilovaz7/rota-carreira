import type { JobProfile } from "@/types/job-hunt";

/**
 * Normaliza texto para comparação: minúsculas, sem acentos e com as grafias
 * comuns de tecnologias unificadas (fullstack → full stack, node.js → node…).
 */
export function normalizeText(text: string): string {
  return ` ${text} `
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/full[\s-]?stack/g, "full stack")
    .replace(/front[\s-]?end/g, "front end")
    .replace(/back[\s-]?end/g, "back end")
    .replace(/\bnode\.?js\b/g, "node")
    .replace(/\bnext\.?js\b/g, "next")
    .replace(/\breact\.?js\b/g, "react")
    .replace(/\bvue\.?js\b/g, "vue")
    .replace(/\bnest\.?js\b/g, "nestjs")
    .replace(/[^\p{L}\p{N}#+.\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const termRegexCache = new Map<string, RegExp>();

/** True se `term` aparece em `text` como palavra/expressão inteira (ambos já normalizados). */
export function hasTerm(text: string, term: string): boolean {
  if (!term) return false;
  let re = termRegexCache.get(term);
  if (!re) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    re = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?:[^\\p{L}\\p{N}]|$)`, "u");
    termRegexCache.set(term, re);
  }
  return re.test(text);
}

/** Itens separados por vírgula, ponto e vírgula ou quebra de linha. */
export function splitList(text: string): string[] {
  return text
    .split(/[,;\n]+/)
    .map((s) => s.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

/** Palavras de nível: ajudam na busca, mas não dizem a área da vaga. */
export const LEVEL_WORDS = new Set([
  "junior",
  "jr",
  "jr.",
  "trainee",
  "pleno",
  "senior",
  "sr",
  "estagio",
  "estagiario",
  "estagiaria",
  "entry",
  "level",
]);

/** Localização já é tratada pelos filtros de região/remoto. */
const LOCATION_WORDS = new Set([
  "remoto",
  "remota",
  "remote",
  "hibrido",
  "hibrida",
  "presencial",
  "home",
  "office",
  "santos",
  "sao",
  "paulo",
  "sp",
  "brasil",
  "brazil",
  "baixada",
  "santista",
]);

const STOP_WORDS = new Set(["de", "da", "do", "das", "dos", "em", "e", "para", "com", "a", "o", "of", "and"]);

/** Uma busca com mais palavras que isso quase nunca encontra vaga. */
export const MAX_WORDS_PER_SEARCH = 6;

/** Remove palavras de localização de uma busca, mantendo a grafia original do resto. */
export function cleanSearchPhrase(raw: string): string {
  return raw
    .replace(/\([^)]*\)/g, " ")
    .split(/\s+/)
    .filter((w) => w && !LOCATION_WORDS.has(normalizeText(w)))
    .join(" ")
    .trim();
}

function hasLevelWord(phrase: string): boolean {
  return normalizeText(phrase)
    .split(" ")
    .some((w) => LEVEL_WORDS.has(w));
}

/** Palavras que definem a área de uma busca/título (sem nível, local e conectivos). */
export function coreWords(phrase: string): string[] {
  return normalizeText(cleanSearchPhrase(phrase))
    .split(" ")
    .filter((w) => w.length >= 2 && !LEVEL_WORDS.has(w) && !STOP_WORDS.has(w));
}

export type KeywordAnalysis = {
  /** Buscas que serão feitas no LinkedIn e na Gupy, na ordem. */
  searches: string[];
  /** Avisos para mostrar no perfil. */
  issues: string[];
};

/** Skills que sozinhas não dizem a área (servem para nota, não para busca). */
export const WEAK_SKILLS = new Set([
  "git",
  "github",
  "gitlab",
  "excel",
  "scrum",
  "kanban",
  "figma",
  "html",
  "css",
  "html5",
  "css3",
  "sql",
  "vs code",
  "docker",
  "jira",
  "apis rest",
  "rest apis",
  "api rest",
  "tailwind css",
  "tailwind",
]);

/** Só põe "júnior" nas buscas automáticas quando a pessoa procura vaga de entrada. */
function levelSuffix(profile: JobProfile): string {
  return profile.includeSenior || profile.includeMidLevel ? "" : " júnior";
}

export function analyzeKeywords(profile: JobProfile, max = 8): KeywordAnalysis {
  const suffix = levelSuffix(profile);
  const seen = new Set<string>();
  const searches: string[] = [];
  const issues: string[] = [];

  const add = (raw: string) => {
    const t = raw.trim().replace(/\s+/g, " ");
    if (t.length < 3 || searches.length >= max) return;
    const key = normalizeText(t);
    if (seen.has(key)) return;
    seen.add(key);
    searches.push(t);
  };

  for (const chunk of splitList(profile.keywords)) {
    const cleaned = cleanSearchPhrase(chunk);
    if (cleaned !== chunk.trim()) {
      issues.push(
        `"${chunk}": tirei as palavras de local. Remoto e regiões são escolhidos em "Onde trabalhar".`,
      );
    }
    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length > MAX_WORDS_PER_SEARCH) {
      issues.push(
        `"${chunk}" tem ${words.length} palavras e quase nenhuma vaga tem todas. Separe as buscas por vírgula (ex.: desenvolvedor react júnior, power platform). Essa busca foi ignorada.`,
      );
      continue;
    }
    add(cleaned);
  }

  const headline = cleanSearchPhrase(profile.headline);
  if (headline && headline.split(/\s+/).length <= MAX_WORDS_PER_SEARCH) {
    add(hasLevelWord(headline) ? headline : `${headline}${suffix}`);
  }

  // Em TI uma skill (React, Power BI) também é nome de vaga; em outras áreas ela só conta na nota.
  const skillsAsSearches = profile.careerArea !== "other" || searches.length === 0;
  for (const skill of skillsAsSearches ? splitList(profile.skills) : []) {
    if (searches.length >= max) break;
    if (WEAK_SKILLS.has(normalizeText(skill))) continue;
    if (skill.split(/\s+/).length > 4) continue;
    add(hasLevelWord(skill) ? skill : `${skill}${suffix}`);
  }

  if (searches.length === 0) {
    issues.push("Nenhuma busca válida: preencha palavras-chave ou o título profissional.");
    const fallback =
      profile.careerArea === "other" ? ["trainee", "assistente"] : ["desenvolvedor júnior", "trainee tecnologia"];
    return { searches: fallback, issues };
  }

  return { searches, issues };
}

/** Termos de busca no LinkedIn/Gupy a partir do perfil. */
export function buildSearchTermsFromProfile(profile: JobProfile, max = 8): string[] {
  return analyzeKeywords(profile, max).searches;
}

/** Primeira busca do perfil, para os links prontos (LinkedIn, Indeed, Google). */
export function primaryKeyword(profile: JobProfile): string {
  return buildSearchTermsFromProfile(profile, 1)[0] ?? profile.headline;
}

const DEV_PROFILE_RE = /\b(desenvolvedor|desenvolvedora|developer|programador|full stack|front end|back end|software)\b/;

/** Termos genéricos de dev: a Gupy busca pelo nome da vaga, então termos curtos rendem muito mais. */
const GENERIC_DEV_TERMS = [
  "desenvolvedor",
  "desenvolvedora",
  "pessoa desenvolvedora",
  "programador",
  "full stack",
  "front-end",
  "back-end",
  "software",
];

/**
 * Termos curtos para a Gupy (e outros sites que buscam pelo nome da vaga):
 * sem nível nem local, porque o filtro de nível e região é feito depois.
 */
export function buildCompanySiteTerms(profile: JobProfile, max = 14): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (raw: string) => {
    const t = raw.trim().replace(/\s+/g, " ");
    if (t.length < 3 || out.length >= max) return;
    const key = normalizeText(t);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(t);
  };
  const stripLevel = (phrase: string) =>
    cleanSearchPhrase(phrase)
      .split(/\s+/)
      .filter((w) => !LEVEL_WORDS.has(normalizeText(w)))
      .join(" ");

  const phrases = [...splitList(profile.keywords), profile.headline]
    .map(stripLevel)
    .filter((p) => p && p.split(/\s+/).length <= MAX_WORDS_PER_SEARCH);

  for (const p of phrases) {
    // "desenvolvedor react" vira também "react", que é como muita vaga é nomeada.
    const words = p.split(/\s+/);
    if (words.length >= 2 && /^desenvolvedor(a)?$/i.test(words[0])) add(words.slice(1).join(" "));
    else add(p);
  }

  const looksDev =
    profile.careerArea !== "other" &&
    DEV_PROFILE_RE.test(normalizeText(`${profile.headline} ${profile.keywords}`));
  if (looksDev) for (const t of GENERIC_DEV_TERMS) add(t);

  const skillTerms = profile.careerArea !== "other" || out.length === 0 ? splitList(profile.skills) : [];
  for (const skill of skillTerms) {
    if (WEAK_SKILLS.has(normalizeText(skill))) continue;
    if (skill.split(/\s+/).length <= 3) add(skill);
  }

  return out;
}

/** Busca de estágio ligada à área do perfil (sem "estágio" genérico solto). */
export function buildInternshipSearchTerms(profile: JobProfile, max = 8): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (raw: string) => {
    const t = raw.trim().replace(/\s+/g, " ");
    if (t.length < 5 || out.length >= max) return;
    const key = normalizeText(t);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(t);
  };

  const stripLevel = (phrase: string) =>
    cleanSearchPhrase(phrase)
      .split(/\s+/)
      .filter((w) => !LEVEL_WORDS.has(normalizeText(w)))
      .join(" ");

  const headline = stripLevel(profile.headline);
  if (headline) add(`estágio ${headline}`);

  for (const chunk of splitList(profile.keywords)) {
    const k = stripLevel(chunk);
    if (k.length >= 3 && k.split(/\s+/).length <= MAX_WORDS_PER_SEARCH) add(`estágio ${k}`);
  }

  const internSkills = profile.careerArea !== "other" || out.length === 0 ? splitList(profile.skills) : [];
  for (const skill of internSkills) {
    if (WEAK_SKILLS.has(normalizeText(skill))) continue;
    if (skill.split(/\s+/).length <= 4) add(`estágio ${skill}`);
  }

  return out;
}
