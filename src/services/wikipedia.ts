import { Coordinates } from '../models/types';
import { reportNetworkError } from './crashReporting';

const WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php';

// Free, no API key, no signup — geosearch for the nearest Wikipedia article to these
// coordinates and return its lead image, if any. Only landmarks/notable places realistically
// have an article; anything else (a café, a private trail) returns null and the caller falls
// back to the Mapbox static map.
export async function fetchWikipediaThumbnail(coords: Coordinates): Promise<string | null> {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'geosearch',
    ggscoord: `${coords.latitude}|${coords.longitude}`,
    ggsradius: '300',
    ggslimit: '1',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '500',
    format: 'json',
    origin: '*',
  });

  const url = `${WIKIPEDIA_API_URL}?${params.toString()}`;
  console.log('[wikipedia] thumbnail request →', url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log('[wikipedia] thumbnail response ← error', response.status, await response.text());
      return null;
    }

    const data = (await response.json()) as {
      query?: { pages?: Record<string, { thumbnail?: { source?: string } }> };
    };
    console.log('[wikipedia] thumbnail response ←', JSON.stringify(data));

    const pages = data.query?.pages ?? {};
    const first = Object.values(pages)[0];
    return first?.thumbnail?.source ?? null;
  } catch (err) {
    reportNetworkError('wikipedia', err, 'thumbnail request failed');
    return null;
  }
}
