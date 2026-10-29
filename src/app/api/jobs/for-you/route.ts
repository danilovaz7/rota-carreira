import { NextResponse } from "next/server";
import { fetchAllJobsIncludingLinkedIn } from "@/lib/jobs/fetch-sources";
import { rankJobsForProfile } from "@/lib/jobs/profile-matcher";
import { DEFAULT_PROFILE, type JobProfile } from "@/types/job-hunt";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "50") || 50, 60);

  const profile: JobProfile = {
    ...DEFAULT_PROFILE,
    headline: searchParams.get("headline") ?? DEFAULT_PROFILE.headline,
    skills: searchParams.get("skills") ?? DEFAULT_PROFILE.skills,
    keywords: searchParams.get("keywords") ?? DEFAULT_PROFILE.keywords,
    location: searchParams.get("location") ?? DEFAULT_PROFILE.location,
  };

  try {
    const all = await fetchAllJobsIncludingLinkedIn();
    const jobs = rankJobsForProfile(all, profile, limit);

    return NextResponse.json({
      profileName: profile.fullName,
      filters: {
        exclude: "estágio / internship; presencial fora de SP e Santos",
        focus: "trainee e júnior (dev)",
        stretch: "skills levemente expandidas (React↔Next, Node↔Express, etc.)",
      },
      scanned: all.length,
      count: jobs.length,
      jobs,
      refreshedAt: new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao buscar vagas";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
