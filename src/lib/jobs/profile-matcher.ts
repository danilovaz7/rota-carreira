import type { JobProfile } from "@/types/job-hunt";
import type { ScoredJob, UnifiedJob } from "@/lib/jobs/types";
import {
  WEAK_SKILLS,
  coreWords,
  hasTerm,
  normalizeText,
  splitList,
} from "@/lib/jobs/profile-search-terms";

const INTERNSHIP_RE =
  /\b(estagio|estagiario|estagiaria|internship|intern|apprentice|aprendiz|pasantia)\b/;

export function isInternshipJob(job: UnifiedJob): boolean {
  return INTERNSHIP_RE.test(normalizeText(`${job.title} ${job.tags.join(" ")}`));
}

const SENIOR_RE =
  /\b(senior|staff|principal|director|diretor|diretora|head of|lead|leader|lider|tech lead|chapter lead|sr\.?|coordenador|coordenadora|coordenacao|coordinator|gerente|manager|arquiteto|arquiteta|architect|5\+? ?years|7\+? ?years|10\+? ?years)\b/;

/** Nível intermediário: só entra se o perfil aceitar pleno ou se o título também disser júnior. */
const MID_LEVEL_RE = /\b(pleno|pl(?! sql)|mid level|mid|intermediate|especialista|specialist|iii|iv)\b/;

const JUNIOR_RE =
  /\b(junior|jr\.?|trainee|entry level|graduate|inicio de carreira|primeiro emprego|0 ?a? ?2 anos|ate 2 anos|ate 3 anos)\b/;

const DEV_TITLE_RE =
  /\b(desenvolvedor|desenvolvedora|developer|dev|software|full stack|front end|back end|programador|programadora|engenheiro de software|engenheira de software|analista de sistemas|analista desenvolvedor|power platform|power apps|rpa|mobile)\b/;

const NON_DEV_RE =
  /\b(desenvolvimento de (mercado|produto|negocios|novos negocios|pessoas|talentos)|desenvolvimento (organizacional|humano|comercial)|analista fiscal|\[modelo\]|vagas? testes?|account executive|sales development|business development|recruiter|recrutador|customer support|customer success|support analyst|support engineer|analista de suporte|suporte tecnico|help ?desk|service desk|marketing manager|paid media|key account|clinical data|transport planner|quality associate|quantitative trader)\b/;

/** Sinônimos leves de skills (chaves e valores já normalizados). */
const SKILL_SYNONYMS: Record<string, string[]> = {
  react: ["next", "react native"],
  next: ["react"],
  node: ["express", "nestjs"],
  express: ["node"],
  typescript: ["javascript"],
  javascript: ["typescript"],
  "power platform": ["power apps", "power automate", "power bi"],
  "power apps": ["power platform"],
  "power automate": ["power platform"],
  "power bi": ["power platform"],
  sql: ["mysql", "postgresql", "postgres", "sql server"],
  mysql: ["sql"],
  postgresql: ["postgres", "sql"],
};

/** Sinônimos das palavras de cargo usadas nas buscas. */
const ROLE_WORD_SYNONYMS: Record<string, string[]> = {
  desenvolvedor: ["desenvolvedora", "developer", "dev", "programador", "programadora", "engineer", "engenheiro", "engenheira"],
  desenvolvedora: ["desenvolvedor", "developer", "dev", "programadora", "programador"],
  developer: ["desenvolvedor", "desenvolvedora", "dev", "engineer"],
  analista: ["analyst"],
  dados: ["data"],
  data: ["dados"],
  engenheiro: ["engineer", "engenheira"],
  sistemas: ["systems", "software"],
};

type ProfileTerms = {
  /** Cada busca/título vira uma lista de palavras que precisam estar no título da vaga. */
  roles: string[][];
  /** Skills normalizadas (com rótulo original para exibir). */
  skills: { label: string; terms: string[]; weak: boolean }[];
  exclude: string[];
  extraCities: string[];
};

const termsCache = new WeakMap<JobProfile, ProfileTerms>();

