/** Sammensætter klassenavne og filtrerer falsy værdier fra. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
