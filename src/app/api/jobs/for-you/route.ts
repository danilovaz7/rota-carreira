import { NextResponse } from "next/server";
import { fetchAllJobsIncludingLinkedIn } from "@/lib/jobs/fetch-sources";
import { profileFromSearchParams } from "@/lib/jobs/profile-from-request";
import { buildSearchTermsFromProfile } from "@/lib/jobs/profile-search-terms";
import { rankJobsForProfile } from "@/lib/jobs/profile-matcher";

export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "80") || 80, 120);
  const profile = profileFromSearchParams(searchParams);
  const searchTerms = buildSearchTermsFromProfile(profile);

  try {
    const all = await fetchAllJobsIncludingLinkedIn(profile);
    const jobs = rankJobsForProfile(all, profile, limit);

    return NextResponse.json({
      profileName: profile.fullName,
      filters: {
        exclude: profile.includeInternships
          ? "sênior / liderança (estágios incluídos)"
          : "estágio / internship; sênior / liderança",
        focus: `perfil: ${profile.headline || "skills e palavras-chave"}`,
        searchTerms: searchTerms.slice(0, 6),
        stretch: "sinônimos leves nas skills (ex.: React↔Next)",
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
