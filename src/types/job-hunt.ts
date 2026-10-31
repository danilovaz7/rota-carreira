export type ApplicationStatus =
  | "saved"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

export type JobProfile = {
  fullName: string;
  headline: string;
  location: string;
  keywords: string;
  skills: string;
  yearsExperience: string;
  linkedInUrl: string;
  resumeSummary: string;
  dailyApplyGoal: number;
  /** Se true, estágio e programas de estagiário entram na aba Para você. */
  includeInternships: boolean;
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

export const DEFAULT_PROFILE: JobProfile = {
  fullName: "Danilo Vaz de Oliveira Bogue",
  headline: "Desenvolvedor Full Stack (em formação)",
  location: "Santos, SP",
  keywords:
    "desenvolvedor full stack júnior react node typescript santos remoto",
  skills:
    "JavaScript, TypeScript, React, React Native, Node.js, Express, REST APIs, MySQL, PostgreSQL, MongoDB, Tailwind CSS, Power BI, Power Apps, Power Automate, Git, Scrum",
  yearsExperience: "1",
  linkedInUrl: "https://www.linkedin.com/in/danilo-vaz-3442bb2b0",
  resumeSummary:
    "Full Stack em formação (Fatec ADS), com freelance em plataforma web (ForumPsico/Kolmeia), automações Power Platform na DP World e projetos React/Node (Play2Learn, portfólio). Inglês avançado.",
  dailyApplyGoal: 5,
  includeInternships: false,
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Salva",
  applied: "Aplicada",
  interview: "Entrevista",
  offer: "Proposta",
  rejected: "Recusada",
};
