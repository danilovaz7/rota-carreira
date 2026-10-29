const TTL_SECONDS = 60 * 60 * 24 * 90;

function upstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

async function upstash(command: string[]): Promise<string | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(command),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { result?: string | null };
  return data.result ?? null;
}

export function cloudSyncAvailable(): boolean {
  return upstashConfigured();
}

export async function readCloudSync(code: string): Promise<string | null> {
  if (!upstashConfigured()) return null;
  const key = `sync:${code.trim().toUpperCase()}`;
  return upstash(["GET", key]);
}

export async function writeCloudSync(code: string, ciphertext: string): Promise<boolean> {
  if (!upstashConfigured()) return false;
  const key = `sync:${code.trim().toUpperCase()}`;
  const ok = await upstash(["SET", key, ciphertext, "EX", String(TTL_SECONDS)]);
  return ok === "OK";
}
