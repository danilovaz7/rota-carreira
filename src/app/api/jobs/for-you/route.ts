import { NextResponse } from "next/server";
import { fetchAllJobsIncludingLinkedIn } from "@/lib/jobs/fetch-sources";
import { profileFromSearchParams } from "@/lib/jobs/profile-from-request";
import {
  buildInternshipSearchTerms,
  buildSearchTermsFromProfile,
} from "@/lib/jobs/profile-search-terms";
import { rankJobsForProfile } from "@/lib/jobs/profile-matcher";

export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profile = profileFromSearchParams(searchParams);
  const defaultLimit = profile.includeInternships ? 100 : 80;
  const limit = Math.min(Number(searchParams.get("limit") ?? String(defaultLimit)) || defaultLimit, 120);
  const searchTerms = buildSearchTermsFromProfile(profile);
  const internshipTerms = profile.includeInternships
    ? buildInternshipSearchTerms(profile)
    : [];

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
        internshipTerms: internshipTerms.slice(0, 6),
        mix: profile.includeInternships
          ? "~55% estágio (só na área do perfil) na lista Para você"
          : undefined,
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
