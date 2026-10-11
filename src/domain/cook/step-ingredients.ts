import type { Recipe } from '../recipes/recipe';

// Recipes don't link ingredients to steps, so we match on the words the step uses.
// Words that describe an ingredient rather than name it never count on their own,
// nor do dish names ("serve the curry" is not about the curry paste).
const IGNORED_WORDS = new Set(
  [
    'a an and or of the to for with your choice optional',
    'fresh dried frozen raw cooked baby large small medium big thin thick',
    'tin tins can pack pouch jar bag microwave straight-to-wok cooking',
    'chopped sliced diced grated crushed minced shredded whole plain extra virgin',
    'curry pizza pie stew soup salad',
  ]
    .join(' ')
    .split(' '),
);

/**
 * Which ingredients a step mentions, as indexes into `recipe.ingredients`.
 *
 * An ingredient matches when the step contains its full name ("sesame oil"), or a
 * word from its name that no other ingredient in the recipe shares ("chicken").
 * Shared words such as "oil" in "olive oil" and "sesame oil" would be ambiguous.
 */
export function ingredientsForStep(recipe: Recipe, stepIndex: number): number[] {
  const step = recipe.steps[stepIndex];
  if (!step) return [];
  const stepWords = words(`${step.title} ${step.text}`);
  const stepPhrase = ` ${stepWords.join(' ')} `;

  const names = recipe.ingredients.map((item) => nameWords(item.name));
  const useCount = new Map<string, number>();
  for (const word of names.flatMap((name) => [...new Set(name)])) {
    useCount.set(word, (useCount.get(word) ?? 0) + 1);
  }

  const matches: number[] = [];
  names.forEach((name, index) => {
    if (name.length === 0) return;
    const fullName = stepPhrase.includes(` ${name.join(' ')} `);
    const uniqueWord = name.some((word) => useCount.get(word) === 1 && stepWords.includes(word));
    if (fullName || uniqueWord) matches.push(index);
  });
  return matches;
}

/** The naming words of an ingredient: "tin chopped tomatoes (400 g), drained" → ["tomato"]. */
function nameWords(name: string): string[] {
  const head = name.split(',')[0]!.replace(/\(.*?\)/g, ' ');
  return words(head).filter((word) => !IGNORED_WORDS.has(word));
}

function words(text: string): string[] {
  return (text.toLowerCase().match(/[a-zà-ÿ]+(?:-[a-zà-ÿ]+)*/g) ?? [])
    .filter((word) => word.length > 2)
    .map(singular);
}

/** Rough singular, enough to match "eggs" with "egg" and "tomatoes" with "tomato". */
function singular(word: string): string {
  if (word.endsWith('oes')) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}
