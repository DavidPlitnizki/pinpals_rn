import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '../../../contexts/AuthContext';
import { useMeetingsStore } from '../../../store/useMeetingsStore';
import { usePlacesStore } from '../../../store/usePlacesStore';
import { useProfileStore } from '../../../store/useProfileStore';

export function useProfileScreen() {
  const { profile, updateProfile } = useProfileStore();
  const { places } = usePlacesStore();
  const { meetings } = useMeetingsStore();
  const { logout, isGuest } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio ?? '');

  async function handlePickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      updateProfile({ avatarUri: result.assets[0].uri });
    }
  }

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    updateProfile({ name: name.trim(), bio: bio.trim() || undefined });
    setIsEditing(false);
  }

  function handleCancelEdit() {
    setName(profile.name);
    setBio(profile.bio ?? '');
    setIsEditing(false);
  }

  async function handleLogout() {
    await logout();
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
      { cancelable: true },
    );
  }

  return {
    profile,
    isGuest,
    places,
    meetings,
    isEditing,
    setIsEditing,
    name,
    setName,
    bio,
    setBio,
    handlePickAvatar,
    handleSave,
    handleCancelEdit,
    handleLogout,
    handleDeleteAccount,
  };
}
