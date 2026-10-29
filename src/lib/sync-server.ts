import { promises as fs } from "node:fs";
import path from "node:path";

const TTL_SECONDS = 60 * 60 * 24 * 180;

/** Aceita os nomes que o Upstash e a integração Vercel KV/Upstash criam. */
function upstashCredentials(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

/** Só em desenvolvimento local: guarda em arquivo para testar o sync sem Redis. */
const DEV_STORE = path.join(process.cwd(), ".data", "sync-dev.json");
const devStoreEnabled = () => process.env.NODE_ENV !== "production" && !upstashCredentials();

async function readDevStore(): Promise<Record<string, string>> {
  try {
    return JSON.parse(await fs.readFile(DEV_STORE, "utf8"));
  } catch {
    return {};
  }
}

async function upstash(command: string[]): Promise<string | null> {
  const creds = upstashCredentials()!;
  const res = await fetch(creds.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${creds.token}` },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { result?: string | null };
  return data.result ?? null;
}

const keyFor = (code: string) => `sync:${code.trim().toUpperCase()}`;

export function cloudSyncAvailable(): boolean {
  return Boolean(upstashCredentials()) || devStoreEnabled();
}

export async function readCloudSync(code: string): Promise<string | null> {
  if (upstashCredentials()) return upstash(["GET", keyFor(code)]);
  if (devStoreEnabled()) return (await readDevStore())[keyFor(code)] ?? null;
  return null;
}

export async function writeCloudSync(code: string, ciphertext: string): Promise<boolean> {
  if (upstashCredentials()) {
    return (await upstash(["SET", keyFor(code), ciphertext, "EX", String(TTL_SECONDS)])) === "OK";
  }
  if (devStoreEnabled()) {
    const store = await readDevStore();
    store[keyFor(code)] = ciphertext;
    await fs.mkdir(path.dirname(DEV_STORE), { recursive: true });
    await fs.writeFile(DEV_STORE, JSON.stringify(store));
    return true;
  }
  return false;
}
