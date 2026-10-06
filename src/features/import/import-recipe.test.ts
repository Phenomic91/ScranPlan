import { readFileSync } from 'fs';
import { join } from 'path';

import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

import { AiUnavailableError, runAiTask } from '@/ai/router';
import { extractRecipe, type ExtractedRecipe } from '@/ai/tasks/extract-recipe';

import { ImportError } from './import-error';
import { importFromLink, importFromText } from './import-recipe';

jest.mock('@/ai/router', () => {
  class AiUnavailableError extends Error {}
  return { AiUnavailableError, runAiTask: jest.fn() };
});

const mockRunAiTask = runAiTask as jest.MockedFunction<typeof runAiTask>;

const fixture = (name: string) =>
  readFileSync(join(__dirname, '../../domain/import/fixtures', `${name}.html`), 'utf8');

function mockPage(html: string, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status < 400,
    status,
    text: () => Promise.resolve(html),
  });
}

const AI_RECIPE: ExtractedRecipe = {
  name: 'Lemon herb bean salad',
  shortName: 'Bean salad',
  minutes: 25,
  serves: 4,
  vegetarian: true,
  inferred: false,
  blurb: 'Roast courgettes and beans with lemon.',
  oven: { celsius: 200, fanCelsius: 180, gasMark: '6' },
  ingredients: [{ amount: 2, unit: '', name: 'courgettes, sliced' }],
  steps: [
    { title: 'Roast the courgettes', text: 'Roast the courgettes until soft.', timerSeconds: 1200 },
    { title: 'Finish', text: 'Mix everything together.', timerSeconds: null },
  ],
  note: '',
};

beforeEach(() => mockRunAiTask.mockReset());

describe('importFromLink', () => {
  it('uses AI to tidy the recipe data when AI is available', async () => {
    mockPage(fixture('bbc-good-food'));
    mockRunAiTask.mockResolvedValue({
      output: { notARecipe: null, recipe: AI_RECIPE },
      route: 'own-key',
    });

    const draft = await importFromLink('Look at this https://www.bbcgoodfood.com/recipes/x ');

    expect(mockRunAiTask.mock.calls[0]?.[1]).toMatchObject({ kind: 'recipe-data' });
    expect(draft.shortName).toBe('Bean salad');
    expect(draft.steps[0]?.timerSeconds).toBe(1200);
    expect(draft.steps[1]).not.toHaveProperty('timerSeconds');
    expect(draft.source).toMatchObject({
      url: 'https://www.bbcgoodfood.com/recipes/x',
      siteName: 'Good Food',
      author: 'Sam Example',
      inferred: false,
    });
  });

  it("reads the site's recipe data by itself when there is no AI", async () => {
    mockPage(fixture('bbc-food'));
    mockRunAiTask.mockRejectedValue(new AiUnavailableError());

    const draft = await importFromLink('https://www.bbc.co.uk/food/recipes/x');

    expect(draft.name).toBe('Quick chicken and pea risotto');
    expect(draft.steps[0]?.title).toBe('Step 1');
    expect(draft.source?.siteName).toBe('BBC Food');
  });

  it('asks AI to read pages that have no recipe data', async () => {
    mockPage('<title>Soup</title><article><p>Boil 1 litre water with 2 carrots.</p></article>');
    mockRunAiTask.mockResolvedValue({
      output: { notARecipe: null, recipe: { ...AI_RECIPE, inferred: true } },
      route: 'scranplan',
    });

    const draft = await importFromLink('https://example.com/soup');

    expect(mockRunAiTask.mock.calls[0]?.[1]).toMatchObject({ kind: 'web-page' });
    expect(draft.source).toMatchObject({ siteName: 'example.com', inferred: true });
  });

  it('explains when a page without recipe data needs AI', async () => {
    mockPage('<p>Nothing here</p>');
    mockRunAiTask.mockRejectedValue(new AiUnavailableError());

    await expect(importFromLink('https://example.com/soup')).rejects.toThrow(/needs AI/);
  });

  it('explains when a site blocks the app', async () => {
    mockPage('<title>Just a moment...</title>', 403);
    await expect(importFromLink('https://www.example.com/x')).rejects.toThrow(/use Paste text/);
  });

  it('turns away YouTube links for now', async () => {
    await expect(importFromLink('https://youtu.be/abc')).rejects.toThrow(/YouTube/);
  });

  it('needs a link', async () => {
    await expect(importFromLink('chicken curry')).rejects.toBeInstanceOf(ImportError);
  });
});

describe('importFromText', () => {
  it('passes on what AI says when the text is not a recipe', async () => {
    mockRunAiTask.mockResolvedValue({
      output: { notARecipe: 'It is a shopping list.', recipe: null },
      route: 'own-key',
    });
    await expect(importFromText('milk, bread, eggs, washing-up liquid, bin bags')).rejects.toThrow(
      "That doesn't look like a recipe: It is a shopping list.",
    );
  });

  it('keeps no link for pasted text', async () => {
    mockRunAiTask.mockResolvedValue({
      output: { notARecipe: null, recipe: AI_RECIPE },
      route: 'own-key',
    });
    const draft = await importFromText('Bean salad. 2 courgettes. Roast them, then mix.');
    expect(draft.source).toMatchObject({ url: null, siteName: null, inferred: false });
  });

  it('asks for more than a few words', async () => {
    await expect(importFromText('soup')).rejects.toBeInstanceOf(ImportError);
    expect(mockRunAiTask).not.toHaveBeenCalled();
  });
});

describe('extractRecipe task', () => {
  it('has an output schema Claude accepts', () => {
    expect(() => betaZodOutputFormat(extractRecipe.output)).not.toThrow();
  });

  it('keeps requests within the server limits', () => {
    expect(extractRecipe.instructions.length).toBeLessThan(10_000);
    expect(
      extractRecipe.prompt({ kind: 'web-page', text: 'a'.repeat(30_000) }).length,
    ).toBeLessThan(40_000);
  });
});
