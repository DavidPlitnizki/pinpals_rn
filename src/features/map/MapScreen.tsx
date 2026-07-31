import { Camera, MapView, UserLocation } from '@rnmapbox/maps';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { AddPlaceModal } from './components/AddPlaceModal';
import { ClearSearchResultsButton } from './components/ClearSearchResultsButton';
import { FriendsButton } from './components/FriendsButton';
import { FriendsSheet } from './components/FriendsSheet';
import { MapControls } from './components/MapControls';
import { MapMarkers } from './components/MapMarkers';
import { MapToast } from './components/MapToast';
import { MutedSearchMarker } from './components/MutedSearchMarker';
import { QuickAddPlaceSheet } from './components/QuickAddPlaceSheet';
import { SearchResultMarker } from './components/SearchResultMarker';
import { SearchSheet } from './components/SearchSheet';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from './constants';
import { useFriendsSheet } from './hooks/useFriendsSheet';
import { useMapScreen } from './hooks/useMapScreen';
import { useSearchSheet } from './hooks/useSearchSheet';
import { AddPlaceState, QuickAddPlaceState } from './types';
import { MapboxSearchResult } from '../../services/mapboxSearch';

export default function MapScreen() {
  const router = useRouter();
  const {
    cameraRef,
    places,
    locationGranted,
    gpsCoords,
    showAddModal,
    addPlaceState,
    showQuickAddSheet,
    quickAddState,
    searchResultMarkers,
    mutedSearchMarkers,
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
    handleCloseQuickAddSheet,
    handlePickQuickAddPhotos,
    handleRemoveQuickAddPhoto,
    handleSaveQuickAddPlace,
    handleSelectSearchResult,
    handleShowSearchResultsOnMap,
    handleClearSearchResultMarkers,
    handleConfirmSearchResultMarker,
    handleMarkerPress,
    handleDeleteMarker,
    setAddPlaceState,
    setQuickAddState,
  } = useMapScreen();

  const search = useSearchSheet(places, gpsCoords);
  const friends = useFriendsSheet();
  const resultWasTappedRef = useRef(false);

  function onExternalResultPress(result: MapboxSearchResult) {
    resultWasTappedRef.current = true;
    handleSelectSearchResult(result);
  }

  function onSearchClose() {
    if (!resultWasTappedRef.current && search.externalResults.length > 0) {
      handleShowSearchResultsOnMap(search.externalResults);
    }
    resultWasTappedRef.current = false;
    search.close();
  }

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

  function onQuickAddChange(update: Partial<QuickAddPlaceState>) {
    setQuickAddState((s) => ({ ...s, ...update }));
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
          places={search.mapPlaces}
          onMarkerPress={handleMarkerPress}
          onDeleteMarker={handleDeleteMarker}
        />
        {searchResultMarkers.length > 0 && (
          <SearchResultMarker
            markers={searchResultMarkers}
            onConfirm={handleConfirmSearchResultMarker}
          />
        )}
        {mutedSearchMarkers.length > 0 && <MutedSearchMarker markers={mutedSearchMarkers} />}
      </MapView>

      <MapToast toastAnim={toastAnim} toastMsg={toastMsg} toastGPS={toastGPS} />

      <FriendsButton onPress={friends.open} hasUnread={friends.hasUnread} />

      {searchResultMarkers.length > 0 && (
        <ClearSearchResultsButton
          count={searchResultMarkers.length}
          onPress={handleClearSearchResultMarkers}
        />
      )}

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

      <QuickAddPlaceSheet
        visible={showQuickAddSheet}
        state={quickAddState}
        onChange={onQuickAddChange}
        onPickPhotos={handlePickQuickAddPhotos}
        onRemovePhoto={handleRemoveQuickAddPhoto}
        onSave={handleSaveQuickAddPlace}
        onClose={handleCloseQuickAddSheet}
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
        radiusEnabled={search.radiusEnabled}
        maxRadiusM={search.maxRadiusM}
        activeCategories={search.activeCategories}
        specialFilters={search.specialFilters}
        alwaysShowFavorites={search.alwaysShowFavorites}
        filteredPlaces={search.filteredPlaces}
        showExternal={search.showExternal}
        externalResults={search.externalResults}
        externalLoading={search.externalLoading}
        externalSearched={search.externalSearched}
        onChangeQuery={search.setQuery}
        onRadiusChange={search.setRadiusM}
        onToggleRadiusEnabled={search.setRadiusEnabled}
        onToggleCategory={search.toggleCategory}
        onToggleSpecial={search.toggleSpecial}
        onToggleAlwaysShowFavorites={search.setAlwaysShowFavorites}
        onPlacePress={onSearchPlacePress}
        onExternalResultPress={onExternalResultPress}
        onSearchExternal={search.searchExternal}
        onClose={onSearchClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
