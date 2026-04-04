import { Camera, MapView, UserLocation } from "@rnmapbox/maps";
import React from "react";
import { StyleSheet, View } from "react-native";

import { DEFAULT_CENTER, DEFAULT_ZOOM } from "./constants";
import { AddPlaceModal } from "./components/AddPlaceModal";
import { MapControls } from "./components/MapControls";
import { MapMarkers } from "./components/MapMarkers";
import { MapToast } from "./components/MapToast";
import { ProfileButton } from "./components/ProfileButton";
import { ProfileMenuSheet } from "./components/ProfileMenuSheet";
import { useMapScreen } from "./hooks/useMapScreen";

export default function MapScreen() {
  const {
    cameraRef,
    places,
    profile,
    locationGranted,
    gpsCoords,
    showAddModal,
    showProfileMenu,
    addPlaceState,
    toastAnim,
    toastMsg,
    toastGPS,
    currentCenter,
    currentZoom,
    handleZoomIn,
    handleZoomOut,
    handleCenterGPS,
    handleLongPress,
    handleAddAtCurrentLocation,
    handleCloseModal,
    handleSavePlace,
    handleMarkerPress,
    handleDeleteMarker,
    setShowProfileMenu,
    setAddPlaceState,
  } = useMapScreen();

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        onLongPress={handleLongPress}
        onCameraChanged={(state) => {
          currentCenter.current = state.properties.center as [number, number];
          currentZoom.current = state.properties.zoom;
        }}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: DEFAULT_CENTER,
            zoomLevel: DEFAULT_ZOOM,
          }}
        />
        {locationGranted && <UserLocation visible />}
        <MapMarkers
          places={places}
          onMarkerPress={handleMarkerPress}
          onDeleteMarker={handleDeleteMarker}
        />
      </MapView>

      <MapToast toastAnim={toastAnim} toastMsg={toastMsg} toastGPS={toastGPS} />

      <ProfileButton profile={profile} onPress={() => setShowProfileMenu(true)} />

      <MapControls
        gpsCoords={gpsCoords}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onCenterGPS={handleCenterGPS}
        onAdd={handleAddAtCurrentLocation}
      />

      <ProfileMenuSheet
        visible={showProfileMenu}
        onClose={() => setShowProfileMenu(false)}
        profile={profile}
        places={places}
      />

      <AddPlaceModal
        visible={showAddModal}
        state={addPlaceState}
        onChange={(update) => setAddPlaceState((s) => ({ ...s, ...update }))}
        onSave={handleSavePlace}
        onClose={handleCloseModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
