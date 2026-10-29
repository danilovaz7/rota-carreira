import type { Application, JobProfile } from "@/types/job-hunt";
import { DEFAULT_PROFILE } from "@/types/job-hunt";

const PROFILE_KEY = "job-hunt-profile-v2";
const LEGACY_PROFILE_KEY = "job-hunt-profile-v1";
const APPS_KEY = "job-hunt-applications-v1";

export function loadProfile(): JobProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    let raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_PROFILE_KEY);
      if (raw) {
        localStorage.setItem(PROFILE_KEY, raw);
      }
    }
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<JobProfile>;
    const merged = { ...DEFAULT_PROFILE, ...parsed };
    const empty =
      !parsed.fullName?.trim() &&
      !parsed.headline?.trim() &&
      !parsed.skills?.trim();
    return empty ? DEFAULT_PROFILE : merged;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: JobProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadApplications(): Application[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(APPS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Application[];
  } catch {
    return [];
  }
}

export function saveApplications(apps: Application[]): void {
  localStorage.setItem(APPS_KEY, JSON.stringify(apps));
}

export function newApplicationId(): string {
  return crypto.randomUUID();
}
