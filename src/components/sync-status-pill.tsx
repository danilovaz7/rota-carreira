"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff, Loader2, TriangleAlert } from "lucide-react";
import type { AutoSync } from "@/hooks/use-auto-sync";
import { cn } from "@/lib/utils";

export function formatSyncAgo(iso: string | null, now: number): string {
  if (!iso) return "";
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
}

export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function SyncStatusPill({
  sync,
  onOpenSettings,
}: {
  sync: AutoSync;
  onOpenSettings: () => void;
}) {
  const now = useNow();
  const { state, lastSyncAt } = sync;

  const content = {
    off: { icon: CloudOff, label: "Só neste aparelho" },
    syncing: { icon: Loader2, label: "Sincronizando…" },
    ok: { icon: Cloud, label: `Na nuvem · ${formatSyncAgo(lastSyncAt, now) || "agora"}` },
    error: { icon: TriangleAlert, label: "Sync com problema" },
    unavailable: { icon: CloudOff, label: "Nuvem indisponível" },
  }[state];
  const Icon = content.icon;

  return (
    <button
      type="button"
      onClick={onOpenSettings}
      title="Configurar sincronização entre celular e PC"
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium ring-1 transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        state === "ok" && "bg-emerald-50 text-emerald-800 ring-emerald-200 hover:bg-emerald-100",
        state === "syncing" && "bg-muted text-foreground ring-border",
        state === "error" && "bg-amber-50 text-amber-800 ring-amber-200 hover:bg-amber-100",
        (state === "off" || state === "unavailable") &&
          "bg-card text-muted-foreground ring-border hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className={cn("size-3.5", state === "syncing" && "animate-spin")} />
      {content.label}
    </button>
  );
}
