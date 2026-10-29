import type { JobProfile } from "@/types/job-hunt";
import type { ScoredJob, UnifiedJob } from "@/lib/jobs/types";

const INTERNSHIP_RE =
  /\b(est[aá]gio|estagi[aá]rio|internship|\bintern\b|apprentice|pasant[ií]a|trainee\s+program\s+intern)\b/i;

const SENIOR_RE =
  /\b(senior|s[eê]nior|staff|principal|director|diretor|head of|lead\b|tech lead|chapter lead|\bsr\.?\b|pleno\s+s[eê]nior|5\+?\s*years|7\+?\s*years|10\+?\s*years|15\+?\s*years)\b/i;

const JUNIOR_RE =
  /\b(j[uú]nior|\bjr\.?\b|trainee|entry[- ]level|graduat|in[ií]cio\s+de\s+carreira|primeiro\s+emprego|0\s*[-–]\s*2\s*anos|1\s*[-–]\s*3\s*anos|2\s*[-–]\s*4\s*anos|at[eé]\s*2\s*anos|at[eé]\s*3\s*anos)\b/i;

const DEV_ROLE_RE =
  /\b(desenvolvedor|developer|software|full[\s-]?stack|front[\s-]?end|back[\s-]?end|web\s+dev|react|node|typescript|javascript|engenharia\s+de\s+software|analista\s+de\s+desenvolvimento|power\s+platform|power\s+apps|devops|mobile\s+dev|react\s+native)\b/i;

const NON_DEV_RE =
  /\b(account executive|sales development|recruiter|customer support|marketing manager|paid media|key account|clinical data|transport planner|quality associate|quantitative trader|personalberater)\b/i;

/** Sinônimos leves — “figurinha um pouco”, sem exagerar. */
const STRETCH: Record<string, string[]> = {
  react: ["next", "nextjs", "frontend", "front-end", "vue", "angular", "spa"],
  node: ["nodejs", "express", "nestjs", "backend", "back-end", "api"],
  typescript: ["javascript", "typescript", " ts ", " js "],
  javascript: ["typescript", "ecmascript", "node", "react"],
  mysql: ["sql", "postgres", "postgresql", "mongodb", "banco de dados"],
  "power platform": ["power apps", "power automate", "power bi", "microsoft"],
};

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function parseSkillTokens(profile: JobProfile): string[] {
  const raw = `${profile.skills},${profile.keywords}`;
  return [...new Set(raw.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean))];
}

function expandSkill(skill: string): string[] {
  const key = normalize(skill);
  const extra: string[] = [];
  for (const [base, syns] of Object.entries(STRETCH)) {
    if (key.includes(normalize(base))) extra.push(...syns);
  }
  return [key, ...extra.map(normalize)];
}

export function isExcludedJob(job: UnifiedJob): boolean {
  const blob = normalize(
    `${job.title} ${job.company} ${job.description ?? ""} ${job.tags.join(" ")}`,
  );
  if (INTERNSHIP_RE.test(blob)) return true;
  if (SENIOR_RE.test(normalize(job.title))) return true;
  if (/\best[aá]gio\b/.test(normalize(job.title))) return true;
  return false;
}

export function scoreJobForProfile(
  job: UnifiedJob,
  profile: JobProfile,
): ScoredJob | null {
  if (isExcludedJob(job)) return null;

  const blob = normalize(
    `${job.title} ${job.company} ${job.description ?? ""} ${job.tags.join(" ")} ${job.location}`,
  );

  if (NON_DEV_RE.test(blob)) return null;
  if (!DEV_ROLE_RE.test(blob)) return null;

  const reasons: string[] = [];
  let score = 0;

  if (JUNIOR_RE.test(normalize(job.title))) {
    score += 35;
    reasons.push("Cargo júnior/trainee no título");
  } else if (JUNIOR_RE.test(blob)) {
    score += 22;
    reasons.push("Perfil júnior na descrição");
  } else if (!SENIOR_RE.test(blob)) {
    score += 12;
    reasons.push("Sem exigência sênior explícita");
  } else {
    return null;
  }

  const skills = parseSkillTokens(profile);
  let matched = 0;
  const matchedLabels: string[] = [];

  for (const skill of skills) {
    const variants = expandSkill(skill);
    if (variants.some((v) => blob.includes(v))) {
      matched += 1;
      if (matchedLabels.length < 4) matchedLabels.push(skill);
    }
  }

  const skillRatio = skills.length ? matched / skills.length : 0;
  score += Math.round(skillRatio * 40);
  if (matchedLabels.length) {
    reasons.push(`Skills: ${matchedLabels.join(", ")}`);
  }

  if (/\b(remoto|remote|home office|anywhere)\b/.test(blob)) {
    score += 8;
    reasons.push("Remoto");
  }
  if (/\b(brasil|brazil|santos|s[aã]o paulo|\bsp\b)\b/.test(blob)) {
    score += 10;
    reasons.push("Brasil/SP");
  }

  if (job.source === "LinkedIn") {
    score += 5;
    reasons.push("LinkedIn BR");
  }

  if (score < 28) return null;

  return { ...job, score: Math.min(100, score), reasons };
}

export function rankJobsForProfile(
  jobs: UnifiedJob[],
  profile: JobProfile,
  limit = 40,
): ScoredJob[] {
  const scored: ScoredJob[] = [];
  for (const job of jobs) {
    const s = scoreJobForProfile(job, profile);
    if (s) scored.push(s);
  }
  scored.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: ScoredJob[] = [];
  for (const j of scored) {
    const key = `${normalize(j.company)}|${normalize(j.title)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(j);
    if (out.length >= limit) break;
  }
  return out;
}
