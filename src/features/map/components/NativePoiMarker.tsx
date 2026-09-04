import { Ionicons } from '@expo/vector-icons';
import { PointAnnotation } from '@rnmapbox/maps';
import { CopilotStep, walkthroughable } from 'react-native-copilot';
import React, { useCallback, useMemo } from 'react';
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
import { OnboardingArrow } from '../../onboarding/components/OnboardingArrow';
import { SAVE_TIP_STEP, SAVE_TIP_TEXT } from '../../onboarding/constants';
import { CalloutActionButton } from './CalloutActionButton';

// copilot measures its target through a ref, which CalloutActionButton does not forward.
const WalkthroughView = walkthroughable(View);

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
    // No negative margin here. It used to pull the share and close buttons out past the
    // card's own padding, which the card then clipped (overflow: 'hidden') — and once the
    // header moved inside the scroll area, that clipped them a second time.
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
  infoBlock: { width: '100%', alignItems: 'center' },
  infoBlockDimmed: { width: '100%', alignItems: 'center', opacity: 0.3 },
  pointerRow: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.s8,
    marginTop: Spacing.s8,
  },
  pointerCell: { flex: 1, alignItems: 'center' },
  calloutActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.s8,
    marginTop: Spacing.s12,
  },
});

// The tour's arrow, parked over the third action. Laid out as three flex cells matching the
// action row below, so it stays over Save however that row is sized.
function AddPlacePointer() {
  return (
    <View style={styles.pointerRow} pointerEvents="none">
      <View style={styles.pointerCell} />
      <View style={styles.pointerCell} />
      <View style={styles.pointerCell}>
        <OnboardingArrow />
      </View>
    </View>
  );
}

interface NativePoiCalloutProps {
  marker: NativePoiMarkerData;
  onClose: () => void;
  onDirections: (marker: NativePoiMarkerData) => void;
  // Onboarding, second half: ring the action that saves this spot. Decided by the map screen,
  // which owns the persisted stage — this component only knows where the button is.
  highlightAdd?: boolean;
  onAddPlace: (marker: NativePoiMarkerData, details?: NativePoiDetails) => void;
}

// Rendered by MapScreen inside MapCardSheet, not anchored to the pin — see MapCardSheet for
// why. It owns the two lookups the card needs, so they only run while the card is on screen.
// Memoised: the map screen re-renders on plenty that has nothing to do with this card — the
// route picker, the search sheet, a selection elsewhere — and every one of those re-ran the
// card's photo and details lookups' render path for nothing. All four props are stable
// (the marker is a state object, the handlers are useCallback'd on the screen).
export const NativePoiCallout = React.memo(function NativePoiCallout({
  marker,
  onClose,
  onDirections,
  highlightAdd = false,
  onAddPlace,
}: NativePoiCalloutProps) {
  // A tapped basemap POI gets the same cover art a saved place would — no need to save it
  // first just to see what it looks like.
  const cover = useCoverImage(marker.coordinates, { wikipedia: true });
  // The basemap gives us only a name + category; this fills in address/phone/website. A
  // long-pressed point arrives with everything its reverse lookup could find already
  // attached, so it skips both lookups.
  const details = useNativePoiDetails(
    marker.id,
    marker.name,
    marker.coordinates,
    marker.resolvedDetails,
  );

  const handleDirectionsPress = useCallback(() => onDirections(marker), [onDirections, marker]);
  const handleAddPlacePress = useCallback(
    () => onAddPlace(marker, details),
    [onAddPlace, marker, details],
  );
  const handleSearchPress = useCallback(
    () => void openPlaceSearch(marker.name, marker.coordinates, 'native_poi'),
    [marker.name, marker.coordinates],
  );
  // A long-pressed point is on screen before its reverse lookup has answered. Its name is a
  // placeholder until then, so the two actions that would carry that name somewhere — a web
  // search for it, and the save form it seeds — stay shut. Directions only needs the
  // coordinates, which are final from the moment of the press.
  const pending = marker.pending === true;
  const muted = highlightAdd || pending;

  const infoBlockStyle = useMemo(
    () => (highlightAdd ? styles.infoBlockDimmed : styles.infoBlock),
    [highlightAdd],
  );

  const handleSharePress = useCallback(
    () => shareSpot({ name: marker.name, coordinates: marker.coordinates }),
    [marker.name, marker.coordinates],
  );

  const content = (
    <View style={styles.callout}>
      {/* Deliberately not a ScrollView. A ScrollView has no intrinsic height: as soon as an
          ancestor has a definite one — which centring the card gave it — it claims the lot and
          pushes the action row past the card's edge, where overflow:'hidden' eats it. That is
          what was cutting the coordinates row and losing the buttons entirely. The card sizes
          to its content instead, capped by MapCardSheet. */}
      {/* Everything above the actions dims together while the tour is pointing at Save, so the
          one button being asked for is the only lit thing left on the card. */}
      <View style={infoBlockStyle}>
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
          {/* No cover art while the point is still being identified: its coordinates may yet
              snap to the POI under the finger, and rendering the map crop for the press point
              first would buy a static image that is about to be thrown away. */}
          {pending || cover.loading ? (
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
      </View>

      {highlightAdd && <AddPlacePointer />}

      <View style={styles.calloutActionsRow}>
        <CalloutActionButton
          icon="globe-outline"
          iconSize={24}
          iconColor={muted ? Colors.neutral[300] : Colors.neutral[600]}
          backgroundColor={Colors.neutral[100]}
          borderColor={muted ? Colors.neutral[200] : Colors.neutral[400]}
          disabled={pending}
          accessibilityLabel="Search the web for this place"
          onPress={handleSearchPress}
        />
        <CalloutActionButton
          icon="navigate-outline"
          iconSize={24}
          iconColor={highlightAdd ? Colors.neutral[300] : Colors.brand.primary}
          backgroundColor={highlightAdd ? Colors.neutral[100] : Colors.brand.light}
          borderColor={highlightAdd ? Colors.neutral[200] : Colors.brand.primary}
          accessibilityLabel="Directions to this place"
          onPress={handleDirectionsPress}
        />
        <CalloutActionButton
          icon="add-circle-outline"
          iconSize={24}
          // Filled rather than outlined while the tour points at it: the cut-out rings the
          // whole card, so this has to read as the one button being asked for.
          iconColor={
            highlightAdd ? Colors.white : pending ? Colors.neutral[300] : Colors.accent.primary
          }
          backgroundColor={
            highlightAdd
              ? Colors.accent.primary
              : pending
                ? Colors.neutral[100]
                : Colors.accent.light
          }
          borderColor={pending && !highlightAdd ? Colors.neutral[200] : Colors.accent.primary}
          disabled={pending}
          accessibilityLabel="Save this place"
          onPress={handleAddPlacePress}
        />
      </View>
    </View>
  );

  if (!highlightAdd) return content;

  // The step measures the whole card, not the button inside it. copilot places its tooltip
  // immediately above whatever it measured, and the button sits at the card's bottom edge —
  // targeting the button put the tooltip on top of the card's own name and address, and left
  // it grazing the action row. Measuring the card lifts the tooltip clear and keeps the card
  // readable inside the cut-out; the arrow above the row is what actually points at Save.
  return (
    <CopilotStep name={SAVE_TIP_STEP} order={2} text={SAVE_TIP_TEXT}>
      <WalkthroughView collapsable={false}>{content}</WalkthroughView>
    </CopilotStep>
  );
});
