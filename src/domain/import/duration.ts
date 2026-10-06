const ISO_DURATION =
  /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i;

/**
 * Reads an ISO 8601 duration as whole minutes, rounded up: "PT1H30M" is 90,
 * "P0DT0H20M" is 20. Returns null when the text is not a duration.
 */
export function parseIsoDuration(text: unknown): number | null {
  if (typeof text !== 'string') return null;
  const match = ISO_DURATION.exec(text.trim());
  if (!match || text.trim() === 'P' || /T$/i.test(text.trim())) return null;

  const [days = 0, hours = 0, minutes = 0, seconds = 0] = match
    .slice(1)
    .map((part) => Number(part ?? 0));
  return Math.ceil(days * 1440 + hours * 60 + minutes + seconds / 60);
}
