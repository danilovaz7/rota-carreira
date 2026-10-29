export type JobSource =
  | "LinkedIn"
  | "Remotive"
  | "RemoteOK"
  | "Arbeitnow"
  | "Jobicy";

export type Workplace = "remote" | "onsite" | "unknown";

export type UnifiedJob = {
  id: string;
  source: JobSource;
  title: string;
  company: string;
  url: string;
  location: string;
  tags: string[];
  publishedAt: string;
  description?: string;
  workplace?: Workplace;
  isNew?: boolean;
};

export type ScoredJob = UnifiedJob & {
  score: number;
  reasons: string[];
  workplace: Workplace;
  ageDays: number | null;
  isNew: boolean;
};

export function jobMatchesSearch(job: UnifiedJob, search: string): boolean {
  const terms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const blob =
    `${job.title} ${job.company} ${job.location} ${job.tags.join(" ")} ${job.description ?? ""}`.toLowerCase();
  return terms.every((t) => blob.includes(t));
}
