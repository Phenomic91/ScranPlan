import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

import type { AiRoute } from '../task';

/** Thrown when the user has used this month's AI allowance on our server. */
export class AiAllowanceUsedError extends Error {}

/** Calls Claude through our server (supabase/functions/ai), which holds the API key. */
export const scranplanRoute: AiRoute = {
  id: 'scranplan',

  async isAvailable() {
    if (!supabase) return false;
    const { data } = await supabase.auth.getSession();
    return data.session !== null;
  },

  async complete(request) {
    if (!supabase) throw new Error('No server configured.');

    const { data, error } = await supabase.functions.invoke<{ text: string }>('ai', {
      body: request,
    });
    if (error instanceof FunctionsHttpError && error.context.status === 429) {
      throw new AiAllowanceUsedError("You've used this month's AI allowance.");
    }
    if (error instanceof FunctionsHttpError) {
      throw new Error(`ScranPlan's AI server failed: ${await serverReason(error.context)}`);
    }
    if (error) throw error;
    if (!data) throw new Error('The server returned no answer.');
    return data.text;
  },
};

/** The function answers errors as { error }; a crash before that leaves only the status. */
async function serverReason(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
    return body.error;
  }
  return `error ${response.status}`;
}
