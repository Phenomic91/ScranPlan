/**
 * Lets code that writes synced rows ask for a sync without knowing about the
 * sync provider. Requests are debounced so a burst of edits syncs once.
 */
const DEBOUNCE_MS = 2_000;

let handler: (() => void) | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

export function requestSync(): void {
  clearTimeout(timer);
  timer = setTimeout(() => handler?.(), DEBOUNCE_MS);
}

/** Registers the function that runs a sync. Returns an unregister function. */
export function handleSyncRequests(run: () => void): () => void {
  handler = run;
  return () => {
    if (handler === run) handler = null;
    clearTimeout(timer);
  };
}
