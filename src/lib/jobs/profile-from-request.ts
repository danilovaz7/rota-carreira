import type { JobProfile } from "@/types/job-hunt";
import { normalizeProfile } from "@/lib/profile";

/**
 * Monta o perfil a partir da query string do `/api/jobs/for-you`.
 * Formato atual: `?profile=<json>`. Os parâmetros soltos antigos continuam aceitos.
 */
export function profileFromSearchParams(searchParams: URLSearchParams): JobProfile {
  const raw = searchParams.get("profile");
  if (raw) {
    try {
      return normalizeProfile(JSON.parse(raw));
    } catch {
      // cai no formato antigo abaixo
    }
  }

  const legacy: Record<string, unknown> = {};
  for (const key of [
    "fullName",
    "headline",
    "skills",
    "keywords",
    "location",
    "resumeSummary",
    "yearsExperience",
    "linkedInUrl",
  ]) {
    const v = searchParams.get(key)?.trim();
    if (v) legacy[key] = v;
  }
  if (searchParams.has("dailyApplyGoal")) legacy.dailyApplyGoal = searchParams.get("dailyApplyGoal");
  if (searchParams.has("includeInternships")) {
    legacy.includeInternships = searchParams.get("includeInternships") === "true";
  }
  return normalizeProfile(legacy);
}
