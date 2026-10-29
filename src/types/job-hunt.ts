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
  fullName: "",
  headline: "Desenvolvedor(a) de software",
  location: "Brasil",
  keywords: "desenvolvedor software react node typescript",
  skills:
    "JavaScript, TypeScript, React, Node.js, Git, APIs REST, SQL, testes automatizados",
  yearsExperience: "3",
  linkedInUrl: "",
  resumeSummary: "",
  dailyApplyGoal: 5,
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Salva",
  applied: "Aplicada",
  interview: "Entrevista",
  offer: "Proposta",
  rejected: "Recusada",
};
