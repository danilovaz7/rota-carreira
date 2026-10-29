import { NextResponse } from "next/server";
import {
  cloudSyncAvailable,
  readCloudSync,
  writeCloudSync,
} from "@/lib/sync-server";

type RouteContext = { params: Promise<{ code: string }> };

function normalizeCode(raw: string): string | null {
  const code = raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) return null;
  return code;
}

export async function GET(_request: Request, context: RouteContext) {
  const { code: raw } = await context.params;
  const code = normalizeCode(raw);
  if (!code) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }
  if (!cloudSyncAvailable()) {
    return NextResponse.json(
      {
        error: "Sync na nuvem não está ativo neste deploy.",
        hint: "Use copiar/colar na aba Perfil, ou configure Upstash Redis na Vercel.",
      },
      { status: 503 },
    );
  }
  const payload = await readCloudSync(code);
  if (!payload) {
    return NextResponse.json({ error: "Nenhum backup neste código ainda." }, { status: 404 });
  }
  return NextResponse.json({ code, payload });
}

export async function PUT(request: Request, context: RouteContext) {
  const { code: raw } = await context.params;
  const code = normalizeCode(raw);
  if (!code) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }
  if (!cloudSyncAvailable()) {
    return NextResponse.json(
      {
        error: "Sync na nuvem não está ativo neste deploy.",
        hint: "Use copiar/colar na aba Perfil.",
      },
      { status: 503 },
    );
  }
  let body: { payload?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!body.payload || body.payload.length > 800_000) {
    return NextResponse.json({ error: "Payload inválido ou grande demais" }, { status: 400 });
  }
  const ok = await writeCloudSync(code, body.payload);
  if (!ok) {
    return NextResponse.json({ error: "Falha ao salvar na nuvem" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, code });
}
