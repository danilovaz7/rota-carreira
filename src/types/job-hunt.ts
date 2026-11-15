export type ApplicationStatus =
  | "saved"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

/** Onde o "Para você" procura vagas. */
export type JobSourceToggles = {
  linkedin: boolean;
  gupy: boolean;
  /** Sites de carreira (Greenhouse, Lever, Mercado Livre). */
  companies: boolean;
  /** Sites internacionais de vagas remotas (Remotive, RemoteOK, Arbeitnow, Jobicy). */
  remoteBoards: boolean;
};

export type JobProfile = {
  fullName: string;
  headline: string;
  location: string;
  /** Uma busca por item, separadas por vírgula ou por linha. */
  keywords: string;
  skills: string;
  /** Vagas com algum desses termos no título são descartadas. */
  excludeKeywords: string;
  yearsExperience: string;
  linkedInUrl: string;
  resumeSummary: string;
  dailyApplyGoal: number;
  /** Se true, estágio e programas de estagiário entram na aba Para você. */
  includeInternships: boolean;
  /** Se true, vagas pleno também entram (com nota menor). */
  includeMidLevel: boolean;
  acceptRemote: boolean;
  /** Presencial ou híbrido nas regiões marcadas abaixo. */
  acceptOnsite: boolean;
  regionBaixada: boolean;
  regionGreaterSP: boolean;
  /** Outras cidades aceitas para presencial/híbrido, separadas por vírgula. */
  extraCities: string;
  /** Vagas publicadas há mais dias que isso ficam de fora. */
  maxAgeDays: number;
  /** Encaixe mínimo (0–100) para a vaga aparecer. */
  minScore: number;
  sources: JobSourceToggles;
};

export type Application = {
  id: string;
  company: string;
  title: string;
  url: string;
  source: string;
  status: ApplicationStatus;
  notes: string;
  jobDescription: string;
  createdAt: string;
  appliedAt?: string;
};

/** Palavras-chave recomendadas para o currículo do Danilo (uma busca por item). */
export const RECOMMENDED_KEYWORDS =
  "desenvolvedor full stack júnior, desenvolvedor react júnior, desenvolvedor node.js júnior, desenvolvedor front-end júnior, power platform, analista de dados júnior";

export const DEFAULT_SOURCES: JobSourceToggles = {
  linkedin: true,
  gupy: true,
  companies: true,
  remoteBoards: true,
};

export const DEFAULT_PROFILE: JobProfile = {
  fullName: "Danilo Vaz de Oliveira Bogue",
  headline: "Desenvolvedor Full Stack",
  location: "Santos, SP",
  keywords: RECOMMENDED_KEYWORDS,
  skills:
    "React, Node.js, TypeScript, JavaScript, Next.js, Power Platform, Power BI, SQL, PostgreSQL, MySQL, Express, APIs REST, WordPress, React Native, Tailwind CSS, Git",
  excludeKeywords: "vendas, comercial, suporte técnico, call center",
  yearsExperience: "1",
  linkedInUrl: "https://www.linkedin.com/in/danilo-vaz-3442bb2b0",
  resumeSummary:
    "Desenvolvedor full stack formando em ADS pela Fatec (12/2026). Freelancer na Forumpsico (plataforma de cursos em WordPress: cadastro, pagamentos, plugins) e estagiário na DP World criando apps e automações com Power Platform. Projetos em React, Node.js e TypeScript. Inglês avançado.",
  dailyApplyGoal: 5,
  includeInternships: false,
  includeMidLevel: false,
  acceptRemote: true,
  acceptOnsite: true,
  regionBaixada: true,
  regionGreaterSP: true,
  extraCities: "",
  maxAgeDays: 21,
  minScore: 30,
  sources: DEFAULT_SOURCES,
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Salva",
  applied: "Aplicada",
  interview: "Entrevista",
  offer: "Proposta",
  rejected: "Recusada",
};
