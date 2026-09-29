import type { Place } from "./types";

/** Lowercase and strip accents so "cafe" matches "Café". */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Score how well a place matches a query. Higher is better; 0 = no match.
 * Every word in the query must match something (name, keyword or category).
 */
function scorePlace(place: Place, words: string[]): number {
  const name = normalize(place.name);
  const keywords = place.keywords.map(normalize);
  const category = normalize(place.category);

  let total = 0;
  for (const word of words) {
    let best = 0;
    if (name.startsWith(word)) best = 100;
    else if (name.split(/\s+/).some((w) => w.startsWith(word))) best = 80;
    else if (name.includes(word)) best = 60;
    else if (keywords.some((k) => k.startsWith(word))) best = 40;
    else if (keywords.some((k) => k.includes(word))) best = 30;
    else if (category.startsWith(word)) best = 20;
    if (best === 0) return 0;
    total += best;
  }
  return total;
}

/**
 * Filter and rank places. Empty query returns every place (sorted by level,
 * then name). Sponsored ranking is added in phase 5.
 */
export function searchPlaces(places: Place[], query: string): Place[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const byLevelThenName = (a: Place, b: Place) =>
    a.level - b.level || a.name.localeCompare(b.name);

  if (words.length === 0) return [...places].sort(byLevelThenName);

  return places
    .map((place) => ({ place, score: scorePlace(place, words) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || byLevelThenName(a.place, b.place))
    .map((r) => r.place);
}
