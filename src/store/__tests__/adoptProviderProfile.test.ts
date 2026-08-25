import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_PROFILE_NAME, adoptProviderProfile, useProfileStore } from '../useProfileStore';

beforeEach(async () => {
  await AsyncStorage.clear();
  useProfileStore.setState({ profile: { id: '1', name: DEFAULT_PROFILE_NAME } });
});

describe('adoptProviderProfile', () => {
  it('fills in the provider name while the profile still has the placeholder', async () => {
    await adoptProviderProfile({ name: 'Ada Lovelace', photoURL: null });
    expect(useProfileStore.getState().profile.name).toBe('Ada Lovelace');
  });

  // Downloaded rather than linked: a provider URL rotates when the person changes their
  // account photo, and needs the network on every render.
  it('stores the provider photo as a local file, not as the remote URL', async () => {
    await adoptProviderProfile({ name: null, photoURL: 'https://example.com/a.jpg' });

    const { avatarUri } = useProfileStore.getState().profile;
    expect(avatarUri).toMatch(/^file:\/\//);
    expect(avatarUri).not.toBe('https://example.com/a.jpg');
  });

  it('never overwrites a name the user typed', async () => {
    useProfileStore.setState({ profile: { id: '1', name: 'Dave' } });
    await adoptProviderProfile({ name: 'Ada Lovelace', photoURL: null });
    expect(useProfileStore.getState().profile.name).toBe('Dave');
  });

  it('never overwrites an avatar the user picked', async () => {
    useProfileStore.setState({
      profile: { id: '1', name: DEFAULT_PROFILE_NAME, avatarUri: 'file:///mine.jpg' },
    });
    await adoptProviderProfile({ name: null, photoURL: 'https://example.com/a.jpg' });
    expect(useProfileStore.getState().profile.avatarUri).toBe('file:///mine.jpg');
  });

  it('never overwrites a chosen avatar preset', async () => {
    useProfileStore.setState({
      profile: { id: '1', name: DEFAULT_PROFILE_NAME, avatarPreset: 'fox' },
    });
    await adoptProviderProfile({ name: null, photoURL: 'https://example.com/a.jpg' });
    expect(useProfileStore.getState().profile.avatarUri).toBeUndefined();
  });

  // Guests (anonymous Firebase users) have neither, and Apple never returns a photo.
  it('does nothing when the provider supplied neither', async () => {
    await adoptProviderProfile({ name: null, photoURL: null });
    const { profile } = useProfileStore.getState();
    expect(profile.name).toBe(DEFAULT_PROFILE_NAME);
    expect(profile.avatarUri).toBeUndefined();
  });
});
