import type { JobProfile } from "@/types/job-hunt";

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}+#.]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

export function computeMatchScore(
  profile: JobProfile,
  jobDescription: string,
): { score: number; matched: string[]; missing: string[] } {
  const skillTokens = (profile.skills + " " + profile.keywords)
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const jd = tokenize(jobDescription);
  const matched: string[] = [];
  const missing: string[] = [];

  for (const skill of skillTokens) {
    const parts = skill.toLowerCase().split(/\s+/);
    const hit =
      parts.every((p) => jd.has(p)) ||
      jd.has(skill.toLowerCase()) ||
      [...jd].some((w) => w.includes(skill.toLowerCase()) || skill.toLowerCase().includes(w));
    if (hit) matched.push(skill);
    else missing.push(skill);
  }

  const score =
    skillTokens.length === 0
      ? 0
      : Math.round((matched.length / skillTokens.length) * 100);

  return { score, matched: matched.slice(0, 12), missing: missing.slice(0, 8) };
}

export function buildEasyApplyChecklist(): string[] {
  return [
    "Abrir a vaga no LinkedIn e confirmar que é Easy Apply (ou anotar link externo).",
    "Copiar a descrição completa e colar em “Preparar candidatura” neste painel.",
    "Revisar título do currículo no LinkedIn — alinhar com a vaga (sem mentir).",
    "Responder perguntas padrão (anos de experiência, autorização de trabalho, inglês).",
    "Anexar currículo em PDF atualizado (mesma versão do perfil).",
    "Enviar candidatura e marcar como “Aplicada” no rastreador.",
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

Vi a vaga de ${title} na ${company} e me candidatei pelo LinkedIn. Tenho interesse porque a posição combina com minha experiência em ${highlights}.

${headline ? `Atuo como ${headline}` : "Atuo em desenvolvimento de software"}${profile.yearsExperience ? `, com cerca de ${profile.yearsExperience} anos de experiência` : ""}. ${profile.resumeSummary.trim() || "Busco contribuir em times que valorizam entrega, qualidade de código e aprendizado contínuo."}

Fico à disposição para conversarmos.

Abraço,
${name}`;
}

export function buildLinkedInNoteShort(
  profile: JobProfile,
  title: string,
): string {
  const name = profile.fullName.trim() || "[Seu nome]";
  const kw = profile.keywords.split(/\s+/).slice(0, 3).join(", ");
  return `Olá! Me candidatei à vaga de ${title}. Background em ${kw || "software"} — adoraria trocar uma ideia sobre a oportunidade. Abraço, ${name}`;
}
