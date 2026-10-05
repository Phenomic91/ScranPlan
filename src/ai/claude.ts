/**
 * Settings shared by every Claude request the app makes. The server proxy
 * (supabase/functions/ai) uses the same model and options.
 */
export const CLAUDE_MODEL = 'claude-opus-5-5';

/** Small extraction jobs don't need deep thinking; low effort keeps them fast and cheap. */
export const CLAUDE_EFFORT = 'low';

/**
 * If Claude declines a request, Anthropic re-runs it on a suitable fallback
 * model instead of returning the refusal.
 */
export const CLAUDE_FALLBACK_BETA = 'server-side-fallback-2026-07-01';

/** Thrown when the model refuses or stops before finishing its answer. */
export class AiIncompleteError extends Error {}
