// Initials for the avatar fallback — shown when a profile has no photo and no preset, and
// when a remote avatar (adopted from a Google account) fails to load. Shared: the map's
// profile button and the Profile screen both render the same avatar and must agree.
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}
