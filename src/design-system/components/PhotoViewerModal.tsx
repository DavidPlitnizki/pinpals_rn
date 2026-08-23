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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  // react-native-safe-area-context's SafeAreaView reports zero insets inside a transparent
  // Modal on iOS, which pushed the close button up under the notch. Reading the insets from
  // the screen's provider (this component renders outside the Modal tree) and padding
  // manually keeps the button reachable.
  const insets = useSafeAreaInsets();

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

  // Index-based, not the URI: the same photo can legitimately appear twice in one memory,
  // and duplicate keys make FlatList drop pages.
  const keyExtractor = useCallback((uri: string, index: number) => `${index}-${uri}`, []);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      onShow={handleShow}
    >
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.s16) }]}>
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
          style={styles.pager}
          data={photoUris}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialScrollIndex}
          getItemLayout={getItemLayout}
          onMomentumScrollEnd={handleMomentumScrollEnd}
        />
      </View>
    </Modal>
  );
}

const hitSlop = { top: Spacing.s12, bottom: Spacing.s12, left: Spacing.s12, right: Spacing.s12 };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  // Without flex the horizontal list sizes to its content, and since each page had no
  // height of its own that collapsed the swipe area to a sliver — the photo still filled
  // the screen, but there was nothing left to drag on. Both need explicit height.
  pager: { flex: 1 },
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: Colors.white, fontSize: 20, fontWeight: '700', lineHeight: 22 },
  page: {
    width: screenWidth,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: screenWidth,
    height: '100%',
  },
});
