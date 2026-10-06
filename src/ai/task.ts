import type { z } from 'zod';

/**
 * One job the app asks an AI model to do, such as reading ingredient lines.
 * The output schema is enforced on every route, so callers get typed data.
 */
export type AiTask<Input, Output> = {
  name: string;
  /** System prompt: who the model is and the rules for this job. */
  instructions: string;
  prompt: (input: Input) => string;
  output: z.ZodType<Output>;
  maxTokens: number;
  /**
   * Whether the job is small and simple enough for the on-device model,
   * which has a 4,096-token window and weak reasoning.
   */
  fitsOnDevice: boolean;
};

/** What a route receives: the task flattened into a plain request. */
export type AiRequest = {
  system: string;
  prompt: string;
  /** JSON Schema for the reply, already in the form Claude's structured outputs accept. */
  schema: Record<string, unknown>;
  maxTokens: number;
};

export type AiRouteId = 'on-device' | 'own-key' | 'scranplan';

/** One way of running a request. Routes return the model's JSON reply as text. */
export type AiRoute = {
  id: AiRouteId;
  isAvailable: () => Promise<boolean>;
  complete: (request: AiRequest) => Promise<string>;
};
