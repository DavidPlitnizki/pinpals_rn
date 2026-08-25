import { Ionicons } from '@expo/vector-icons';
import { PointAnnotation } from '@rnmapbox/maps';
import React, { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';

import { CircleCloseButton } from '../../../design-system/components/CircleCloseButton';
import { MapDataAttribution } from '../../../design-system/components/MapDataAttribution';
import { useCoverImage } from '../../../hooks/usePlaceCoverImage';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { formatSlugLabel } from '../../../shared/format';
import { openPlaceSearch } from '../../../services/webSearch';
import { shareSpot } from '../../../shared/sharePlace';
import { PlaceInfoRows } from '../../../design-system/components/PlaceInfoRows';
import { HIT_SLOP_8 } from '../constants';
import { NativePoiDetails, useNativePoiDetails } from '../hooks/useNativePoiDetails';
import { usePointAnnotationRefresh } from '../hooks/usePointAnnotationRefresh';
import { NativePoiMarker as NativePoiMarkerData } from '../types';
import { iconForMaki } from '../utils/mapboxIcons';
import { CalloutActionButton } from './CalloutActionButton';

const PIN_SIZE = 40;
// Distinct from CATEGORY_COLORS (food/coffee/nature/art/sports), SearchResultMarker's
// DROP_RED and ROUTE_LINE_COLOR — reads as "basemap data", not user/app data. Reuses the
// `warning` design token rather than a new hardcoded hex.
const POI_COLOR = Colors.warning;

interface Props {
  marker: NativePoiMarkerData;
  // Bump this (e.g. with route.pickerVisible) to force the marker to re-register its
  // native image — see usePointAnnotationRefresh for why this is needed.
  refreshSignal?: unknown;
  // Called when this annotation is selected, so the base MapView's onPress (which also
  // fires on this tap) can skip re-querying for a native basemap POI underneath.
  onAnnotationSelected?: () => void;
}

export function NativePoiMarker({ marker, refreshSignal, onAnnotationSelected }: Props) {
  const { registerRef } = usePointAnnotationRefresh(refreshSignal);
  const handleSelected = useCallback(() => onAnnotationSelected?.(), [onAnnotationSelected]);
  return (
    <PointAnnotation
      key={marker.id}
      ref={registerRef(marker.id)}
      id={marker.id}
      coordinate={[marker.coordinates.longitude, marker.coordinates.latitude]}
      anchor={{ x: 0.5, y: 1 }}
      onSelected={handleSelected}
    >
      <View style={styles.markerColumn}>
        <View style={styles.markerLabel}>
          <Text style={styles.markerLabelText} numberOfLines={1}>
            {marker.name}
          </Text>
        </View>
        <View style={styles.pinWrap}>
          <Ionicons name="location-sharp" size={PIN_SIZE} color={POI_COLOR} />
          <View style={styles.iconBadge}>
            <Ionicons name={iconForMaki(marker.maki)} size={12} color={POI_COLOR} />
          </View>
        </View>
      </View>
    </PointAnnotation>
  );
}

const styles = StyleSheet.create({
  markerColumn: {
    alignItems: 'center',
  },
  markerLabel: {
    maxWidth: 120,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 6,
    paddingHorizontal: Spacing.s8,
    paddingVertical: Spacing.s2,
    marginBottom: Spacing.s4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  markerLabelText: {
    ...Typography.caption,
    color: Colors.neutral[900],
    fontWeight: '600',
  },
  pinWrap: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    position: 'absolute',
    top: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callout: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    width: '100%',
    paddingHorizontal: Spacing.s12,
    paddingBottom: Spacing.s12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // A normal in-flow row, not an absolutely-positioned overlay — MarkerView measures/
  // rasterizes its content to the JS-measured layout box, so anything positioned outside
  // that box (negative offsets) gets cut off rather than floating over the map.
  calloutHeaderRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.s4,
    marginHorizontal: -Spacing.s8,
  },
  calloutShareButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1.5,
    borderColor: Colors.neutral[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  // A dark border keeps the button visible against whatever's under it on the map,
  // instead of blending into busy map tiles.
  calloutCloseButton: {
    borderWidth: 1.5,
    borderColor: Colors.neutral[900],
  },
  calloutPhotoWrap: {
    alignSelf: 'stretch',
    height: 100,
    borderRadius: Radii.sm,
    backgroundColor: Colors.warning + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.s4,
    overflow: 'hidden',
  },
  calloutPhoto: {
    width: '100%',
    height: '100%',
  },
  calloutName: {
    ...Typography.headline,
    color: Colors.neutral[900],
    textAlign: 'center',
    marginTop: Spacing.s8,
  },
  calloutCategory: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginTop: Spacing.s2,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  calloutInfoSection: {
    alignSelf: 'stretch',
    marginTop: Spacing.s8,
  },
  calloutActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.s8,
    marginTop: Spacing.s12,
  },
});

interface NativePoiCalloutProps {
  marker: NativePoiMarkerData;
  onClose: () => void;
  onDirections: (marker: NativePoiMarkerData) => void;
  onAddPlace: (marker: NativePoiMarkerData, details?: NativePoiDetails) => void;
}

// Rendered by MapScreen inside MapCardSheet, not anchored to the pin — see MapCardSheet for
// why. It owns the two lookups the card needs, so they only run while the card is on screen.
export function NativePoiCallout({
  marker,
  onClose,
  onDirections,
  onAddPlace,
}: NativePoiCalloutProps) {
  // A tapped basemap POI gets the same cover art a saved place would — no need to save it
  // first just to see what it looks like.
  const cover = useCoverImage(marker.coordinates, { wikipedia: true });
  // The basemap gives us only a name + category; this fills in address/phone/website.
  const details = useNativePoiDetails(marker.id, marker.name, marker.coordinates);

  const handleDirectionsPress = useCallback(() => onDirections(marker), [onDirections, marker]);
  const handleAddPlacePress = useCallback(
    () => onAddPlace(marker, details),
    [onAddPlace, marker, details],
  );
  const handleSearchPress = useCallback(
    () => void openPlaceSearch(marker.name, marker.coordinates, 'native_poi'),
    [marker.name, marker.coordinates],
  );
  const handleSharePress = useCallback(
    () => shareSpot({ name: marker.name, coordinates: marker.coordinates }),
    [marker.name, marker.coordinates],
  );

  return (
    <View style={styles.callout}>
      <View style={styles.calloutHeaderRow}>
        <TouchableOpacity
          style={styles.calloutShareButton}
          onPress={handleSharePress}
          hitSlop={HIT_SLOP_8}
        >
          <Ionicons name="share-outline" size={16} color={Colors.neutral[600]} />
        </TouchableOpacity>
        <CircleCloseButton onPress={onClose} style={styles.calloutCloseButton} />
      </View>
      <View style={styles.calloutPhotoWrap}>
        {cover.loading ? (
          <ActivityIndicator color={POI_COLOR} />
        ) : cover.uri ? (
          <>
            <Image source={{ uri: cover.uri }} style={styles.calloutPhoto} contentFit="cover" />
            {cover.source === 'mapbox' && <MapDataAttribution />}
          </>
        ) : (
          <Ionicons name={iconForMaki(marker.maki)} size={32} color={POI_COLOR} />
        )}
      </View>
      <Text style={styles.calloutName} numberOfLines={2}>
        {marker.name}
      </Text>
      {marker.category && (
        <Text style={styles.calloutCategory}>{formatSlugLabel(marker.category)}</Text>
      )}

      <View style={styles.calloutInfoSection}>
        <PlaceInfoRows
          info={{
            address: details.address,
            phone: details.phone,
            website: details.website,
            latitude: marker.coordinates.latitude,
            longitude: marker.coordinates.longitude,
          }}
          compact
        />
      </View>

      <View style={styles.calloutActionsRow}>
        <CalloutActionButton
          icon="globe-outline"
          iconSize={24}
          iconColor={Colors.neutral[600]}
          backgroundColor={Colors.neutral[100]}
          borderColor={Colors.neutral[400]}
          onPress={handleSearchPress}
        />
        <CalloutActionButton
          icon="navigate-outline"
          iconSize={24}
          iconColor={Colors.brand.primary}
          backgroundColor={Colors.brand.light}
          borderColor={Colors.brand.primary}
          onPress={handleDirectionsPress}
        />
        <CalloutActionButton
          icon="add-circle-outline"
          iconSize={24}
          iconColor={Colors.accent.primary}
          backgroundColor={Colors.accent.light}
          borderColor={Colors.accent.primary}
          onPress={handleAddPlacePress}
        />
      </View>
    </View>
  );
}
