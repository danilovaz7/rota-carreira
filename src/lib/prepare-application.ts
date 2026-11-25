import type { JobProfile } from "@/types/job-hunt";
import { hasTerm, normalizeText, splitList } from "@/lib/jobs/profile-search-terms";

/**
 * Compara as skills do perfil com a descrição da vaga usando palavra inteira.
 * Antes valia "pedaço de palavra", e qualquer "com" ou "ate" contava como skill (nota inflada).
 */
export function computeMatchScore(
  profile: JobProfile,
  jobDescription: string,
): { score: number; matched: string[]; missing: string[] } {
  const skillTokens = splitList(profile.skills);
  const jd = normalizeText(jobDescription);
  const matched: string[] = [];
  const missing: string[] = [];

  for (const skill of skillTokens) {
    const base = normalizeText(skill);
    const words = base.split(" ").filter((w) => w.length > 1);
    const hit = hasTerm(jd, base) || (words.length > 1 && words.every((w) => hasTerm(jd, w)));
    if (hit) matched.push(skill);
    else missing.push(skill);
  }

  // Quem lista muitas skills (ex.: dev + dados) não deve ser punido: 8 skills na vaga já é 100%.
  const target = Math.min(skillTokens.length, 8);
  const score = target === 0 ? 0 : Math.min(100, Math.round((matched.length / target) * 100));

  return { score, matched: matched.slice(0, 12), missing: missing.slice(0, 8) };
}

export function buildEasyApplyChecklist(): string[] {
  return [
    "Abrir a vaga no LinkedIn e confirmar que é Easy Apply (ou anotar link externo).",
    "Copiar a descrição completa e colar em “Preparar candidatura” neste painel.",
    "Revisar título do currículo no LinkedIn — alinhar com a vaga (sem mentir).",
    "Responder perguntas padrão (anos de experiência, autorização de trabalho, inglês).",
    "Anexar currículo em PDF atualizado (mesma versão do perfil).",
    "Enviar candidatura e marcar como “Aplicada” em “Minhas vagas”.",
  ];
}

export function buildOutreachMessage(
  profile: JobProfile,
  company: string,
  title: string,
  jobDescription: string,
): string {
  const { matched } = computeMatchScore(profile, jobDescription);
  const highlights =
    matched.slice(0, 4).join(", ") ||
    profile.skills.split(/[,;\n]+/).slice(0, 4).join(", ");

  const name = profile.fullName.trim() || "[Seu nome]";
  const headline = profile.headline.trim();

  return `Olá,

Vi a vaga de ${title} na ${company} e acabei de me candidatar. Tenho interesse porque a posição combina com minha experiência em ${highlights}.

${headline ? `Atuo como ${headline}` : profile.careerArea === "other" ? "Estou buscando uma oportunidade na área" : "Atuo em desenvolvimento de software"}${profile.yearsExperience ? `, com cerca de ${profile.yearsExperience} anos de experiência` : ""}. ${profile.resumeSummary.trim() || (profile.careerArea === "other" ? "Busco contribuir com dedicação, organização e vontade de aprender." : "Busco contribuir em times que valorizam entrega, qualidade de código e aprendizado contínuo.")}

Fico à disposição para conversarmos.

Abraço,
${name}`;
}

export function buildLinkedInNoteShort(
  profile: JobProfile,
  title: string,
): string {
  const name = profile.fullName.trim() || "[Seu nome]";
  const kw = profile.skills.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean).slice(0, 3).join(", ");
  return `Olá! Me candidatei à vaga de ${title}. Background em ${kw || "software"} — adoraria trocar uma ideia sobre a oportunidade. Abraço, ${name}`;
}
