import type { UnifiedJob } from "@/lib/jobs/types";

const TTL_MS = 6 * 60 * 60 * 1000;

type CacheEntry = { at: number; jobs: UnifiedJob[] };
const cache: Record<string, CacheEntry> = {};

async function cached(source: string, loader: () => Promise<UnifiedJob[]>) {
  const hit = cache[source];
  if (hit && Date.now() - hit.at < TTL_MS) return hit.jobs;
  const jobs = await loader();
  cache[source] = { at: Date.now(), jobs };
  return jobs;
}

export async function fetchRemotiveJobs(): Promise<UnifiedJob[]> {
  return cached("remotive", async () => {
    const res = await fetch("https://remotive.com/api/remote-jobs", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Remotive ${res.status}`);
    const data = (await res.json()) as {
      jobs: Array<{
        id: number;
        url: string;
        title: string;
        company_name: string;
        publication_date: string;
        candidate_required_location: string;
        tags: string[];
      }>;
    };
    return (data.jobs ?? []).map((j) => ({
      id: `remotive-${j.id}`,
      source: "Remotive" as const,
      title: j.title,
      company: j.company_name,
      url: j.url,
      location: j.candidate_required_location ?? "",
      tags: j.tags ?? [],
      publishedAt: j.publication_date,
    }));
  });
}

export async function fetchRemoteOkJobs(): Promise<UnifiedJob[]> {
  return cached("remoteok", async () => {
    const res = await fetch("https://remoteok.com/api", {
      headers: {
        Accept: "application/json",
        "User-Agent": "CentralEmprego/1.0 (job search; link-back to remoteok.com)",
      },
    });
    if (!res.ok) throw new Error(`RemoteOK ${res.status}`);
    const data = (await res.json()) as Array<{
      id?: string;
      position?: string;
      company?: string;
      url?: string;
      location?: string;
      tags?: string[];
      date?: string;
      epoch?: number;
    }>;
    return data
      .filter((j) => j.id && j.position && j.url)
      .map((j) => ({
        id: `remoteok-${j.id}`,
        source: "RemoteOK" as const,
        title: j.position!,
        company: j.company ?? "—",
        url: j.url!.startsWith("http") ? j.url! : `https://remoteok.com${j.url}`,
        location: j.location ?? "Remote",
        tags: Array.isArray(j.tags) ? j.tags : [],
        publishedAt: j.date ?? (j.epoch ? new Date(j.epoch * 1000).toISOString() : ""),
      }));
  });
}

export async function fetchArbeitnowJobs(): Promise<UnifiedJob[]> {
  return cached("arbeitnow", async () => {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Arbeitnow ${res.status}`);
    const data = (await res.json()) as {
      data: Array<{
        slug: string;
        title: string;
        company_name: string;
        url: string;
        remote: boolean;
        tags: string[];
        created_at?: string;
        location?: string;
      }>;
    };
    return (data.data ?? []).map((j) => ({
      id: `arbeitnow-${j.slug}`,
      source: "Arbeitnow" as const,
      title: j.title,
      company: j.company_name,
      url: j.url,
      location: j.remote ? "Remote" : (j.location ?? ""),
      tags: j.tags ?? [],
      publishedAt: j.created_at ?? "",
    }));
  });
}

export async function fetchAllUnifiedJobs(): Promise<UnifiedJob[]> {
  const results = await Promise.allSettled([
    fetchRemotiveJobs(),
    fetchRemoteOkJobs(),
    fetchArbeitnowJobs(),
  ]);
  const jobs: UnifiedJob[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") jobs.push(...r.value);
  }
  return jobs;
}