function profileTerms(profile: JobProfile): ProfileTerms {
  const hit = termsCache.get(profile);
  if (hit) return hit;

  const roles: string[][] = [];
  const seenRoles = new Set<string>();
  for (const phrase of [...splitList(profile.keywords), profile.headline]) {
    const words = coreWords(phrase);
    if (!words.length || words.length > 6) continue;
    const key = words.join(" ");
    if (seenRoles.has(key)) continue;
    seenRoles.add(key);
    roles.push(words);
  }

  // Sinônimo só vale se não for uma skill que você já listou (evita contar SQL três vezes).
  const skillLabels = splitList(profile.skills);
  const listed = new Set(skillLabels.map(normalizeText));
  const skills = skillLabels.map((label) => {
    const base = normalizeText(label);
    const synonyms = (SKILL_SYNONYMS[base] ?? []).filter((syn) => !listed.has(syn));
    return {
      label,
      terms: [base, ...synonyms],
      weak: WEAK_SKILLS.has(base),
    };
  });

  const result: ProfileTerms = {
    roles,
    skills,
    exclude: splitList(profile.excludeKeywords).map(normalizeText).filter((t) => t.length >= 2),
    extraCities: splitList(profile.extraCities).map(normalizeText).filter((t) => t.length >= 3),
  };
  termsCache.set(profile, result);
  return result;
}

function roleMatches(title: string, words: string[]): boolean {
  return words.every((w) => [w, ...(ROLE_WORD_SYNONYMS[w] ?? [])].some((v) => hasTerm(title, v)));
}

/** Grande São Paulo e Baixada Santista (texto normalizado). */
const BAIXADA_RE =
  /\b(santos|sao vicente|guaruja|praia grande|cubatao|bertioga|mongagua|itanhaem|peruibe|baixada santista)\b/;

/** "São Paulo" só conta como cidade no início de cada local (evita "Agudos, São Paulo" = estado). */
const GREATER_SP_RE =
  /(^|; )sao paulo\b|\b(greater sao paulo|grande sao paulo|guarulhos|osasco|barueri|alphaville|santana de parnaiba|santo andre|sao bernardo|sao caetano|diadema|maua|ribeirao pires|cotia|taboao da serra|embu|itapecerica|carapicuiba|jandira|itapevi|mogi das cruzes|suzano|aruja|itaquaquecetuba|poa|ferraz de vasconcelos|caieiras|franco da rocha|cajamar)\b/;

const REMOTE_OPEN_TO_BRAZIL_RE =
  /\b(brasil|brazil|latam|latin america|south america|americas|worldwide|anywhere|global)\b|^remote$|^$/;

const COMPANY_SITE_SOURCES = new Set<UnifiedJob["source"]>(["Gupy", "Site da empresa"]);

function resolveWorkplace(job: UnifiedJob, blob: string): "remote" | "onsite" {
  if (job.workplace === "remote") return "remote";
  if (/\b(remoto|remote|home office)\b/.test(normalizeText(job.title))) return "remote";
  if (job.workplace === "onsite") return "onsite";
  return /\b(remoto|remote|home office|100% remoto)\b/.test(blob) ? "remote" : "onsite";
}

function daysSince(iso: string, now: number): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((now - t) / 86_400_000));
}

/** True se a vaga cai fora pelos filtros de nível ou pelos termos a evitar. */
export function isExcludedJob(job: UnifiedJob, profile: JobProfile): boolean {
  const title = normalizeText(job.title);
  if (SENIOR_RE.test(title)) return true;
  if (isInternshipJob(job) && !profile.includeInternships) return true;
  if (MID_LEVEL_RE.test(title) && !JUNIOR_RE.test(title) && !profile.includeMidLevel) return true;
  const { exclude } = profileTerms(profile);
  return exclude.some((t) => hasTerm(title, t));
}

