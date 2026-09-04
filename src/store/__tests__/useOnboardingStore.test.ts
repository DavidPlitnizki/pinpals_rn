import AsyncStorage from '@react-native-async-storage/async-storage';

import { useOnboardingStore } from '../useOnboardingStore';

describe('useOnboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.setState({ stage: 'map-tip', hydrated: true });
  });

  it('advances from the map hint to the save hint', () => {
    useOnboardingStore.getState().completeMapTip();

    expect(useOnboardingStore.getState().stage).toBe('save-tip');
  });

  it('does not rewind a finished tour when the map hint reports again', () => {
    useOnboardingStore.setState({ stage: 'done' });

    useOnboardingStore.getState().completeMapTip();

    expect(useOnboardingStore.getState().stage).toBe('done');
  });

  it('walks the whole tour from the map hint to the end', () => {
    const store = useOnboardingStore.getState;

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

  it('reports hydrated even when nothing was ever stored', async () => {
    // The gate the map screen waits on. If this never flipped on a fresh install, the tour
    // would simply never start — no error, nothing on screen.
    await AsyncStorage.clear();
    useOnboardingStore.setState({ hydrated: false });

    await useOnboardingStore.persist.rehydrate();

    expect(useOnboardingStore.getState().hydrated).toBe(true);
    expect(useOnboardingStore.getState().stage).toBe('map-tip');
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

  it('starts unhydrated so the tour cannot run against the default stage', () => {
    // The persisted value arrives asynchronously; until it does, `stage` is only a default
    // and must not be acted on.
    expect(useOnboardingStore.getInitialState().hydrated).toBe(false);
    expect(useOnboardingStore.getInitialState().stage).toBe('map-tip');
  });
});
