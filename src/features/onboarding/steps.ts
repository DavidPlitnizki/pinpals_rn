// Step identity and copy, kept apart from ONBOARDING_COPILOT_OPTIONS so that the tooltip can
// read the titles without importing the module that imports the tooltip. That cycle resolved
// to an undefined tooltipComponent at module-init time and silently dropped the custom card.

// Printed above every hint in the tour, so a first-time user can tell these apart from the
// app's own chrome — they are a thing that ends, not a permanent part of the screen.
export const ONBOARDING_LABEL = 'Getting started';

// Step names are the handle copilot's `start(fromStep)` takes.
export const MAP_TIP_STEP = 'map-long-press';
export const SAVE_TIP_STEP = 'quick-add-save';

export const MAP_TIP_TITLE = 'Save a memory';
export const MAP_TIP_TEXT =
  'Press anywhere on the map, or on a place already marked on it, to see what is there.';

export const SAVE_TIP_TITLE = 'Keep this place';
export const SAVE_TIP_TEXT =
  'Press the + to keep this spot. You can name it, add photos and a mood on the next screen.';

// The two hints inside the place form. Not copilot steps — the form is a native Modal and
// renders above copilot's overlay — but the same tour, so their copy lives here with the rest
// of it rather than inline in the sheet.
export const MEMORY_TIP_TEXT = "Let's add a memory";
export const SAVE_PIN_TIP_TEXT = 'Save it and this memory is yours to keep';

// CopilotStep carries only `text`, so the headline is looked up by step name at render time
// rather than smuggled into the body copy.
export const ONBOARDING_TITLES: Record<string, string> = {
  [MAP_TIP_STEP]: MAP_TIP_TITLE,
  [SAVE_TIP_STEP]: SAVE_TIP_TITLE,
};
