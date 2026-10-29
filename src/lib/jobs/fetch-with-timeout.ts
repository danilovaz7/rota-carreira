const DEFAULT_TIMEOUT_MS = 12_000;

/** Every job source goes through this so one slow site can't stall the whole feed. */
export function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  return fetch(input, { ...init, signal: AbortSignal.timeout(timeoutMs) });
}
