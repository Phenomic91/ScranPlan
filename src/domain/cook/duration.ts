/** "45 sec" for short waits, otherwise whole minutes: "6 min". */
export function formatStepDuration(seconds: number): string {
  return seconds < 90 ? `${seconds} sec` : `${Math.round(seconds / 60)} min`;
}
