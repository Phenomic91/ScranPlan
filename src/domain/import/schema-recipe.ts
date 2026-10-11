import { parseIsoDuration } from './duration';
import { htmlToText } from './html';

/**
 * The parts of a schema.org Recipe (https://schema.org/Recipe) the importer
 * uses, read into plain text. Sites fill these in very differently, so every
 * field is optional and nothing here is trusted to be well formed.
 */
export type SchemaRecipe = {
  name: string;
  description: string;
  author: string | null;
  publisher: string | null;
  /** As the site wrote it: "4", "Serves 4", "4 serving(s)". */
  servings: string | null;
  totalMinutes: number | null;
  ingredients: string[];
  steps: string[];
  /** Diets and keywords that say whether the dish is vegetarian. */
  dietHints: string[];
};

type Node = Record<string, unknown>;

/**
 * Finds the Recipe among a page's JSON-LD blocks, which may be a single
 * object, an array, or a Yoast-style `@graph` whose nodes refer to each other by `@id`.
 */
export function findSchemaRecipe(blocks: unknown[]): SchemaRecipe | null {
  const nodes = blocks.flatMap(collectNodes);
  const byId = new Map(
    nodes.flatMap((node) => (typeof node['@id'] === 'string' ? [[node['@id'], node]] : [])),
  );
  const resolve = (value: unknown): unknown => {
    const id = isNode(value) && Object.keys(value).length === 1 ? value['@id'] : undefined;
    return typeof id === 'string' ? (byId.get(id) ?? value) : value;
  };

  const recipe = nodes.find((node) => hasType(node, 'Recipe'));
  if (!recipe) return null;
  const name = text(recipe.name) || text(recipe.headline);
  if (!name) return null;

  return {
    name,
    description: text(recipe.description),
    author: personName(resolve(recipe.author), resolve),
    publisher: personName(resolve(recipe.publisher), resolve),
    servings: firstText(recipe.recipeYield),
    totalMinutes: totalMinutes(recipe),
    ingredients: toArray(recipe.recipeIngredient).map(text).filter(Boolean),
    steps: readSteps(recipe.recipeInstructions),
    dietHints: [recipe.suitableForDiet, recipe.keywords, recipe.recipeCategory]
      .flatMap(toArray)
      .flatMap((hint) => text(hint).split(','))
      .map((hint) => hint.trim())
      .filter(Boolean),
  };
}

/** Reads the first whole number in a yield such as "Serves 4–6" or "4 serving(s)". */
export function readServings(servings: string | null): number | null {
  const value = Number(/\d+/.exec(servings ?? '')?.[0]);
  return value > 0 && value <= 100 ? value : null;
}

function collectNodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(collectNodes);
  if (!isNode(value)) return [];
  const graph = Array.isArray(value['@graph']) ? value['@graph'].flatMap(collectNodes) : [];
  const main = isNode(value.mainEntity) ? collectNodes(value.mainEntity) : [];
  return [value, ...graph, ...main];
}

function totalMinutes(recipe: Node): number | null {
  const total = parseIsoDuration(recipe.totalTime);
  if (total) return total;
  const parts = [recipe.prepTime, recipe.cookTime].map(parseIsoDuration);
  return parts.some((minutes) => minutes)
    ? parts.reduce<number>((sum, m) => sum + (m ?? 0), 0)
    : null;
}

/** Steps can be one string, strings, HowToSteps, or HowToSections holding HowToSteps. */
function readSteps(value: unknown): string[] {
  return toArray(value).flatMap((item): string[] => {
    if (typeof item === 'string') {
      return htmlToText(item).split('\n').filter(Boolean);
    }
    if (!isNode(item)) return [];
    if (hasType(item, 'HowToSection') || Array.isArray(item.itemListElement)) {
      return readSteps(item.itemListElement);
    }
    const stepText = text(item.text) || text(item.name);
    return stepText ? [stepText] : [];
  });
}

function personName(value: unknown, resolve: (value: unknown) => unknown): string | null {
  const first = resolve(toArray(value)[0]);
  if (typeof first === 'string') return text(first) || null;
  return isNode(first) ? text(first.name) || null : null;
}

function firstText(value: unknown): string | null {
  const first = toArray(value).find((item) => typeof item === 'string' || typeof item === 'number');
  return first === undefined ? null : String(first);
}

function text(value: unknown): string {
  if (typeof value === 'number') return String(value);
  return typeof value === 'string' ? htmlToText(value).replace(/\n/g, ' ') : '';
}

function toArray(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function isNode(value: unknown): value is Node {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasType(node: Node, type: string): boolean {
  return toArray(node['@type']).some(
    (value) => value === type || value === `https://schema.org/${type}`,
  );
}
