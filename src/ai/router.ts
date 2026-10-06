import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

import { onDeviceRoute } from './routes/on-device';
import { ownKeyRoute } from './routes/own-key';
import { scranplanRoute } from './routes/scranplan';
import type { AiRoute, AiRouteId, AiTask } from './task';

/** Cheapest first: the phone's own model, then the user's key, then our server. */
const ROUTES: AiRoute[] = [onDeviceRoute, ownKeyRoute, scranplanRoute];

export class AiUnavailableError extends Error {
  constructor() {
    super('AI needs a Claude key or a signed-in account.');
  }
}

/**
 * Runs a task on the first route that can take it. If the on-device model
 * fails (it is small and sometimes refuses), the next route tries; errors from
 * Claude routes are passed on, so the user sees why their key or allowance failed.
 */
export async function runAiTask<Input, Output>(
  task: AiTask<Input, Output>,
  input: Input,
): Promise<{ output: Output; route: AiRouteId }> {
  const format = betaZodOutputFormat(task.output);
  const request = {
    system: task.instructions,
    prompt: task.prompt(input),
    schema: format.schema,
    maxTokens: task.maxTokens,
  };

  for (const route of ROUTES) {
    if (route.id === 'on-device' && !task.fitsOnDevice) continue;
    if (!(await route.isAvailable())) continue;

    try {
      return { output: format.parse(await route.complete(request)), route: route.id };
    } catch (error) {
      if (route.id !== 'on-device') throw error;
    }
  }
  throw new AiUnavailableError();
}
