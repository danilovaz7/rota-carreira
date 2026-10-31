import type { JobProfile } from "@/types/job-hunt";
import { DEFAULT_PROFILE } from "@/types/job-hunt";

/** Monta o perfil a partir da query string do `/api/jobs/for-you`. */
export function profileFromSearchParams(searchParams: URLSearchParams): JobProfile {
  const pick = (key: keyof JobProfile, fallback: string) =>
    searchParams.get(key)?.trim() || fallback;

  return {
    ...DEFAULT_PROFILE,
    fullName: pick("fullName", DEFAULT_PROFILE.fullName),
    headline: pick("headline", DEFAULT_PROFILE.headline),
    skills: pick("skills", DEFAULT_PROFILE.skills),
    keywords: pick("keywords", DEFAULT_PROFILE.keywords),
    location: pick("location", DEFAULT_PROFILE.location),
    resumeSummary: pick("resumeSummary", DEFAULT_PROFILE.resumeSummary),
    yearsExperience: pick("yearsExperience", DEFAULT_PROFILE.yearsExperience),
    linkedInUrl: pick("linkedInUrl", DEFAULT_PROFILE.linkedInUrl),
    dailyApplyGoal: Number(searchParams.get("dailyApplyGoal")) || DEFAULT_PROFILE.dailyApplyGoal,
  };
}
