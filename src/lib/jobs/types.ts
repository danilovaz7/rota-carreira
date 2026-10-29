export type UnifiedJob = {
  id: string;
  source: "Remotive" | "RemoteOK" | "Arbeitnow";
  title: string;
  company: string;
  url: string;
  location: string;
  tags: string[];
  publishedAt: string;
};

export function jobMatchesSearch(job: UnifiedJob, search: string): boolean {
  const terms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const blob = `${job.title} ${job.company} ${job.location} ${job.tags.join(" ")}`.toLowerCase();
  return terms.every((t) => blob.includes(t));
}
