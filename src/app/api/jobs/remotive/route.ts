import { NextResponse } from "next/server";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

type RemotiveJob = {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo: string;
  category: string;
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  tags: string[];
};

let cachedAt = 0;
let cachedJobs: RemotiveJob[] | null = null;

async function fetchRemotiveJobs(): Promise<RemotiveJob[]> {
  const now = Date.now();
  if (cachedJobs && now - cachedAt < CACHE_TTL_MS) {
    return cachedJobs;
  }

  const res = await fetch("https://remotive.com/api/remote-jobs", {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Remotive API error: ${res.status}`);
  }

  const data = (await res.json()) as { jobs: RemotiveJob[] };
  cachedJobs = data.jobs ?? [];
  cachedAt = now;
  return cachedJobs;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") ?? "").toLowerCase().trim();
  const limit = Math.min(Number(searchParams.get("limit") ?? "30") || 30, 60);

  try {
    let jobs = await fetchRemotiveJobs();

    if (search) {
      jobs = jobs.filter((j) => {
        const blob = `${j.title} ${j.company_name} ${j.category} ${(j.tags ?? []).join(" ")}`.toLowerCase();
        return search.split(/\s+/).every((term) => blob.includes(term));
      });
    }

    jobs = jobs
      .slice()
      .sort(
        (a, b) =>
          new Date(b.publication_date).getTime() -
          new Date(a.publication_date).getTime(),
      )
      .slice(0, limit);

    return NextResponse.json({
      source: "Remotive",
      attribution:
        "Vagas via Remotive — abra sempre o link original em remotive.com.",
      jobs,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao buscar vagas";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
