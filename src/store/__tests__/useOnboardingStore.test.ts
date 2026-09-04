import AsyncStorage from '@react-native-async-storage/async-storage';

import { useOnboardingStore } from '../useOnboardingStore';

describe('useOnboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.setState({ stage: 'map-tip', hydrated: true });
  });

  it('advances from the welcome screen to the map hint', () => {
    useOnboardingStore.setState({ stage: 'welcome' });

    useOnboardingStore.getState().completeWelcome();

    expect(useOnboardingStore.getState().stage).toBe('map-tip');
  });

  it('advances from the map hint to the save hint', () => {
    useOnboardingStore.getState().completeMapTip();

    expect(useOnboardingStore.getState().stage).toBe('save-tip');
  });

  it('does not rewind a finished tour when the welcome screen reports again', () => {
    useOnboardingStore.setState({ stage: 'done' });

    useOnboardingStore.getState().completeWelcome();

    expect(useOnboardingStore.getState().stage).toBe('done');
  });

  it('does not rewind a finished tour when the map hint reports again', () => {
    useOnboardingStore.setState({ stage: 'done' });

    useOnboardingStore.getState().completeMapTip();

    expect(useOnboardingStore.getState().stage).toBe('done');
  });

  it('walks the whole tour from the welcome screen to the end', () => {
    const store = useOnboardingStore.getState;

    useOnboardingStore.setState({ stage: 'welcome' });

    store().completeWelcome();
    expect(store().stage).toBe('map-tip');

    store().completeMapTip();
    expect(store().stage).toBe('save-tip');

    store().completeSaveTip();
    expect(store().stage).toBe('memory-tip');

    store().completeMemoryTip();
    expect(store().stage).toBe('save-pin-tip');

    store().completePlaceSaved();
    expect(store().stage).toBe('remembrance-tip');

    store().completeRemembranceTip();
    expect(store().stage).toBe('done');
  });

  it('skips the save-pin hint for someone who saves before writing a memory', () => {
    // Finding the tick without being pointed at it is the hint being unnecessary, not the
    // tour being broken — it moves straight on to where the place went.
    useOnboardingStore.setState({ stage: 'memory-tip' });

    useOnboardingStore.getState().completePlaceSaved();

    expect(useOnboardingStore.getState().stage).toBe('remembrance-tip');
  });

  it('ends the tour when the form is abandoned instead of saved', () => {
    // Nothing was saved, so the last hint would point at a tab with nothing in it.
    useOnboardingStore.setState({ stage: 'save-pin-tip' });

    useOnboardingStore.getState().abandonPlaceForm();

    expect(useOnboardingStore.getState().stage).toBe('done');
  });

  it('leaves a finished tour alone when the form is used again later', () => {
    useOnboardingStore.setState({ stage: 'done' });

    useOnboardingStore.getState().abandonPlaceForm();
    useOnboardingStore.getState().completePlaceSaved();
    useOnboardingStore.getState().completeMemoryTip();

    expect(useOnboardingStore.getState().stage).toBe('done');
  });

  it('does not restart the tour when a later hint reports on a finished one', () => {
    useOnboardingStore.setState({ stage: 'done' });

    useOnboardingStore.getState().completeSaveTip();

    expect(useOnboardingStore.getState().stage).toBe('done');
  });

  it('skipping from the first hint does not leave the second one pending', () => {
    useOnboardingStore.getState().skipOnboarding();

    expect(useOnboardingStore.getState().stage).toBe('done');
  });

  it('rewinds all the way to the welcome screen, not just to the first hint', () => {
    useOnboardingStore.setState({ stage: 'remembrance-tip' });

    useOnboardingStore.getState().resetOnboarding();

    expect(useOnboardingStore.getState().stage).toBe('welcome');
  });

  it('marks the attribution question answered, independently of the tour stage', () => {
    useOnboardingStore.setState({ attributionCompleted: false });

    useOnboardingStore.getState().completeAttribution();

    expect(useOnboardingStore.getState().attributionCompleted).toBe(true);
  });

  it('does not re-ask attribution just because the tour was replayed', () => {
    useOnboardingStore.setState({ stage: 'remembrance-tip', attributionCompleted: true });

    useOnboardingStore.getState().resetOnboarding();

    expect(useOnboardingStore.getState().attributionCompleted).toBe(true);
  });

  it('reports hydrated even when nothing was ever stored', async () => {
    // The gate the map screen waits on. If this never flipped on a fresh install, the tour
    // would simply never start — no error, nothing on screen. Rehydrating against empty
    // storage does not touch in-memory state at all, so this starts from the store's own
    // default rather than the 'map-tip' the outer beforeEach leaves behind — otherwise the
    // assertion below would pass whether or not hydration actually ran.
    await AsyncStorage.clear();
    useOnboardingStore.setState({ stage: 'welcome', hydrated: false });

    await useOnboardingStore.persist.rehydrate();

    expect(useOnboardingStore.getState().hydrated).toBe(true);
    expect(useOnboardingStore.getState().stage).toBe('welcome');
  });

  it('restores a finished tour rather than replaying it every cold start', async () => {
    await AsyncStorage.setItem(
      'pinpals-onboarding',
      JSON.stringify({ state: { stage: 'done' }, version: 0 }),
    );

    await useOnboardingStore.persist.rehydrate();

    expect(useOnboardingStore.getState().stage).toBe('done');
    expect(useOnboardingStore.getState().hydrated).toBe(true);
  });

  it('restores a completed attribution answer rather than re-asking every cold start', async () => {
    await AsyncStorage.setItem(
      'pinpals-onboarding',
      JSON.stringify({ state: { stage: 'done', attributionCompleted: true }, version: 0 }),
    );

    await useOnboardingStore.persist.rehydrate();

    expect(useOnboardingStore.getState().attributionCompleted).toBe(true);
  });

  it('defaults attribution to not-yet-answered for storage written before this existed', async () => {
    // A real case, not a hypothetical: anyone who finished onboarding before this field was
    // added has `{ stage: 'done' }` on disk with no `attributionCompleted` key at all. Dirtied
    // to true first — zustand's default merge otherwise falls back to whatever's already in
    // memory for a key missing from the persisted payload, which would make this pass whether
    // or not the fallback below actually ran (see the 'welcome'/hydrated test's own note).
    useOnboardingStore.setState({ attributionCompleted: true });
    await AsyncStorage.setItem(
      'pinpals-onboarding',
      JSON.stringify({ state: { stage: 'done' }, version: 0 }),
    );

    await useOnboardingStore.persist.rehydrate();

    expect(useOnboardingStore.getState().attributionCompleted).toBe(false);
  });

  it('starts unhydrated so the tour cannot run against the default stage', () => {
    // The persisted value arrives asynchronously; until it does, `stage` is only a default
    // and must not be acted on.
    expect(useOnboardingStore.getInitialState().hydrated).toBe(false);
    expect(useOnboardingStore.getInitialState().stage).toBe('welcome');
    expect(useOnboardingStore.getInitialState().attributionCompleted).toBe(false);
  });
});
