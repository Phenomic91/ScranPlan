const WORD_NUMBERS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  forty: 40,
  'forty-five': 45,
};

const FRACTIONS: Record<string, number> = { '¼': 0.25, '½': 0.5, '¾': 0.75 };

const UNIT_SECONDS: Record<string, number> = { hour: 3600, minute: 60, second: 1 };

const NUMBER = `(?:\\d+(?:[.,]\\d+)?\\s*[¼½¾]?|[¼½¾]|${Object.keys(WORD_NUMBERS).join('|')})`;
const UNIT = '(hours?|hrs?|minutes?|mins?|seconds?|secs?)';
const DURATION = new RegExp(
  `\\b(half )?(${NUMBER})(?:\\s*(?:-|–|—|to|or)\\s*(${NUMBER}))?\\s*${UNIT}\\b( and a half)?`,
  'gi',
);
// "1 hour 20 minutes", "1 hr and 20 mins": the gap allowed between the two parts.
const JOINER = /^\s*(?:,|and)?\s*$/i;

type Match = { seconds: number; start: number; end: number; unit: string };

/**
 * Reads a cooking time from a step's text, such as "simmer for 10–12 minutes". Ranges use the
 * shorter figure, so the timer goes off in time to check. When a step mentions several times
 * ("fry the garlic for 30 seconds, then simmer for 10 minutes"), the longest is the main one.
 * Returns seconds, or null when the text gives no time.
 */
export function parseStepSeconds(text: string): number | null {
  const matches = combineHoursAndMinutes(findDurations(text), text);
  const longest = Math.max(0, ...matches.map((match) => match.seconds));
  return longest > 0 ? Math.round(longest) : null;
}

function findDurations(text: string): Match[] {
  return [...text.matchAll(DURATION)].map((match) => {
    const [whole, halfOf, first, second, unitText, andAHalf] = match;
    const unit = unitName(unitText!);
    let amount = Math.min(parseNumber(first!), second ? parseNumber(second) : Infinity);
    if (halfOf) amount /= 2;
    if (andAHalf) amount += 0.5;
    const start = match.index;
    return { seconds: amount * UNIT_SECONDS[unit]!, start, end: start + whole.length, unit };
  });
}

function combineHoursAndMinutes(matches: Match[], text: string): Match[] {
  const combined: Match[] = [];
  for (const match of matches) {
    const previous = combined.at(-1);
    if (
      previous?.unit === 'hour' &&
      match.unit === 'minute' &&
      JOINER.test(text.slice(previous.end, match.start))
    ) {
      combined[combined.length - 1] = { ...match, seconds: previous.seconds + match.seconds };
    } else {
      combined.push(match);
    }
  }
  return combined;
}

function unitName(text: string): string {
  const lower = text.toLowerCase();
  if (lower.startsWith('h')) return 'hour';
  if (lower.startsWith('m')) return 'minute';
  return 'second';
}

function parseNumber(text: string): number {
  const lower = text.trim().toLowerCase();
  if (lower in WORD_NUMBERS) return WORD_NUMBERS[lower]!;
  const fraction = FRACTIONS[lower.slice(-1)] ?? 0;
  const whole = fraction ? lower.slice(0, -1).trim() : lower;
  return (whole ? Number(whole.replace(',', '.')) : 0) + fraction;
}
