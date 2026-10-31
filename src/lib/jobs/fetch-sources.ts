import { fetchWithTimeout } from "@/lib/jobs/fetch-with-timeout";
import type { UnifiedJob } from "@/lib/jobs/types";
import { stripHtml } from "@/lib/jobs/strip-html";
import { fetchLinkedInBrazilJobs } from "@/lib/jobs/fetch-linkedin-guest";
import { fetchAllCompanySiteJobs } from "@/lib/jobs/company-sources";
import { buildSearchTermsFromProfile } from "@/lib/jobs/profile-search-terms";
import type { JobProfile } from "@/types/job-hunt";

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
    const res = await fetchWithTimeout("https://remotive.com/api/remote-jobs", {
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
      workplace: "remote" as const,
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
    const res = await fetchWithTimeout("https://remoteok.com/api", {
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
      description?: string;
    }>;
    return data
      .filter((j) => j.id && j.position && j.url)
      .map((j) => ({
        id: `remoteok-${j.id}`,
        source: "RemoteOK" as const,
        workplace: "remote" as const,
        title: j.position!,
        company: j.company ?? "—",
        url: j.url!.startsWith("http") ? j.url! : `https://remoteok.com${j.url}`,
        location: j.location ?? "Remote",
        tags: Array.isArray(j.tags) ? j.tags : [],
        publishedAt: j.date ?? (j.epoch ? new Date(j.epoch * 1000).toISOString() : ""),
        description: j.description ? stripHtml(j.description).slice(0, 2000) : undefined,
      }));
  });
}

export async function fetchArbeitnowJobs(): Promise<UnifiedJob[]> {
  return cached("arbeitnow", async () => {
    const res = await fetchWithTimeout("https://www.arbeitnow.com/api/job-board-api", {
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
        description?: string;
      }>;
    };
    return (data.data ?? []).map((j) => ({
      id: `arbeitnow-${j.slug}`,
      source: "Arbeitnow" as const,
      workplace: j.remote ? ("remote" as const) : ("onsite" as const),
      title: j.title,
      company: j.company_name,
      url: j.url,
      location: j.remote ? "Remote" : (j.location ?? ""),
      tags: j.tags ?? [],
      publishedAt: j.created_at ?? "",
      description: j.description ? stripHtml(j.description).slice(0, 2000) : undefined,
    }));
  });
}

export async function fetchJobicyJobs(): Promise<UnifiedJob[]> {
  return cached("jobicy", async () => {
    const jobs: UnifiedJob[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 3; page++) {
      const params = new URLSearchParams({ count: "50" });
      if (cursor) params.set("cursor", cursor);
      const res = await fetchWithTimeout(
        `https://jobicy.com/api/v2/remote-jobs?${params}`,
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) break;
      const data = (await res.json()) as {
        jobs: Array<{
          id: number;
          url: string;
          jobTitle: string;
          companyName: string;
          jobGeo: string;
          jobLevel: string;
          jobIndustry: string[];
          jobExcerpt: string;
          pubDate: string;
        }>;
        nextCursor?: string;
        hasMore?: boolean;
      };
      for (const j of data.jobs ?? []) {
        jobs.push({
          id: `jobicy-${j.id}`,
          source: "Jobicy",
          workplace: "remote",
          title: j.jobTitle,
          company: j.companyName,
          url: j.url,
          location: j.jobGeo ?? "Remote",
          tags: [...(j.jobIndustry ?? []), j.jobLevel].filter(Boolean),
          publishedAt: j.pubDate,
          description: j.jobExcerpt,
        });
      }
      if (!data.hasMore || !data.nextCursor) break;
      cursor = data.nextCursor;
    }
    return jobs;
  });
}

export async function fetchAllUnifiedJobs(): Promise<UnifiedJob[]> {
  const results = await Promise.allSettled([
    fetchRemotiveJobs(),
    fetchRemoteOkJobs(),
    fetchArbeitnowJobs(),
    fetchJobicyJobs(),
  ]);
  const jobs: UnifiedJob[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") jobs.push(...r.value);
  }
  return jobs;
}

const SOURCE_DEADLINE_MS = 25_000;

function withDeadline(promise: Promise<UnifiedJob[]>): Promise<UnifiedJob[]> {
  return Promise.race([
    promise.catch(() => []),
    new Promise<UnifiedJob[]>((resolve) => setTimeout(() => resolve([]), SOURCE_DEADLINE_MS)),
  ]);
}

export async function fetchAllJobsIncludingLinkedIn(profile?: JobProfile): Promise<UnifiedJob[]> {
  const searchTerms = profile ? buildSearchTermsFromProfile(profile) : undefined;
  const results = await Promise.all(
    [
      fetchLinkedInBrazilJobs(searchTerms, profile),
      fetchAllCompanySiteJobs(searchTerms, profile?.includeInternships ?? false, profile),
      fetchAllUnifiedJobs(),
    ].map(withDeadline),
  );
  return results.flat();
}
