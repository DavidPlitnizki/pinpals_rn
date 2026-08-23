import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '../../../contexts/AuthContext';
import { promptPhotoSource } from '../../../shared/photoSourcePrompt';
import { setCrashReportingUserContext } from '../../../services/crashReporting';
import { usePlacesStore } from '../../../store/usePlacesStore';
import { useProfileStore } from '../../../store/useProfileStore';
import { useSettingsStore } from '../../../store/useSettingsStore';

interface AvatarDraft {
  avatarUri?: string;
  avatarPreset?: string;
}

export function useProfileScreen() {
  const { profile, updateProfile } = useProfileStore();
  const { places } = usePlacesStore();
  const { logout, deleteAccount, isGuest, authData } = useAuth();
  const { fontScale, setFontScale, theme, setTheme } = useSettingsStore();
  const [isEditing, setIsEditing] = useState(false);
  const [whatsNewVisible, setWhatsNewVisible] = useState(false);
  const [name, setName] = useState(profile.name);
  const [avatarSheetVisible, setAvatarSheetVisible] = useState(false);
  // Avatar edits are staged here instead of being written straight to the store, so Cancel
  // really does undo everything the edit session changed — not just the name.
  const [draftAvatar, setDraftAvatar] = useState<AvatarDraft | null>(null);

  // What the screen should render while editing: the staged avatar if one was picked in this
  // session, otherwise the saved profile.
  const displayProfile = draftAvatar ? { ...profile, ...draftAvatar } : profile;

  // `isFavorite` is the "want to visit" flag; `favorite` is the separate heart. Two distinct
  // fields with confusingly similar names — see the v3→v4 store migration.
  const savedCounts = useMemo(
    () => ({
      places: places.length,
      wantToVisit: places.filter((p) => p.isFavorite).length,
      favorites: places.filter((p) => p.favorite).length,
    }),
    [places],
  );

  const handleStartEdit = useCallback(() => {
    setName(profile.name);
    setDraftAvatar(null);
    setIsEditing(true);
  }, [profile.name]);

  const openAvatarSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAvatarSheetVisible(true);
  }, []);

  const closeAvatarSheet = useCallback(() => setAvatarSheetVisible(false), []);

  const openWhatsNew = useCallback(() => setWhatsNewVisible(true), []);
  const closeWhatsNew = useCallback(() => setWhatsNewVisible(false), []);

  async function handlePickPhoto() {
    const source = await promptPhotoSource();
    if (!source) return;

    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to the camera.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setDraftAvatar({ avatarUri: result.assets[0].uri, avatarPreset: undefined });
        setAvatarSheetVisible(false);
      }
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setDraftAvatar({ avatarUri: result.assets[0].uri, avatarPreset: undefined });
      setAvatarSheetVisible(false);
    }
  }

  function handleSelectAvatarPreset(id: string) {
    setDraftAvatar({ avatarPreset: id, avatarUri: undefined });
    setAvatarSheetVisible(false);
  }

  function handleClearAvatarPreset() {
    setDraftAvatar({ avatarPreset: undefined, avatarUri: undefined });
    setAvatarSheetVisible(false);
  }

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    const trimmedName = name.trim();
    updateProfile({ name: trimmedName, ...(draftAvatar ?? {}) });
    // The app's own editable name, not Firebase's displayName (guests have none) — this is
    // the one a support conversation about a crash report would actually recognize.
    setCrashReportingUserContext({ profile_name: trimmedName });
    setDraftAvatar(null);
    setIsEditing(false);
  }

  // Discards the whole edit session — name and avatar alike.
  function handleCancelEdit() {
    setName(profile.name);
    setDraftAvatar(null);
    setIsEditing(false);
  }

  async function handleLogout() {
    await logout();
  }

  // Kept as "Delete Account" even in guest mode: a guest is an anonymous Firebase account,
  // and App Review looks for this exact wording (guideline 5.1.1(v)) — often while testing
  // through "Skip for now". A more literal label for guests isn't worth that risk. The guest
  // copy still spells out what actually goes, since they have no account to picture.
  function handleDeleteAccount() {
    const message = isGuest
      ? 'This permanently deletes your guest account and all your places and memories on this device, and returns you to the sign-in screen. This action cannot be undone.'
      : 'Are you sure you want to delete your account? This permanently deletes your account and all your places and memories. This action cannot be undone.';

    Alert.alert(
      'Delete Account',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              // Firebase signs the user out as part of deleting the account — clear local
              // content too, so nothing from the deleted account lingers on the device.
              usePlacesStore.setState({ places: [], notes: [] });
              useProfileStore.setState({ profile: { id: '1', name: 'User' } });
            } catch (e: any) {
              Alert.alert('Couldn’t delete account', e?.message ?? 'Please try again.');
            }
          },
        },
      ],
      { cancelable: true },
    );
  }

  return {
    profile: displayProfile,
    isGuest,
    authData,
    fontScale,
    setFontScale,
    theme,
    setTheme,
    places,
    savedCounts,
    isEditing,
    handleStartEdit,
    name,
    setName,
    avatarSheetVisible,
    openAvatarSheet,
    closeAvatarSheet,
    whatsNewVisible,
    openWhatsNew,
    closeWhatsNew,
    handlePickPhoto,
    handleSelectAvatarPreset,
    handleClearAvatarPreset,
    handleSave,
    handleCancelEdit,
    handleLogout,
    handleDeleteAccount,
  };
}
