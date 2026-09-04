import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

import { promptPhotoSource } from './photoSourcePrompt';

// Camera-or-library photo picking, in one place. Both the quick-add sheet and its memory
// panel need the identical flow — prompt for a source, ask for the matching permission,
// launch the picker — and they were drifting apart as copies.
//
// Returns the picked URIs (temp picker paths; copy them into app storage before persisting),
// or an empty array when the user backed out or refused permission. Never throws.
export async function pickPhotos(remaining: number): Promise<string[]> {
  if (remaining <= 0) return [];

  const source = await promptPhotoSource();
  if (!source) return [];

  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to the camera.');
      return [];
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    return result.canceled ? [] : result.assets.map((asset) => asset.uri).slice(0, remaining);
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Please allow access to the photo library.');
    return [];
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: remaining,
    quality: 0.8,
  });
  return result.canceled ? [] : result.assets.map((asset) => asset.uri).slice(0, remaining);
}
