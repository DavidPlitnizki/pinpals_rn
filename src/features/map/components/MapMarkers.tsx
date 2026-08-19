import { Ionicons } from '@expo/vector-icons';
import { MapView, MarkerView, PointAnnotation } from '@rnmapbox/maps';
import { Image } from 'expo-image';
import React, { RefObject, useCallback, useMemo, useRef, useState } from 'react';
import { Linking, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CircleCloseButton } from '../../../design-system/components/CircleCloseButton';
import { Colors, Radii, Spacing, Typography } from '../../../design-system/tokens';
import { usePlaceCoverImage } from '../../../hooks/usePlaceCoverImage';
import { MemoryMood, Place, MOOD_CONFIG } from '../../../models/types';
import { buildGoogleMapsSearchUrl } from '../../../shared/mapLinks';
import { categoryColor, categoryIcon } from '../../../shared/constants';
import { logPlaceShared } from '../../../services/analytics';
import { openPlaceSearch } from '../../../services/webSearch';
import { usePlacesStore } from '../../../store/usePlacesStore';
import { HIT_SLOP_8 } from '../constants';
import { useCalloutAnchor } from '../hooks/useCalloutAnchor';
import { usePointAnnotationRefresh } from '../hooks/usePointAnnotationRefresh';
import { getPlacePhotoPreview, PlacePhotoPreview } from '../utils/placePhoto';
import { CalloutActionButton } from './CalloutActionButton';
import { CalloutContainer } from './CalloutContainer';

const PIN_SIZE = 46;
const CALLOUT_DESCRIPTION_MAX_CHARS = 24;

function truncate(text: string, maxChars: number): string {
  return text.length > maxChars ? `${text.slice(0, maxChars)}...` : text;
}

interface Props {
  places: Place[];
  onMarkerPress: (placeId: string) => void;
  onDeleteMarker: (placeId: string, placeName: string) => void;
  onDirections: (place: Place) => void;
  // Bump this (e.g. with route.pickerVisible) to force markers to re-register their
  // native image — see usePointAnnotationRefresh for why this is needed.
  refreshSignal?: unknown;
  // Called when one of these annotations is selected, so the base MapView's onPress
  // (which also fires on this tap) can skip querying for a native basemap POI underneath.
  onAnnotationSelected?: () => void;
  // Bumped whenever the user taps empty map space (or a different POI) — closes this
  // marker's open callout the same way tapping a different annotation would.
  dismissSignal?: unknown;
  // Used to work out where the selected pin currently sits on screen, so the callout can
  // flip below / slide sideways instead of being clipped at an edge.
  mapViewRef?: RefObject<MapView | null>;
}

interface MarkerPinProps {
  place: Place;
  color: string;
  preview: PlacePhotoPreview | null;
  registerRef: (id: string) => (ref: PointAnnotation | null) => void;
  onSelect: (id: string) => void;
  onDeselect: (id: string) => void;
  onPhotoLoad: (id: string) => void;
}

// Isolated from MapMarkers' own re-renders (e.g. selecting/deselecting a different pin) so
// that toggling one callout doesn't force every other marker in the list to re-evaluate its
// JSX — only a marker whose own place/color/preview actually changed re-renders.
const MarkerPin = React.memo(function MarkerPin({
  place,
  color,
  preview,
  registerRef,
  onSelect,
  onDeselect,
  onPhotoLoad,
}: MarkerPinProps) {
  const handleSelected = useCallback(() => onSelect(place.id), [onSelect, place.id]);
  const handleDeselected = useCallback(() => onDeselect(place.id), [onDeselect, place.id]);
  const handlePhotoLoad = useCallback(() => onPhotoLoad(place.id), [onPhotoLoad, place.id]);

  return (
    <PointAnnotation
      ref={registerRef(place.id)}
      id={place.id}
      coordinate={[place.coordinates.longitude, place.coordinates.latitude]}
      anchor={{ x: 0.5, y: 1 }}
      onSelected={handleSelected}
      onDeselected={handleDeselected}
    >
      <View style={styles.markerColumn}>
        <View style={styles.markerLabel}>
          <Text style={styles.markerLabelText} numberOfLines={1}>
            {place.name}
          </Text>
        </View>
        <View style={styles.pinWrap}>
          <Ionicons name="location-sharp" size={PIN_SIZE} color={color} />
          {preview ? (
            <View style={styles.photoBadge}>
              <Image
                source={{ uri: preview.photoUri }}
                style={styles.photoBadgeImage}
                onLoad={handlePhotoLoad}
              />
            </View>
          ) : (
            <View style={styles.pinBadge}>
              <Ionicons
                name={categoryIcon(place.category)}
                size={14}
                color={categoryColor(place.category)}
              />
            </View>
          )}
        </View>
      </View>
    </PointAnnotation>
  );
});

