import { reanchorPhotoUri, reanchorPhotoUris } from '../photoStorage';

// The mocked Paths.document in jest.setup stands in for the app's Documents directory; what
// matters is that a path from a *different* container comes back rooted in the current one.
const STALE =
  'file:///var/mobile/Containers/Data/Application/OLD-UUID/Documents/pinpals-photos/2026-08-26/abc.jpg';

describe('reanchorPhotoUri', () => {
  it('re-roots a path left behind by a previous install', () => {
    const fixed = reanchorPhotoUri(STALE);
    expect(fixed).not.toBe(STALE);
    expect(fixed).toContain('pinpals-photos/2026-08-26/abc.jpg');
    expect(fixed).not.toContain('OLD-UUID');
  });

  it('leaves uris that are not ours alone', () => {
    expect(reanchorPhotoUri('https://example.com/a.jpg')).toBe('https://example.com/a.jpg');
    expect(reanchorPhotoUri('ph://ABC-123')).toBe('ph://ABC-123');
  });

  it('passes through empty values', () => {
    expect(reanchorPhotoUri(undefined)).toBeUndefined();
    expect(reanchorPhotoUri(null)).toBeNull();
    expect(reanchorPhotoUris(undefined)).toBeUndefined();
  });

  it('maps every uri in a list', () => {
    const fixed = reanchorPhotoUris([STALE, 'https://example.com/a.jpg']);
    expect(fixed).toHaveLength(2);
    expect(fixed![0]).not.toContain('OLD-UUID');
    expect(fixed![1]).toBe('https://example.com/a.jpg');
  });
});
