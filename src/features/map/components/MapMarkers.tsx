import { MarkerView, PointAnnotation } from '@rnmapbox/maps';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Spacing, Typography } from '../../../design-system/tokens';
import { Place, PlaceNote, MOOD_CONFIG } from '../../../models/types';
import { usePlacesStore } from '../../../store/usePlacesStore';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../constants';

interface Props {
  places: Place[];
  onMarkerPress: (placeId: string) => void;
  onDeleteMarker: (placeId: string, placeName: string) => void;
}

interface FootprintPreview {
  photoUri: string;
  mood?: (typeof MOOD_CONFIG)[keyof typeof MOOD_CONFIG];
}

function getFootprintPreview(placeId: string, notes: PlaceNote[]): FootprintPreview | null {
  const placeNotes = notes
    .filter((n) => n.placeId === placeId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  for (const note of placeNotes) {
    const photoUri = note.photoUris?.[0] ?? note.photoUri;
    if (photoUri) {
      return { photoUri, mood: note.mood ? MOOD_CONFIG[note.mood] : undefined };
    }
  }
  return null;
}

export function MapMarkers({ places, onMarkerPress, onDeleteMarker }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedPlace = places.find((p) => p.id === selectedId);
  const getLatestMoodForPlace = usePlacesStore((s) => s.getLatestMoodForPlace);
  const notes = usePlacesStore((s) => s.notes);

  function getPinColor(place: Place): string {
    const mood = getLatestMoodForPlace(place.id);
    if (mood) return MOOD_CONFIG[mood].color;
    return CATEGORY_COLORS[place.category];
  }

  return (
    <>
      {places.map((place) => {
        const preview = getFootprintPreview(place.id, notes);
        return (
          <PointAnnotation
            key={`${place.id}-${preview ? 'photo' : 'plain'}`}
            id={place.id}
            coordinate={[place.coordinates.longitude, place.coordinates.latitude]}
            onSelected={() => setSelectedId(place.id)}
            onDeselected={() => setSelectedId(null)}
          >
            {preview ? (
              <View style={styles.footprint}>
                <Image source={{ uri: preview.photoUri }} style={styles.footprintPhoto} />
                {preview.mood && (
                  <View style={styles.moodBadge}>
                    <Text style={styles.moodBadgeEmoji}>{preview.mood.emoji}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.pin, { backgroundColor: getPinColor(place) }]} />
            )}
          </PointAnnotation>
        );
      })}

      {selectedPlace && (
        <MarkerView
          coordinate={[selectedPlace.coordinates.longitude, selectedPlace.coordinates.latitude]}
          anchor={{ x: 0.5, y: 1.3 }}
        >
          <View style={styles.callout}>
            <TouchableOpacity onPress={() => onMarkerPress(selectedPlace.id)}>
              <Text style={styles.calloutName}>{selectedPlace.name}</Text>
              <Text style={styles.calloutCategory}>{CATEGORY_LABELS[selectedPlace.category]}</Text>
              {(() => {
                const mood = getLatestMoodForPlace(selectedPlace.id);
                if (mood) {
                  const cfg = MOOD_CONFIG[mood];
                  return (
                    <Text style={styles.calloutMood}>
                      {cfg.emoji} {cfg.label}
                    </Text>
                  );
                }
                return null;
              })()}
              <Text style={styles.calloutTap}>Details →</Text>
            </TouchableOpacity>
            <View style={styles.calloutDivider} />
            <TouchableOpacity
              onPress={() => {
                setSelectedId(null);
                onDeleteMarker(selectedPlace.id, selectedPlace.name);
              }}
            >
              <Text style={styles.calloutDelete}>Delete</Text>
            </TouchableOpacity>
          </View>
        </MarkerView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  footprint: {
    width: 40,
    height: 40,
  },
  footprintPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  moodBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  moodBadgeEmoji: {
    fontSize: 11,
  },
  callout: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: Spacing.s8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  calloutName: {
    ...Typography.headline,
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  calloutCategory: {
    ...Typography.caption,
    color: Colors.neutral[500],
    textTransform: 'capitalize',
  },
  calloutMood: {
    ...Typography.caption,
    color: Colors.neutral[600],
    marginTop: 2,
  },
  calloutTap: {
    ...Typography.caption,
    color: Colors.brand.primary,
    marginTop: Spacing.s4,
  },
  calloutDivider: {
    height: 1,
    backgroundColor: Colors.neutral[100],
    marginVertical: Spacing.s8,
  },
  calloutDelete: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '600',
    textAlign: 'center',
  },
});
