import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Callout, Marker } from "react-native-maps";

import { Colors, Spacing, Typography } from "../../../design-system/tokens";
import { Place } from "../../../models/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../constants";

interface Props {
  places: Place[];
  onMarkerPress: (placeId: string) => void;
  onDeleteMarker: (placeId: string, placeName: string) => void;
}

export function MapMarkers({ places, onMarkerPress, onDeleteMarker }: Props) {
  return (
    <>
      {places.map((place) => (
        <Marker
          key={place.id}
          coordinate={place.coordinates}
          pinColor={CATEGORY_COLORS[place.category]}
        >
          <Callout tooltip={false}>
            <View style={styles.callout}>
              <TouchableOpacity onPress={() => onMarkerPress(place.id)}>
                <Text style={styles.calloutName}>{place.name}</Text>
                <Text style={styles.calloutCategory}>
                  {CATEGORY_LABELS[place.category]}
                </Text>
                <Text style={styles.calloutRating}>
                  {"★".repeat(place.rating)}
                </Text>
                <Text style={styles.calloutTap}>Tap for details →</Text>
              </TouchableOpacity>
              <View style={styles.calloutDivider} />
              <TouchableOpacity
                onPress={() => onDeleteMarker(place.id, place.name)}
              >
                <Text style={styles.calloutDelete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Callout>
        </Marker>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  callout: { padding: Spacing.s8, minWidth: 150 },
  calloutName: {
    ...Typography.headline,
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  calloutCategory: {
    ...Typography.caption,
    color: Colors.neutral[500],
    textTransform: "capitalize",
  },
  calloutRating: { fontSize: 14, color: "#F5A623", marginTop: 2 },
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
    fontWeight: "600",
    textAlign: "center",
  },
});