export function scoreJobForProfile(
  job: UnifiedJob,
  profile: JobProfile,
  now: number,
): ScoredJob | null {
  if (isExcludedJob(job, profile)) return null;

  const title = normalizeText(job.title);
  if (NON_DEV_RE.test(`${title} ${normalizeText(job.company)}`)) return null;

  const blob = normalizeText(
    `${job.title} ${job.company} ${job.description ?? ""} ${job.tags.join(" ")}`,
  );
  const terms = profileTerms(profile);

  // 1. A vaga é da sua área?
  const roleHit = terms.roles.some((words) => roleMatches(title, words));
  const titleSkills = terms.skills.filter((s) => !s.weak && s.terms.some((t) => hasTerm(title, t)));
  const blobSkills = terms.skills.filter((s) => s.terms.some((t) => hasTerm(blob, t)));
  const internship = isInternshipJob(job);
  const devTitle = DEV_TITLE_RE.test(title);

  const inArea =
    roleHit ||
    titleSkills.length > 0 ||
    (devTitle && (JUNIOR_RE.test(title) || internship || blobSkills.length > 0)) ||
    blobSkills.filter((s) => !s.weak).length >= 3;
  if (!inArea) return null;

  const reasons: string[] = [];
  let score = 0;

  // 2. Nível
  if (internship) {
    score += 28;
    reasons.push("Estágio na sua área");
  } else if (JUNIOR_RE.test(title)) {
    score += 30;
    reasons.push("Júnior/trainee no título");
  } else if (MID_LEVEL_RE.test(title)) {
    score += 8;
    reasons.push("Pleno");
  } else if (JUNIOR_RE.test(blob)) {
    score += 20;
    reasons.push("Perfil júnior na descrição");
  } else if (!SENIOR_RE.test(blob)) {
    score += 12;
    reasons.push("Sem exigência sênior");
  } else {
    return null;
  }

  // 3. Cargo e skills
  if (roleHit) {
    score += 18;
    reasons.push("Cargo que você busca");
  }
  if (blobSkills.length) {
    score += Math.min(28, blobSkills.length * 7);
    reasons.push(`Skills: ${blobSkills.slice(0, 4).map((s) => s.label).join(", ")}`);
  }

  // 4. Onde
  const workplace = resolveWorkplace(job, blob);
  const location = normalizeText(job.location);
  if (workplace === "remote") {
    if (!profile.acceptRemote) return null;
    if (job.source !== "LinkedIn" && !REMOTE_OPEN_TO_BRAZIL_RE.test(location)) return null;
    reasons.push("Remoto");
  } else {
    if (!profile.acceptOnsite) return null;
    const inBaixada = profile.regionBaixada && BAIXADA_RE.test(location);
    const inGreaterSP = profile.regionGreaterSP && GREATER_SP_RE.test(location);
    const extraCity = terms.extraCities.find((c) => hasTerm(location, c));
    if (!inBaixada && !inGreaterSP && !extraCity) return null;
    score += 6;
    reasons.push(
      inBaixada
        ? "Presencial/híbrido · Baixada Santista"
        : inGreaterSP
          ? "Presencial/híbrido · Grande SP"
          : `Presencial/híbrido · ${job.location.split(",")[0]}`,
    );
  }

  if (COMPANY_SITE_SOURCES.has(job.source)) {
    score += 6;
    reasons.push(`Site da ${job.company}`);
  }

  // 5. Quão recente
  const ageDays = daysSince(job.publishedAt, now);
  if (ageDays !== null && ageDays > profile.maxAgeDays) return null;
  const isNew = Boolean(job.isNew) || (ageDays !== null && ageDays <= 2);
  if (ageDays !== null) {
    if (ageDays <= 1) score += 14;
    else if (ageDays <= 3) score += 9;
    else if (ageDays <= 7) score += 4;
  }
  if (isNew) reasons.unshift("Vaga nova");

  score = Math.min(100, score);
  if (score < profile.minScore) return null;

  return {
    ...job,
    score,
    reasons,
    workplace,
    ageDays,
    isNew,
  };
}

function dedupeKey(job: ScoredJob): string {
  return `${normalizeText(job.company)}|${normalizeText(job.title)}`;
}

function takeUnique(source: ScoredJob[], seen: Set<string>, max: number): ScoredJob[] {
  const picked: ScoredJob[] = [];
  for (const j of source) {
    const key = dedupeKey(j);
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(j);
    if (picked.length >= max) break;
  }
  return picked;
}

export function rankJobsForProfile(
  jobs: UnifiedJob[],
  profile: JobProfile,
  limit = 40,
  now = Date.now(),
): ScoredJob[] {
  const scored: ScoredJob[] = [];
  for (const job of jobs) {
    const s = scoreJobForProfile(job, profile, now);
    if (s) scored.push(s);
  }
  scored.sort((a, b) => b.score - a.score);

  if (!profile.includeInternships) {
    return takeUnique(scored, new Set<string>(), limit);
  }

  // Com estágio ligado, garante espaço para as duas listas.
  const interns = scored.filter((j) => isInternshipJob(j));
  const others = scored.filter((j) => !isInternshipJob(j));
  const internSlots = Math.round(limit * 0.5);
  const seen = new Set<string>();
  const out = [...takeUnique(interns, seen, internSlots)];
  out.push(...takeUnique(others, seen, limit - out.length));
  if (out.length < limit) out.push(...takeUnique(interns, seen, limit - out.length));
  return out.slice(0, limit);
}
