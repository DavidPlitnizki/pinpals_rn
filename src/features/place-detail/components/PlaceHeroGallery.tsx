import React, { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors, Spacing, Typography } from '../../../design-system/tokens';
import { PlaceMapSnapshot } from './PlaceMapSnapshot';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HERO_HEIGHT = 220;

interface Props {
  placeId: string;
  latitude: number;
  longitude: number;
  pinColor: string;
  photoUris: string[];
  name: string;
  moodLabel?: string;
  onPhotoPress: (photoUris: string[], index: number) => void;
  onMapPress: () => void;
}

const PhotoPage = React.memo(function PhotoPage({
  uri,
  index,
  onPress,
}: {
  uri: string;
  index: number;
  onPress: (index: number) => void;
}) {
  const handlePress = useCallback(() => onPress(index), [onPress, index]);
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={styles.page}>
      <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
    </TouchableOpacity>
  );
});

// Horizontal pager across every photo of the place, with a crop of the map as the final
// page — so a place with no photos still opens on something meaningful rather than an empty
// header. Any page opens full screen on tap.
export function PlaceHeroGallery({
  placeId,
  latitude,
  longitude,
  pinColor,
  photoUris,
  name,
  moodLabel,
  onPhotoPress,
  onMapPress,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const pageCount = photoUris.length + 1; // photos + the map page

  const handleScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  }, []);

  const handlePhotoPress = useCallback(
    (index: number) => onPhotoPress(photoUris, index),
    [onPhotoPress, photoUris],
  );

  const dots = useMemo(() => Array.from({ length: pageCount }, (_, i) => i), [pageCount]);
  const onMapPage = activeIndex === photoUris.length;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {photoUris.map((uri, index) => (
          <PhotoPage key={uri} uri={uri} index={index} onPress={handlePhotoPress} />
        ))}

        <TouchableOpacity activeOpacity={0.9} onPress={onMapPress} style={styles.page}>
          <PlaceMapSnapshot
            id={placeId}
            latitude={latitude}
            longitude={longitude}
            color={pinColor}
            height={HERO_HEIGHT}
          />
          {/* The snapshot has its own gestures disabled, so this transparent layer is what
              actually receives the tap that opens the full-screen map. */}
          <View style={styles.mapTapCatcher} pointerEvents="none" />
        </TouchableOpacity>
      </ScrollView>

      {/* The name/mood caption belongs to photo pages only — over the map it would cover the
          very streets the page exists to show. */}
      {!onMapPage && photoUris.length > 0 && (
        <View style={styles.caption} pointerEvents="none">
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {moodLabel ? <Text style={styles.mood}>{moodLabel}</Text> : null}
        </View>
      )}

      {pageCount > 1 && (
        <View style={styles.dots} pointerEvents="none">
          {dots.map((i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: HERO_HEIGHT,
    backgroundColor: Colors.neutral[100],
  },
  page: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  photo: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  mapTapCatcher: {
    ...StyleSheet.absoluteFill,
  },
  caption: {
    position: 'absolute',
    left: Spacing.s20,
    right: Spacing.s20,
    bottom: Spacing.s24,
  },
  name: {
    ...Typography.title2,
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  mood: {
    ...Typography.subheadline,
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  dots: {
    position: 'absolute',
    bottom: Spacing.s8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.s4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 18,
  },
});
