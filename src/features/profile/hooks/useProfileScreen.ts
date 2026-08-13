import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '../../../contexts/AuthContext';
import { promptPhotoSource } from '../../../shared/photoSourcePrompt';
import { useMeetingsStore } from '../../../store/useMeetingsStore';
import { usePlacesStore } from '../../../store/usePlacesStore';
import { useProfileStore } from '../../../store/useProfileStore';
import { useSavedRoutesStore } from '../../../store/useSavedRoutesStore';
import { useSettingsStore } from '../../../store/useSettingsStore';

export function useProfileScreen() {
  const { profile, updateProfile } = useProfileStore();
  const { places } = usePlacesStore();
  const { meetings } = useMeetingsStore();
  const { savedRoutes } = useSavedRoutesStore();
  const { logout, deleteAccount, isGuest, authData } = useAuth();
  const { fontScale, setFontScale, theme, setTheme } = useSettingsStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [avatarSheetVisible, setAvatarSheetVisible] = useState(false);

  const openAvatarSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAvatarSheetVisible(true);
  }, []);

  const closeAvatarSheet = useCallback(() => setAvatarSheetVisible(false), []);

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
        updateProfile({ avatarUri: result.assets[0].uri, avatarPreset: undefined });
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
      updateProfile({ avatarUri: result.assets[0].uri, avatarPreset: undefined });
      setAvatarSheetVisible(false);
    }
  }

  function handleSelectAvatarPreset(id: string) {
    updateProfile({ avatarPreset: id, avatarUri: undefined });
    setAvatarSheetVisible(false);
  }

  function handleClearAvatarPreset() {
    updateProfile({ avatarPreset: undefined, avatarUri: undefined });
    setAvatarSheetVisible(false);
  }

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    updateProfile({ name: name.trim() });
    setIsEditing(false);
  }

  function handleCancelEdit() {
    setName(profile.name);
    setIsEditing(false);
  }

  async function handleLogout() {
    await logout();
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This permanently deletes your account and all your places, memories, meetings, and saved routes. This action cannot be undone.',
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
              useMeetingsStore.setState({ meetings: [] });
              useSavedRoutesStore.setState({ savedRoutes: [] });
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
    profile,
    isGuest,
    authData,
    fontScale,
    setFontScale,
    theme,
    setTheme,
    places,
    meetings,
    savedRoutes,
    isEditing,
    setIsEditing,
    name,
    setName,
    avatarSheetVisible,
    openAvatarSheet,
    closeAvatarSheet,
    handlePickPhoto,
    handleSelectAvatarPreset,
    handleClearAvatarPreset,
    handleSave,
    handleCancelEdit,
    handleLogout,
    handleDeleteAccount,
  };
}
