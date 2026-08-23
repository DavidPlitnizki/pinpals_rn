import packageJson from '../../package.json';

// The app's version comes from package.json (npm's own source of truth) rather than
// app.json/Constants.expoConfig — those two are otherwise two separate places a version
// bump has to be remembered, and they can drift.
export const APP_VERSION: string = packageJson.version;

export interface ReleaseNote {
  version: string;
  date: string;
  features: string[];
}

// Newest first. Add a new entry here whenever APP_VERSION (package.json) is bumped —
// the dev-time check below catches a forgotten entry, but only in a dev build console.
export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '1.0.0',
    date: '2026-08-22',
    features: [
      'Save places with photos, tags, ratings, and a custom pin color',
      'Mark places as Favorite or Want to visit',
      'Add memory notes to a place — text, photos, mood, companions',
      'Get walking, driving, or cycling directions and share them',
      'See the weather at your current map location',
      'Remembrance feed: sort and filter your saved places, with stats',
      'Sign in with Google, Apple, or continue as a guest',
    ],
  },
];

if (__DEV__ && RELEASE_NOTES[0]?.version !== APP_VERSION) {
  console.warn(
    `[releaseNotes] APP_VERSION is "${APP_VERSION}" but the newest RELEASE_NOTES entry is ` +
      `"${RELEASE_NOTES[0]?.version}" — add a new entry to src/shared/releaseNotes.ts.`,
  );
}
