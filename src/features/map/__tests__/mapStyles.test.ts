import { DEFAULT_MAP_STYLE, MAP_STYLES, mapStyleUrl } from '../mapStyles';

describe('mapStyles', () => {
  it('defaults to streets', () => {
    expect(DEFAULT_MAP_STYLE).toBe('streets');
    expect(MAP_STYLES[0].id).toBe('streets');
  });

  it('resolves every option to its own style URL', () => {
    const urls = MAP_STYLES.map((option) => mapStyleUrl(option.id));
    expect(new Set(urls).size).toBe(MAP_STYLES.length);
    urls.forEach((url) => expect(url).toMatch(/^mapbox:\/\/styles\//));
  });

  // A persisted id from an older build could name a style that no longer exists — falling
  // back beats handing Mapbox an undefined URL and getting a blank map.
  it('falls back to the first style for an unknown id', () => {
    expect(mapStyleUrl('nonsense' as never)).toBe(MAP_STYLES[0].url);
  });
});
