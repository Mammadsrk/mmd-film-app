import { SourceAvailability } from '../types';

// Shared in-memory cache for movie source availability across Card hover and VOD Modal
export const clientAvailabilityCache = new Map<string, SourceAvailability[]>();

export function getAvailabilityCacheKey(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .trim()
    .replace(/[0-9]{4}/g, '')
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, '')
    .trim();
}

export async function fetchSourceAvailability(title: string): Promise<SourceAvailability[]> {
  const key = getAvailabilityCacheKey(title);
  if (!key) return [];

  if (clientAvailabilityCache.has(key)) {
    return clientAvailabilityCache.get(key)!;
  }

  try {
    const res = await fetch(`/api/check-sources?query=${encodeURIComponent(title)}`);
    if (res.ok) {
      const data = await res.json();
      const sources: SourceAvailability[] = data.sources || [];
      clientAvailabilityCache.set(key, sources);
      return sources;
    }
  } catch (err) {
    console.warn('Check sources failed for', title, err);
  }

  return [];
}
