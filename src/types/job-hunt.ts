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
  /** Dá mais pontos para vagas no site da própria empresa (Gupy, páginas de carreira). */
  preferCompanySites: boolean;
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

/** Modelos prontos para quem está começando: preenchem título, palavras-chave e skills. */
export type SearchPreset = {
  id: string;
  label: string;
  description: string;
  headline: string;
  keywords: string;
  skills: string;
};

export const SEARCH_PRESETS: SearchPreset[] = [
  {
    id: "dev",
    label: "Desenvolvimento",
    description: "Full stack, front-end e back-end",
    headline: "Desenvolvedor Full Stack",
    keywords:
      "desenvolvedor full stack júnior, desenvolvedor front-end júnior, desenvolvedor back-end júnior, desenvolvedor react júnior",
    skills: "JavaScript, TypeScript, React, Node.js, SQL, APIs REST, Git, HTML, CSS",
  },
  {
    id: "dados",
    label: "Dados e BI",
    description: "Análise de dados, Power BI e SQL",
    headline: "Analista de Dados",
    keywords: "analista de dados júnior, analista de bi júnior, power bi, business intelligence",
    skills: "Power BI, SQL, Excel, Python, DAX, Power Query",
  },
  {
    id: "design",
    label: "Design UI/UX",
    description: "Interfaces, produto e web design",
    headline: "Designer UI/UX",
    keywords: "designer ui ux júnior, product designer júnior, web designer, designer gráfico júnior",
    skills: "Figma, UI Design, UX, Photoshop, Illustrator, Design System",
  },
  {
    id: "automacao",
    label: "Power Platform",
    description: "Power Apps, Power Automate e RPA",
    headline: "Desenvolvedor Power Platform",
    keywords: "power platform, desenvolvedor power apps, power automate, rpa júnior",
    skills: "Power Apps, Power Automate, Power BI, SharePoint, Excel",
  },
];

export const DEFAULT_SOURCES: JobSourceToggles = {
  linkedin: true,
  gupy: true,
  companies: true,
  remoteBoards: true,
};

/** Perfil vazio: cada pessoa monta o seu na aba Perfil (o tutorial explica). */
export const DEFAULT_PROFILE: JobProfile = {
  fullName: "",
  headline: "",
  location: "",
  keywords: "",
  skills: "",
  excludeKeywords: "",
  yearsExperience: "",
  linkedInUrl: "",
  resumeSummary: "",
  dailyApplyGoal: 5,
  includeInternships: false,
  includeMidLevel: false,
  acceptRemote: true,
  acceptOnsite: true,
  regionBaixada: false,
  regionGreaterSP: false,
  extraCities: "",
  maxAgeDays: 21,
  minScore: 30,
  preferCompanySites: true,
  sources: DEFAULT_SOURCES,
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Salva",
  applied: "Aplicada",
  interview: "Entrevista",
  offer: "Proposta",
  rejected: "Recusada",
};
