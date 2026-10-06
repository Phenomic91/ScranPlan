import Anthropic from '@anthropic-ai/sdk';

import { getOwnClaudeKey } from '../own-key-store';
import { AiIncompleteError, CLAUDE_EFFORT, CLAUDE_FALLBACK_BETA, CLAUDE_MODEL } from '../claude';
import type { AiRoute } from '../task';

/** Calls Claude straight from the phone with the user's own API key. */
export const ownKeyRoute: AiRoute = {
  id: 'own-key',

  isAvailable: async () => (await getOwnClaudeKey()) !== null,

  async complete({ system, prompt, schema, maxTokens }) {
    const apiKey = await getOwnClaudeKey();
    if (!apiKey) throw new Error('No Claude key saved.');

    const client = new Anthropic({ apiKey });
    const response = await client.beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      betas: [CLAUDE_FALLBACK_BETA],
      fallbacks: 'default',
      system,
      messages: [{ role: 'user', content: prompt }],
      output_config: { effort: CLAUDE_EFFORT, format: { type: 'json_schema', schema } },
    });

    if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') {
      throw new AiIncompleteError(`Claude stopped early (${response.stop_reason}).`);
    }
    const text = response.content.find((block) => block.type === 'text');
    if (!text) throw new AiIncompleteError('Claude returned no answer.');
    return text.text;
  },
};
