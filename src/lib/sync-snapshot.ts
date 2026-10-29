import type { Application, JobProfile } from "@/types/job-hunt";
import { saveApplications, saveProfile } from "@/lib/storage";

export const SYNC_SNAPSHOT_VERSION = 1 as const;

export type SyncSnapshot = {
  v: typeof SYNC_SNAPSHOT_VERSION;
  updatedAt: string;
  profile: JobProfile;
  applications: Application[];
};

const SYNC_META_KEY = "job-hunt-sync-meta-v1";

export type SyncMeta = {
  code: string;
  lastPullAt?: string;
  lastPushAt?: string;
};

export function buildSnapshot(
  profile: JobProfile,
  applications: Application[],
): SyncSnapshot {
  return {
    v: SYNC_SNAPSHOT_VERSION,
    updatedAt: new Date().toISOString(),
    profile,
    applications,
  };
}

export function applySnapshot(snapshot: SyncSnapshot): void {
  if (snapshot.v !== SYNC_SNAPSHOT_VERSION) {
    throw new Error("Versão de backup não suportada.");
  }
  saveProfile(snapshot.profile);
  saveApplications(snapshot.applications);
}

export function snapshotToPortableText(snapshot: SyncSnapshot): string {
  const json = JSON.stringify(snapshot);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return `CEMPREGO1:${btoa(binary)}`;
}

export function snapshotFromPortableText(text: string): SyncSnapshot {
  const trimmed = text.trim();
  const payload = trimmed.startsWith("CEMPREGO1:")
    ? trimmed.slice("CEMPREGO1:".length)
    : trimmed;
  const json = new TextDecoder().decode(
    Uint8Array.from(atob(payload), (c) => c.charCodeAt(0)),
  );
  const parsed = JSON.parse(json) as SyncSnapshot;
  if (parsed.v !== SYNC_SNAPSHOT_VERSION || !parsed.profile || !parsed.applications) {
    throw new Error("Backup inválido ou corrompido.");
  }
  return parsed;
}

export function loadSyncMeta(): SyncMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SyncMeta;
  } catch {
    return null;
  }
}

export function saveSyncMeta(meta: SyncMeta): void {
  localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
}

export function clearSyncMeta(): void {
  localStorage.removeItem(SYNC_META_KEY);
}
