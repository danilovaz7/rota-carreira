"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { enableAutoSync, runSync, type SyncOutcome } from "@/lib/auto-sync";
import { clearSyncMeta, loadSyncMeta, saveSyncMeta } from "@/lib/sync-snapshot";

export type AutoSyncState = "off" | "syncing" | "ok" | "error" | "unavailable";

export type AutoSync = {
  state: AutoSyncState;
  code: string | null;
  lastSyncAt: string | null;
  error: string | null;
  syncNow: () => Promise<SyncOutcome>;
  enable: (code: string, pin: string) => Promise<SyncOutcome>;
  disable: () => void;
};

const PUSH_DEBOUNCE_MS = 1500;
const POLL_MS = 45_000;

/**
 * Mantém este aparelho e a nuvem iguais: sincroniza ao abrir, ao voltar para a aba,
 * a cada 45s com a aba visível, logo depois de qualquer mudança e ao sair da aba.
 */
export function useAutoSync({
  ready,
  changeKey,
  onRemoteApplied,
}: {
  ready: boolean;
  changeKey: unknown;
  onRemoteApplied: () => void;
}): AutoSync {
  const [state, setState] = useState<AutoSyncState>("off");
  const [code, setCode] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(() => {
    const meta = loadSyncMeta();
    return [meta?.lastPullAt, meta?.lastPushAt].filter(Boolean).sort().at(-1) ?? null;
  });
  const [error, setError] = useState<string | null>(null);

  const running = useRef<Promise<SyncOutcome> | null>(null);
  const rerun = useRef(false);
  const onRemoteAppliedRef = useRef(onRemoteApplied);
  useEffect(() => {
    onRemoteAppliedRef.current = onRemoteApplied;
  }, [onRemoteApplied]);

  const handleOutcome = useCallback((outcome: SyncOutcome) => {
    const meta = loadSyncMeta();
    setCode(meta?.auto ? meta.code : null);
    switch (outcome.kind) {
      case "off":
        setState("off");
        break;
      case "unavailable":
        setState("unavailable");
        break;
      case "error":
        setState("error");
        setError(outcome.message);
        break;
      default:
        setState("ok");
        setError(null);
        setLastSyncAt(new Date().toISOString());
        if (outcome.kind === "pulled" || outcome.kind === "merged") {
          onRemoteAppliedRef.current();
        }
    }
  }, []);

  const syncNow = useCallback(async (): Promise<SyncOutcome> => {
    if (running.current) {
      rerun.current = true;
      return running.current;
    }
    const meta = loadSyncMeta();
    if (!meta?.auto) {
      handleOutcome({ kind: "off" });
      return { kind: "off" };
    }
    setState("syncing");
    const job = (async () => {
      let outcome: SyncOutcome;
      do {
        rerun.current = false;
        outcome = await runSync();
        handleOutcome(outcome);
      } while (rerun.current && outcome.kind !== "error");
      return outcome;
    })();
    running.current = job;
    try {
      return await job;
    } finally {
      running.current = null;
    }
  }, [handleOutcome]);

  const enable = useCallback(
    async (rawCode: string, pin: string) => {
      setState("syncing");
      const outcome = await enableAutoSync(rawCode, pin);
      if (outcome.kind === "error" && outcome.wrongPin) {
        const meta = loadSyncMeta();
        if (meta) saveSyncMeta({ ...meta, auto: false, pin: undefined });
      }
      handleOutcome(outcome);
      return outcome;
    },
    [handleOutcome],
  );

  const disable = useCallback(() => {
    clearSyncMeta();
    setCode(null);
    setError(null);
    setLastSyncAt(null);
    setState("off");
  }, []);

  useEffect(() => {
    if (!ready) return;
    const initial = window.setTimeout(() => void syncNow(), 0);

    const onVisibility = () => void syncNow();
    const onFocus = () => void syncNow();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void syncNow();
    }, POLL_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [ready, syncNow]);

  const firstChange = useRef(true);
  useEffect(() => {
    if (!ready) return;
    if (firstChange.current) {
      firstChange.current = false;
      return;
    }
    const t = window.setTimeout(() => void syncNow(), PUSH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [ready, changeKey, syncNow]);

  return { state, code, lastSyncAt, error, syncNow, enable, disable };
}
