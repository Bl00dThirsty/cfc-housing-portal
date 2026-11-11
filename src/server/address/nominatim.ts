import {
  catalogueSuggestions,
  toSuggestion,
  type AddressSuggestion,
  type NominatimResult,
} from "@/domain/entities/address";

const ENDPOINT = "https://nominatim.openstreetmap.org/search";
const CACHE_TTL_MS = 10 * 60 * 1000;
const MIN_INTERVAL_MS = 1100;
const TIMEOUT_MS = 6000;

const USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ??
  "Credit-Foncier-du-Cameroun/1.0 (Guichet Unique; contact: guichet-unique@cfc.cm)";

interface CacheEntry {
  at: number;
  value: AddressSuggestion[];
}

const cache = new Map<string, CacheEntry>();
let queue: Promise<unknown> = Promise.resolve();
let lastCallAt = 0;

/**
 * La politique d'usage de Nominatim impose au plus une requête par seconde.
 * On sérialise les appels plutôt que de s'appuyer sur le seul debounce
 * côté navigateur : plusieurs onglets ou plusieurs utilisateurs partageant
 * le même process continueraient sinon de dépasser le quota.
 */
function schedule<T>(run: () => Promise<T>): Promise<T> {
  const result = queue.then(async () => {
    const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastCallAt));
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastCallAt = Date.now();
    return run();
  });
  queue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function cacheKey(query: string, countryCodes: string | null): string {
  return `${countryCodes ?? "any"}::${query.trim().toLowerCase()}`;
}

async function searchNominatim(
  query: string,
  countryCodes: string | null,
): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    limit: "8",
    "accept-language": "fr",
  });
  if (countryCodes) params.set("countrycodes", countryCodes);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) return [];
    const payload = (await response.json()) as unknown;
    return Array.isArray(payload) ? (payload as NominatimResult[]) : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchAddresses(
  query: string,
  options: { countryCodes?: string | null; includeCatalogue?: boolean } = {},
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) {
    return options.includeCatalogue === false ? [] : catalogueSuggestions(trimmed);
  }

  const countryCodes = options.countryCodes ?? "cm";
  const key = cacheKey(trimmed, countryCodes);

  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.value;
  }

  const results = await schedule(() => searchNominatim(trimmed, countryCodes));
  const suggestions = results.map(toSuggestion).filter((item) => item.label.length > 0);

  const merged = mergeWithCatalogue(suggestions, trimmed);
  cache.set(key, { at: Date.now(), value: merged });
  return merged;
}

function mergeWithCatalogue(
  suggestions: AddressSuggestion[],
  query: string,
): AddressSuggestion[] {
  if (suggestions.length >= 8) return suggestions;

  const seen = new Set(suggestions.map((item) => item.shortLabel.toLowerCase()));
  const catalogue = catalogueSuggestions(query).filter((item) => {
    if (seen.has(item.shortLabel.toLowerCase())) return false;
    seen.add(item.shortLabel.toLowerCase());
    return true;
  });

  return [...suggestions, ...catalogue].slice(0, 8);
}
