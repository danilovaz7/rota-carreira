import { NextResponse } from "next/server";
import { cloudSyncAvailable } from "@/lib/sync-server";

export async function GET() {
  return NextResponse.json({ cloud: cloudSyncAvailable() });
}
