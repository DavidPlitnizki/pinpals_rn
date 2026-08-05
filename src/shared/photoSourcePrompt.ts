import { Alert } from 'react-native';

export type PhotoSource = 'camera' | 'library';

// A plain Alert (not a platform-specific action sheet library) so this works identically on
// iOS and Android without adding a dependency — 3 buttons is well within Alert's supported range.
export function promptPhotoSource(): Promise<PhotoSource | null> {
  return new Promise((resolve) => {
    Alert.alert('Add Photo', undefined, [
      { text: 'Take Photo', onPress: () => resolve('camera') },
      { text: 'Choose from Library', onPress: () => resolve('library') },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}
