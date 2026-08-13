import { Colors } from '../design-system/tokens';

export interface AvatarPreset {
  id: string;
  emoji: string;
  color: string;
}

// Big, fun, colorful smiley presets for users who don't want to upload a photo — colors
// reused from elsewhere in the app (brand/accent/myPlace + a few extra hues used by
// LoginScreen's decorative pins) rather than inventing a new palette.
export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'grin', emoji: '😀', color: Colors.brand.primary },
  { id: 'cool', emoji: '😎', color: Colors.accent.primary },
  { id: 'party', emoji: '🥳', color: Colors.myPlace },
  { id: 'starstruck', emoji: '🤩', color: '#3D9BE9' },
  { id: 'cat', emoji: '😺', color: '#6C63FF' },
  { id: 'heart-eyes', emoji: '😍', color: '#E85A8A' },
  { id: 'wink', emoji: '😉', color: '#F2B138' },
  { id: 'robot', emoji: '🤖', color: '#5C6B73' },
];

export function getAvatarPreset(id: string | undefined): AvatarPreset | undefined {
  return AVATAR_PRESETS.find((p) => p.id === id);
}
