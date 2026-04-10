import { Camera, MapView, UserLocation } from '@rnmapbox/maps';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AddPlaceModal } from './components/AddPlaceModal';
import { FriendsButton } from './components/FriendsButton';
import { FriendsSheet } from './components/FriendsSheet';
import { MapControls } from './components/MapControls';
import { MapMarkers } from './components/MapMarkers';
import { MapToast } from './components/MapToast';
import { SearchSheet } from './components/SearchSheet';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from './constants';
import { useFriendsSheet } from './hooks/useFriendsSheet';
import { useMapScreen } from './hooks/useMapScreen';
import { useSearchSheet } from './hooks/useSearchSheet';
import { AddPlaceState } from './types';

export default function MapScreen() {
  const router = useRouter();
  const {
    cameraRef,
    places,
    locationGranted,
    gpsCoords,
    showAddModal,
    addPlaceState,
    toastAnim,
    toastMsg,
    toastGPS,
    currentCenter,
    currentZoom,
    handleCenterGPS,
    handleLongPress,
    handleAddAtCurrentLocation,
    handleCloseModal,
    handleSavePlace,
    handleMarkerPress,
    handleDeleteMarker,
    setAddPlaceState,
  } = useMapScreen();

  const search = useSearchSheet(places, gpsCoords);
  const friends = useFriendsSheet();

  function onLongPress(feature: unknown) {
    handleLongPress(feature as { geometry: { coordinates: [number, number] } });
  }

  function onCameraChanged(state: { properties: { center: unknown; zoom: number } }) {
    currentCenter.current = state.properties.center as [number, number];
    currentZoom.current = state.properties.zoom;
  }

  function onAddPlaceChange(update: Partial<AddPlaceState>) {
    setAddPlaceState((s) => ({ ...s, ...update }));
  }

  function onSearchPlacePress(placeId: string) {
    router.push({ pathname: '/place/[id]', params: { id: placeId } } as any);
  }

  return (
    <View style={styles.container}>
      <MapView style={styles.map} onLongPress={onLongPress} onCameraChanged={onCameraChanged}>
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

      <FriendsButton onPress={friends.open} hasUnread={friends.hasUnread} />

      <MapControls
        gpsCoords={gpsCoords}
        onCenterGPS={handleCenterGPS}
        onAdd={handleAddAtCurrentLocation}
        onSearch={search.open}
      />

      <AddPlaceModal
        visible={showAddModal}
        state={addPlaceState}
        onChange={onAddPlaceChange}
        onSave={handleSavePlace}
        onClose={handleCloseModal}
      />

      <FriendsSheet
        visible={friends.visible}
        query={friends.query}
        filteredFriends={friends.filteredFriends}
        filteredGroups={friends.filteredGroups}
        recents={friends.recents}
        onChangeQuery={friends.setQuery}
        onClose={friends.close}
      />

      <SearchSheet
        visible={search.visible}
        query={search.query}
        radiusM={search.radiusM}
        maxRadiusM={search.maxRadiusM}
        activeCategories={search.activeCategories}
        specialFilters={search.specialFilters}
        filteredPlaces={search.filteredPlaces}
        onChangeQuery={search.setQuery}
        onRadiusChange={search.setRadiusM}
        onToggleCategory={search.toggleCategory}
        onToggleSpecial={search.toggleSpecial}
        onPlacePress={onSearchPlacePress}
        onClose={search.close}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
