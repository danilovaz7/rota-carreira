import { NextResponse } from "next/server";
import { fetchAllUnifiedJobs } from "@/lib/jobs/fetch-sources";
import { jobMatchesSearch } from "@/lib/jobs/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") ?? "").trim();
  const limit = Math.min(Number(searchParams.get("limit") ?? "50") || 50, 80);

  try {
    let jobs = await fetchAllUnifiedJobs();

    if (search) {
      jobs = jobs.filter((j) => jobMatchesSearch(j, search));
    }

    jobs.sort(
      (a, b) =>
        new Date(b.publishedAt || 0).getTime() -
        new Date(a.publishedAt || 0).getTime(),
    );

    const seen = new Set<string>();
    jobs = jobs.filter((j) => {
      const key = `${j.company.toLowerCase()}|${j.title.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({
      count: jobs.length,
      jobs: jobs.slice(0, limit),
      sources: ["Remotive", "RemoteOK", "Arbeitnow"],
      note: "Abra sempre o link original. Mencione a fonte quando aplicável (Remotive / Remote OK).",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao agregar vagas";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
