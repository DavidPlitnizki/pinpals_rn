import React, { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../tokens';

interface PhotoViewerModalProps {
  visible: boolean;
  photoUris: string[];
  initialIndex: number;
  onClose: () => void;
}

const screenWidth = Dimensions.get('window').width;

export function PhotoViewerModal({
  visible,
  photoUris,
  initialIndex,
  onClose,
}: PhotoViewerModalProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const initialScrollIndex = useMemo(
    () => Math.min(Math.max(initialIndex, 0), Math.max(photoUris.length - 1, 0)),
    [initialIndex, photoUris.length],
  );

  const handleMomentumScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    setActiveIndex(index);
  }, []);

  const handleShow = useCallback(() => {
    setActiveIndex(initialScrollIndex);
  }, [initialScrollIndex]);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: screenWidth,
      offset: screenWidth * index,
      index,
    }),
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <View style={styles.page}>
        <Image source={{ uri: item }} style={styles.photo} resizeMode="contain" />
      </View>
    ),
    [],
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      onShow={handleShow}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          {photoUris.length > 1 && (
            <Text style={styles.counter}>
              {activeIndex + 1} / {photoUris.length}
            </Text>
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={hitSlop}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={photoUris}
          keyExtractor={(uri) => uri}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialScrollIndex}
          getItemLayout={getItemLayout}
          onMomentumScrollEnd={handleMomentumScrollEnd}
        />
      </SafeAreaView>
    </Modal>
  );
}

const hitSlop = { top: Spacing.s12, bottom: Spacing.s12, left: Spacing.s12, right: Spacing.s12 };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s8,
  },
  counter: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: Colors.white,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  page: {
    width: screenWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: screenWidth,
    height: '100%',
  },
});
