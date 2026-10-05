// AI proxy: runs a Claude request with our API key for a signed-in user, within
// their monthly allowance. The app decides what to ask (src/ai); this function
// only checks the caller, caps the request size and counts usage.
//
// Secrets: ANTHROPIC_API_KEY (required), AI_MONTHLY_REQUESTS (optional, default 300).

import Anthropic from '@anthropic-ai/sdk';
import { withSupabase } from '@supabase/server';
import { z } from 'zod';

// Keep in step with src/ai/claude.ts.
const CLAUDE_MODEL = 'claude-opus-5-5';
const CLAUDE_EFFORT = 'low';
const CLAUDE_FALLBACK_BETA = 'server-side-fallback-2026-07-01';

const MONTHLY_REQUESTS = Number(Deno.env.get('AI_MONTHLY_REQUESTS') ?? 300);

// Caps that stop the proxy being used for jobs far bigger than the app's own.
const requestSchema = z.object({
  system: z.string().max(10_000),
  prompt: z.string().min(1).max(40_000),
  schema: z.record(z.string(), z.unknown()),
  maxTokens: z.number().int().min(1).max(8_000),
});

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const parsed = requestSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: 'Bad request' }, { status: 400 });
    const { system, prompt, schema, maxTokens } = parsed.data;

    // Runs as the user, so the count lands on their row.
    const { data: allowed, error } = await ctx.supabase.rpc('consume_ai_allowance', {
      monthly_limit: MONTHLY_REQUESTS,
    });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!allowed) return Response.json({ error: 'Monthly AI allowance used' }, { status: 429 });

    const response = await anthropic.beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      betas: [CLAUDE_FALLBACK_BETA],
      fallbacks: 'default',
      system,
      messages: [{ role: 'user', content: prompt }],
      output_config: { effort: CLAUDE_EFFORT, format: { type: 'json_schema', schema } },
    });

    if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') {
      return Response.json(
        { error: `Claude stopped early (${response.stop_reason})` },
        { status: 502 },
      );
    }
    const text = response.content.find((block) => block.type === 'text');
    if (!text) return Response.json({ error: 'Claude returned no answer' }, { status: 502 });

    return Response.json({ text: text.text });
  }),
};