interface MarkerCalloutProps {
  place: Place;
  preview: PlacePhotoPreview | null;
  mood: MemoryMood | undefined;
  onClose: () => void;
  onSharePress: () => void;
  onCalloutPress: () => void;
  onDirectionsPress: () => void;
  onDeletePress: () => void;
}

function MarkerCallout({
  place,
  preview,
  mood,
  onClose,
  onSharePress,
  onCalloutPress,
  onDirectionsPress,
  onDeletePress,
}: MarkerCalloutProps) {
  const coverUri = usePlaceCoverImage(place, preview?.photoUri);
  const accentColor = categoryColor(place.category);

  const handleCallPhone = useCallback(() => {
    if (place.phone) void Linking.openURL(`tel:${place.phone}`);
  }, [place.phone]);

  const handleOpenWebsite = useCallback(() => {
    if (place.website) void Linking.openURL(place.website);
  }, [place.website]);

  const handleSearchPress = useCallback(
    () => void openPlaceSearch(place.name, place.coordinates, 'map_pin'),
    [place.name, place.coordinates],
  );

  return (
    <View style={styles.callout}>
      <View style={styles.calloutHeaderRow}>
        <TouchableOpacity
          style={styles.calloutShareButton}
          onPress={onSharePress}
          hitSlop={HIT_SLOP_8}
        >
          <Ionicons name="share-outline" size={16} color={Colors.neutral[600]} />
        </TouchableOpacity>
        <CircleCloseButton onPress={onClose} style={styles.calloutCloseButton} size={32} />
      </View>
      <TouchableOpacity onPress={onCalloutPress}>
        <View style={styles.calloutPhotoWrap}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.calloutPhoto} contentFit="cover" />
          ) : (
            <View
              style={[
                styles.calloutPhoto,
                styles.calloutPhotoMock,
                { backgroundColor: accentColor + '22' },
              ]}
            >
              <Ionicons name={categoryIcon(place.category)} size={28} color={accentColor} />
            </View>
          )}
          {mood && (
            <View style={styles.calloutPhotoMoodBadge}>
              <Text style={styles.calloutPhotoMoodEmoji}>{MOOD_CONFIG[mood].emoji}</Text>
            </View>
          )}
        </View>
        <View style={styles.calloutNameRow}>
          <Text style={styles.calloutName}>{place.name}</Text>
          {place.favorite && <Text style={styles.calloutBadgeIcon}>❤️</Text>}
          {place.isFavorite && <Text style={styles.calloutBadgeIcon}>⭐</Text>}
        </View>
        {!!place.description && (
          <Text style={styles.calloutDescription} numberOfLines={1}>
            {truncate(place.description, CALLOUT_DESCRIPTION_MAX_CHARS)}
          </Text>
        )}
        {/* Tags, not `place.category` — every map-saved place gets the same hardcoded
            category, so printing it just showed a meaningless "Nature" on every callout. */}
        {place.tags && place.tags.length > 0 && (
          <Text style={styles.calloutTags} numberOfLines={1}>
            {place.tags.map((tag) => `#${tag}`).join(' ')}
          </Text>
        )}
        {mood && (
          <Text style={styles.calloutMood}>
            {MOOD_CONFIG[mood].emoji} {MOOD_CONFIG[mood].label}
          </Text>
        )}
        <Text style={styles.calloutTap}>Details →</Text>
      </TouchableOpacity>

      {(place.address || place.phone || place.website) && (
        <View style={styles.calloutInfoSection}>
          {place.address && (
            <View style={styles.calloutInfoRow}>
              <Ionicons name="location-outline" size={14} color={Colors.neutral[500]} />
              <Text style={styles.calloutInfoText} numberOfLines={2}>
                {place.address}
              </Text>
            </View>
          )}
          {place.phone && (
            <TouchableOpacity style={styles.calloutInfoRow} onPress={handleCallPhone}>
              <Ionicons name="call-outline" size={14} color={Colors.neutral[500]} />
              <Text style={[styles.calloutInfoText, styles.calloutInfoLink]} numberOfLines={1}>
                {place.phone}
              </Text>
            </TouchableOpacity>
          )}
          {place.website && (
            <TouchableOpacity style={styles.calloutInfoRow} onPress={handleOpenWebsite}>
              <Ionicons name="globe-outline" size={14} color={Colors.neutral[500]} />
              <Text style={[styles.calloutInfoText, styles.calloutInfoLink]} numberOfLines={1}>
                {place.website}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.calloutDivider} />
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
          onPress={onDirectionsPress}
        />
        <CalloutActionButton
          icon="trash-outline"
          iconSize={24}
          iconColor={Colors.error}
          backgroundColor="#FBE9E7"
          borderColor={Colors.error}
          onPress={onDeletePress}
        />
      </View>
    </View>
  );
}

export function MapMarkers({
  places,
  onMarkerPress,
  onDeleteMarker,
  onDirections,
  refreshSignal,
  onAnnotationSelected,
  dismissSignal,
  mapViewRef,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedPlace = places.find((p) => p.id === selectedId);
  const getLatestMoodForPlace = usePlacesStore((s) => s.getLatestMoodForPlace);
  const notes = usePlacesStore((s) => s.notes);
  const { registerRef, refreshOne } = usePointAnnotationRefresh(refreshSignal);

  // Adjust state during render (React's documented pattern for "reset on prop change")
  // rather than in a useEffect — an effect-based reset costs an extra render pass, and
  // the value of `dismissSignal` itself has no meaning, only its transitions matter.
  const prevDismissSignalRef = useRef(dismissSignal);
  if (dismissSignal !== prevDismissSignalRef.current) {
    prevDismissSignalRef.current = dismissSignal;
    if (selectedId !== null) setSelectedId(null);
  }

  const selectedMood = selectedPlace ? getLatestMoodForPlace(selectedPlace.id) : undefined;
  const { anchor: calloutAnchor, placement: calloutPlacement } = useCalloutAnchor(
    mapViewRef,
    selectedPlace?.coordinates,
  );

  // Per-place preview + pin color, computed once per places/notes change instead of on every
  // MapMarkers render (e.g. selecting a different pin no longer re-scans every place's notes).
  // Color priority: a logged mood is the strongest, most specific signal and always wins;
  // otherwise the user's own chosen pinColor (set at save time or edited later) applies;
  // falling back to the default "My Places" turquoise when neither is set.
  const markerData = useMemo(() => {
    const map = new Map<string, { preview: PlacePhotoPreview | null; color: string }>();
    for (const place of places) {
      const mood = getLatestMoodForPlace(place.id);
      map.set(place.id, {
        preview: getPlacePhotoPreview(place, notes),
        color: mood ? MOOD_CONFIG[mood].color : (place.pinColor ?? Colors.myPlace),
      });
    }
    return map;
  }, [places, notes, getLatestMoodForPlace]);

  const selectedPreview = selectedPlace ? markerData.get(selectedPlace.id)?.preview : null;

  // Keying the whole annotation set on place composition forces PointAnnotation to fully
  // remount on add/remove — @rnmapbox/maps can otherwise leave a stale native annotation
  // behind when the array shrinks (e.g. deleting a place after filtering).
  const annotationsKey = useMemo(() => places.map((p) => p.id).join(','), [places]);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      onAnnotationSelected?.();
    },
    [onAnnotationSelected],
  );

  const handleDeselect = useCallback((id: string) => {
    setSelectedId((cur) => (cur === id ? null : cur));
  }, []);

  const handleCloseCallout = useCallback(() => setSelectedId(null), []);

  const handleCalloutPress = useCallback(() => {
    if (selectedPlace) onMarkerPress(selectedPlace.id);
  }, [onMarkerPress, selectedPlace]);

  const handleDirectionsPress = useCallback(() => {
    if (!selectedPlace) return;
    setSelectedId(null);
    onDirections(selectedPlace);
  }, [onDirections, selectedPlace]);

  const handleDeletePress = useCallback(() => {
    if (!selectedPlace) return;
    setSelectedId(null);
    onDeleteMarker(selectedPlace.id, selectedPlace.name);
  }, [onDeleteMarker, selectedPlace]);

  const handleSharePress = useCallback(() => {
    if (!selectedPlace) return;
    const { latitude, longitude } = selectedPlace.coordinates;
    const mapsUrl = buildGoogleMapsSearchUrl(selectedPlace.coordinates);
    // The message always carries the name, coordinates, and Google Maps link as text; when
    // there's a photo it's attached via `url` too (iOS's share sheet renders it inline) —
    // falls back to sharing the maps link itself as `url` when there's no photo.
    const message = `${selectedPlace.name}\n${latitude.toFixed(5)}, ${longitude.toFixed(5)}\n${mapsUrl}`;
    logPlaceShared();
    void Share.share({ message, url: selectedPreview?.photoUri ?? mapsUrl });
  }, [selectedPlace, selectedPreview]);

  return (
    <React.Fragment key={annotationsKey}>
      {places.map((place) => {
        const data = markerData.get(place.id)!;
        return (
          <MarkerPin
            key={place.id}
            place={place}
            color={data.color}
            preview={data.preview}
            registerRef={registerRef}
            onSelect={handleSelect}
            onDeselect={handleDeselect}
            onPhotoLoad={refreshOne}
          />
        );
      })}

      {selectedPlace && (
        <MarkerView
          coordinate={[selectedPlace.coordinates.longitude, selectedPlace.coordinates.latitude]}
          anchor={calloutAnchor}
        >
          <CalloutContainer placement={calloutPlacement} pinHeight={PIN_SIZE}>
            <MarkerCallout
              place={selectedPlace}
              preview={selectedPreview ?? null}
              mood={selectedMood}
              onClose={handleCloseCallout}
              onSharePress={handleSharePress}
              onCalloutPress={handleCalloutPress}
              onDirectionsPress={handleDirectionsPress}
              onDeletePress={handleDeletePress}
            />
          </CalloutContainer>
        </MarkerView>
      )}
    </React.Fragment>
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
  // Plain drop-pin silhouette (no photo yet) — same white "hole" badge as
  // QuickAddPreviewMarker so an un-photographed place still reads as a pin, not a blob.
  pinBadge: {
    position: 'absolute',
    top: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The photo sits as a circle on top of the drop shape (near its wide end), not in place
  // of it — keeps the pin silhouette intact instead of replacing it with a plain circle.
  photoBadge: {
    position: 'absolute',
    top: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.white,
    overflow: 'hidden',
    backgroundColor: Colors.neutral[100],
  },
  photoBadgeImage: {
    width: '100%',
    height: '100%',
  },
  callout: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    padding: Spacing.s16,
    minWidth: 200,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // A normal in-flow row, not absolutely-positioned overlays — MarkerView measures/
  // rasterizes its content to the JS-measured layout box, so anything positioned outside
  // that box (negative offsets) gets cut off rather than floating over the map.
  // Negative side margins pull the two buttons out past the card's own padding so they sit
  // close to its edges, rather than floating inset with the text content.
  calloutHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -Spacing.s8,
    marginHorizontal: -Spacing.s8,
    marginBottom: Spacing.s4,
  },
  // A dark border keeps the button visible against whatever's under it on the map,
  // instead of blending into busy map tiles.
  calloutCloseButton: {
    borderWidth: 1.5,
    borderColor: Colors.neutral[900],
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
  calloutPhotoWrap: {
    marginBottom: Spacing.s8,
  },
  calloutPhoto: {
    width: '100%',
    height: 110,
    borderRadius: Radii.sm,
    backgroundColor: Colors.neutral[100],
  },
  calloutPhotoMock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutPhotoMoodBadge: {
    position: 'absolute',
    top: Spacing.s4,
    right: Spacing.s4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  calloutPhotoMoodEmoji: {
    fontSize: 14,
  },
  calloutNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s4,
    marginBottom: Spacing.s4,
  },
  calloutName: {
    ...Typography.title3,
    color: Colors.neutral[900],
  },
  calloutBadgeIcon: {
    fontSize: 14,
  },
  calloutDescription: {
    ...Typography.subheadline,
    color: Colors.neutral[600],
    marginBottom: Spacing.s4,
  },
  calloutTags: {
    ...Typography.caption,
    color: Colors.accent.primary,
    fontWeight: '600',
  },
  calloutMood: {
    ...Typography.subheadline,
    color: Colors.neutral[600],
    marginTop: Spacing.s4,
  },
  calloutTap: {
    ...Typography.subheadline,
    color: Colors.brand.primary,
    marginTop: Spacing.s8,
    fontWeight: '600',
  },
  calloutInfoSection: {
    marginTop: Spacing.s8,
    gap: Spacing.s4,
  },
  calloutInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
  },
  calloutInfoText: {
    ...Typography.caption,
    color: Colors.neutral[600],
    flex: 1,
  },
  calloutInfoLink: {
    color: Colors.brand.primary,
    fontWeight: '600',
  },
  calloutDivider: {
    height: 1,
    backgroundColor: Colors.neutral[100],
    marginVertical: Spacing.s12,
  },
  calloutActionsRow: {
    flexDirection: 'row',
    gap: Spacing.s12,
  },
});
