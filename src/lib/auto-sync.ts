import type { Application } from "@/types/job-hunt";
import {
  getLocalUpdatedAt,
  loadApplications,
  loadProfile,
  saveApplications,
  saveProfile,
  setLocalUpdatedAt,
} from "@/lib/storage";
import {
  SYNC_SNAPSHOT_VERSION,
  loadSyncMeta,
  saveSyncMeta,
  type SyncMeta,
  type SyncSnapshot,
} from "@/lib/sync-snapshot";
import { decryptFromSync, encryptForSync } from "@/lib/sync-crypto";

export type SyncOutcome =
  | { kind: "off" }
  | { kind: "unavailable" }
  | { kind: "unchanged" }
  | { kind: "pushed" }
  | { kind: "pulled" }
  | { kind: "merged" }
  | { kind: "error"; message: string; wrongPin?: boolean };

export class WrongPinError extends Error {}

const EPOCH = "1970-01-01T00:00:00.000Z";

function localSnapshot(): SyncSnapshot {
  return {
    v: SYNC_SNAPSHOT_VERSION,
    updatedAt: getLocalUpdatedAt() ?? EPOCH,
    profile: loadProfile(),
    applications: loadApplications(),
  };
}

const STATUS_RANK: Record<Application["status"], number> = {
  saved: 0,
  applied: 1,
  rejected: 2,
  interview: 3,
  offer: 4,
};

/** Os dois aparelhos mudaram: junta as listas; o snapshot mais novo vence, mas "enviada" nunca volta a "salva". */
export function mergeSnapshots(a: SyncSnapshot, b: SyncSnapshot): SyncSnapshot {
  const [older, newer] = a.updatedAt <= b.updatedAt ? [a, b] : [b, a];
  const byKey = new Map<string, Application>();
  const keyOf = (app: Application) => app.url?.trim() || app.id;
  for (const app of older.applications) byKey.set(keyOf(app), app);
  for (const app of newer.applications) {
    const prev = byKey.get(keyOf(app));
    if (prev && STATUS_RANK[prev.status] > STATUS_RANK[app.status] && app.status === "saved") {
      byKey.set(keyOf(app), { ...app, status: prev.status, appliedAt: prev.appliedAt });
    } else {
      byKey.set(keyOf(app), app);
    }
  }
  return {
    v: SYNC_SNAPSHOT_VERSION,
    updatedAt: new Date().toISOString(),
    profile: newer.profile,
    applications: [...byKey.values()].sort((x, y) => y.createdAt.localeCompare(x.createdAt)),
  };
}

type Remote = { snapshot: SyncSnapshot } | { missing: true } | { unavailable: true };

async function fetchRemote(code: string, pin: string): Promise<Remote> {
  const res = await fetch(`/api/sync/${encodeURIComponent(code)}`, { cache: "no-store" });
  if (res.status === 404) return { missing: true };
  if (res.status === 503) return { unavailable: true };
  const data = (await res.json()) as { payload?: string; error?: string };
  if (!res.ok || !data.payload) throw new Error(data.error ?? "Falha ao falar com a nuvem");
  let plain: string;
  try {
    plain = await decryptFromSync(code, pin, data.payload);
  } catch {
    throw new WrongPinError("PIN incorreto para este código.");
  }
  return { snapshot: JSON.parse(plain) as SyncSnapshot };
}

async function pushRemote(code: string, pin: string, snapshot: SyncSnapshot): Promise<boolean> {
  const payload = await encryptForSync(code, pin, JSON.stringify(snapshot));
  const res = await fetch(`/api/sync/${encodeURIComponent(code)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload }),
    keepalive: payload.length < 60_000,
  });
  if (res.status === 503) return false;
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Falha ao enviar para a nuvem");
  }
  return true;
}

function applyFromSync(snapshot: SyncSnapshot) {
  saveProfile(snapshot.profile, { fromSync: true });
  saveApplications(snapshot.applications, { fromSync: true });
  setLocalUpdatedAt(snapshot.updatedAt);
}

function record(meta: SyncMeta, patch: Partial<SyncMeta>) {
  saveSyncMeta({ ...meta, ...patch });
}

/** Uma rodada de sync: baixa, decide quem é mais novo, aplica e/ou envia. */
export async function runSync(): Promise<SyncOutcome> {
  const meta = loadSyncMeta();
  if (!meta?.code || !meta.pin || !meta.auto) return { kind: "off" };
  const { code, pin } = meta;

  try {
    const local = localSnapshot();
    const localDirty = !meta.lastSyncedAt || local.updatedAt > meta.lastSyncedAt;
    const remote = await fetchRemote(code, pin);
    const now = new Date().toISOString();

    if ("unavailable" in remote) return { kind: "unavailable" };

    if ("missing" in remote) {
      if (!(await pushRemote(code, pin, local))) return { kind: "unavailable" };
      record(meta, { lastSyncedAt: local.updatedAt, lastPushAt: now, lastError: undefined });
      return { kind: "pushed" };
    }

    const remoteChanged = remote.snapshot.updatedAt !== meta.lastSyncedAt;

    if (remoteChanged && !localDirty) {
      applyFromSync(remote.snapshot);
      record(meta, { lastSyncedAt: remote.snapshot.updatedAt, lastPullAt: now, lastError: undefined });
      return { kind: "pulled" };
    }

    if (remoteChanged && localDirty) {
      const merged = mergeSnapshots(local, remote.snapshot);
      applyFromSync(merged);
      if (!(await pushRemote(code, pin, merged))) return { kind: "unavailable" };
      record(meta, {
        lastSyncedAt: merged.updatedAt,
        lastPullAt: now,
        lastPushAt: now,
        lastError: undefined,
      });
      return { kind: "merged" };
    }

    if (localDirty) {
      if (!(await pushRemote(code, pin, local))) return { kind: "unavailable" };
      record(meta, { lastSyncedAt: local.updatedAt, lastPushAt: now, lastError: undefined });
      return { kind: "pushed" };
    }

    record(meta, { lastPullAt: now, lastError: undefined });
    return { kind: "unchanged" };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Falha no sync";
    record(meta, { lastError: message });
    return { kind: "error", message, wrongPin: e instanceof WrongPinError };
  }
}

/** Liga o sync automático neste aparelho, validando o PIN antes de qualquer envio. */
export async function enableAutoSync(code: string, pin: string): Promise<SyncOutcome> {
  const normalized = code.trim().toUpperCase();
  try {
    await fetchRemote(normalized, pin);
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : "Falha ao validar",
      wrongPin: e instanceof WrongPinError,
    };
  }
  const previous = loadSyncMeta();
  const sameCode = previous?.code === normalized;
  saveSyncMeta({
    code: normalized,
    pin,
    auto: true,
    lastSyncedAt: sameCode ? previous?.lastSyncedAt : undefined,
  });
  return runSync();
}
