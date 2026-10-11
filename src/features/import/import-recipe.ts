import { AiUnavailableError, runAiTask } from '@/ai/router';
import { extractRecipe, type RecipeMaterial } from '@/ai/tasks/extract-recipe';
import { readJsonLdBlocks, readMetaContent, readPageText } from '@/domain/import/html';
import {
  recipeFromSchema,
  schemaRecipeAsText,
  type RecipeContent,
} from '@/domain/import/recipe-from-schema';
import { findSchemaRecipe } from '@/domain/import/schema-recipe';
import type { RecipeSource } from '@/domain/recipes/recipe';
import type { RecipeDraft } from '@/features/recipes/recipes-store';

import { fetchPage } from './fetch-page';
import { ImportError } from './import-error';
import { tidyExtracted } from './tidy-extracted';

/** Keeps AI requests inside the server's size cap, with room for the instructions. */
const MAX_MATERIAL_LENGTH = 30_000;
const MIN_PASTED_LENGTH = 30;

const NEEDS_AI =
  'Reading this needs AI. Sign in, or add your own Claude key in Settings, then try again.';

/**
 * Imports a recipe from a pasted link. Most sites embed the recipe as data,
 * which the phone reads for free; AI tidies it into the app's format when
 * available. Pages without recipe data are read by AI from the page text.
 */
export async function importFromLink(pasted: string): Promise<RecipeDraft> {
  const url = findLink(pasted);
  if (/(^|\.)(youtube\.com|youtu\.be)$/i.test(url.hostname)) {
    throw new ImportError(
      "YouTube links can't be read yet. Copy the video description and use Paste text instead.",
    );
  }

  const html = await fetchPage(url);
  const schema = findSchemaRecipe(readJsonLdBlocks(html));
  const source = (inferred: boolean): RecipeSource => ({
    url: url.href,
    siteName:
      readMetaContent(html, 'og:site_name') ??
      schema?.publisher ??
      url.hostname.replace(/^www\./, ''),
    author: schema?.author ?? null,
    importedAt: new Date().toISOString(),
    inferred,
  });

  if (schema) {
    try {
      const { recipe, inferred } = await extractWithAi({
        kind: 'recipe-data',
        text: schemaRecipeAsText(schema),
      });
      return { ...recipe, source: source(inferred) };
    } catch {
      // The site's own data is good enough on its own, whatever stopped the AI.
      return { ...recipeFromSchema(schema), source: source(false) };
    }
  }

  const { recipe, inferred } = await extractOrExplain({
    kind: 'web-page',
    text: readPageText(html, MAX_MATERIAL_LENGTH),
  });
  return { ...recipe, source: source(inferred) };
}

/** Imports a recipe from pasted text, such as an Apple Note or a video description. */
export async function importFromText(pasted: string): Promise<RecipeDraft> {
  const text = pasted.trim();
  if (text.length < MIN_PASTED_LENGTH) {
    throw new ImportError('Paste a recipe, or at least a list of ingredients.');
  }
  if (text.length > MAX_MATERIAL_LENGTH) {
    throw new ImportError('That is too much text. Paste just the ingredients and method.');
  }

  const { recipe, inferred } = await extractOrExplain({ kind: 'pasted-text', text });
  return {
    ...recipe,
    source: {
      url: null,
      siteName: null,
      author: null,
      importedAt: new Date().toISOString(),
      inferred,
    },
  };
}

function findLink(pasted: string): URL {
  const link = /https?:\/\/[^\s<>"']+/i.exec(pasted)?.[0];
  if (!link) throw new ImportError("That doesn't look like a link. Copy the recipe's web address.");
  try {
    return new URL(link);
  } catch {
    throw new ImportError("That link isn't complete. Copy the recipe's web address again.");
  }
}

/** Like extractWithAi, but turns "no AI" into a message the user can act on. */
async function extractOrExplain(material: RecipeMaterial) {
  try {
    return await extractWithAi(material);
  } catch (error) {
    if (error instanceof AiUnavailableError) throw new ImportError(NEEDS_AI);
    throw error;
  }
}

async function extractWithAi(
  material: RecipeMaterial,
): Promise<{ recipe: RecipeContent; inferred: boolean }> {
  const { output } = await runAiTask(extractRecipe, material);
  if (output.notARecipe !== null || output.recipe === null) {
    throw new ImportError(
      `That doesn't look like a recipe${output.notARecipe ? `: ${output.notARecipe}` : '.'}`,
    );
  }
  const recipe = tidyExtracted(output.recipe);
  if (recipe.ingredients.length === 0 || recipe.steps.length === 0) {
    throw new ImportError(
      "Couldn't find ingredients and a method in that. Try adding more of the recipe.",
    );
  }
  return { recipe, inferred: output.recipe.inferred };
}
