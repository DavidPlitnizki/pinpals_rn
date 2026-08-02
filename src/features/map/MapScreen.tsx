import { Camera, MapView, UserLocation } from '@rnmapbox/maps';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { ClearRouteButton } from './components/ClearRouteButton';
import { ClearSearchResultsButton } from './components/ClearSearchResultsButton';
import { FriendsButton } from './components/FriendsButton';
import { FriendsSheet } from './components/FriendsSheet';
import { MapControls } from './components/MapControls';
import { MapMarkers } from './components/MapMarkers';
import { MapToast } from './components/MapToast';
import { NativePoiMarker } from './components/NativePoiMarker';
import { QuickAddPlaceSheet } from './components/QuickAddPlaceSheet';
import { QuickAddPreviewMarker } from './components/QuickAddPreviewMarker';
import { RouteInfoCard } from './components/RouteInfoCard';
import { RouteLineLayer } from './components/RouteLineLayer';
import { RouteModePicker } from './components/RouteModePicker';
import { SearchResultMarker } from './components/SearchResultMarker';
import { SearchSheet } from './components/SearchSheet';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from './constants';
import { useFriendsSheet } from './hooks/useFriendsSheet';
import { useMapScreen } from './hooks/useMapScreen';
import { useRouteDirections } from './hooks/useRouteDirections';
import { useSearchSheet } from './hooks/useSearchSheet';
import { NativePoiMarker as NativePoiMarkerData } from './types';
import { Place } from '../../models/types';
import { MapboxSearchResult } from '../../services/mapboxSearch';

export default function MapScreen() {
  const router = useRouter();
  const {
    cameraRef,
    mapViewRef,
    places,
    locationGranted,
    gpsCoords,
    showQuickAddSheet,
    pendingPlaceCoords,
    searchResultMarkers,
    nativePoiMarker,
    toastAnim,
    toastMsg,
    toastGPS,
    currentCenter,
    currentZoom,
    handleCenterGPS,
    handleLongPress,
    handleMapPress,
    markAnnotationTapped,
    handleCloseNativePoiMarker,
    handleConfirmNativePoiMarker,
    handleAddAtCurrentLocation,
    handleCloseQuickAddSheet,
    handleSaveQuickAddPlace,
    handleSelectSearchResult,
    handleShowSearchResultsOnMap,
    handleClearSearchResultMarkers,
    handleConfirmSearchResultMarker,
    handleMarkerPress,
    handleDeleteMarker,
  } = useMapScreen();

  const search = useSearchSheet(places, gpsCoords);
  const friends = useFriendsSheet();
  const route = useRouteDirections(gpsCoords, locationGranted);
  const resultWasTappedRef = useRef(false);

  // Every Modal presented over the MapView can drop PointAnnotation bitmaps (see
  // usePointAnnotationRefresh), so markers must re-register whenever any of them opens
  // or closes — not just the route picker.
  const annotationRefreshSignal = `${route.pickerVisible}|${showQuickAddSheet}|${search.visible}`;

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

  function onPress(feature: unknown) {
    void handleMapPress(
      feature as GeoJSON.Feature<GeoJSON.Point, { screenPointX: number; screenPointY: number }>,
    );
  }

  function onCameraChanged(state: { properties: { center: unknown; zoom: number } }) {
    currentCenter.current = state.properties.center as [number, number];
    currentZoom.current = state.properties.zoom;
  }

  function onSearchPlacePress(placeId: string) {
    router.push({ pathname: '/place/[id]', params: { id: placeId } } as any);
  }

  function onClearSearchResults() {
    handleClearSearchResultMarkers();
    search.resetFilters();
    // The route (if any) was built to one of these markers — once the marker's gone,
    // a route pointing at it doesn't make sense either. Clearing the route alone
    // (ClearRouteButton) must NOT touch these markers — that direction stays one-way.
    route.clearRoute();
  }

  function onPlaceDirections(place: Place) {
    route.openModePicker(place.coordinates, place.name);
  }

  function onSearchResultDirections(marker: MapboxSearchResult) {
    route.openModePicker(marker.coordinates, marker.name);
  }

  function onNativePoiDirections(marker: NativePoiMarkerData) {
    route.openModePicker(marker.coordinates, marker.name);
  }

  function onQuickAddDirections(name: string) {
    if (!pendingPlaceCoords) return;
    route.openModePicker(pendingPlaceCoords, name.trim() || 'New Pin');
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapViewRef}
        style={styles.map}
        onPress={onPress}
        onLongPress={onLongPress}
        onCameraChanged={onCameraChanged}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: DEFAULT_CENTER,
            zoomLevel: DEFAULT_ZOOM,
          }}
        />
        {locationGranted && <UserLocation visible />}
        {route.activeRoute?.status === 'success' && route.activeRoute.geometry && (
          <RouteLineLayer geometry={route.activeRoute.geometry} />
        )}
        <MapMarkers
          places={search.mapPlaces}
          onMarkerPress={handleMarkerPress}
          onDeleteMarker={handleDeleteMarker}
          onDirections={onPlaceDirections}
          refreshSignal={annotationRefreshSignal}
          onAnnotationSelected={markAnnotationTapped}
        />
        {searchResultMarkers.length > 0 && (
          <SearchResultMarker
            markers={searchResultMarkers}
            onConfirm={handleConfirmSearchResultMarker}
            onDirections={onSearchResultDirections}
            refreshSignal={annotationRefreshSignal}
            onAnnotationSelected={markAnnotationTapped}
          />
        )}
        {nativePoiMarker && (
          <NativePoiMarker
            marker={nativePoiMarker}
            onClose={handleCloseNativePoiMarker}
            onDirections={onNativePoiDirections}
            onAddPlace={handleConfirmNativePoiMarker}
            refreshSignal={annotationRefreshSignal}
            onAnnotationSelected={markAnnotationTapped}
          />
        )}
        {showQuickAddSheet && pendingPlaceCoords && (
          <QuickAddPreviewMarker
            coordinates={pendingPlaceCoords}
            refreshSignal={annotationRefreshSignal}
          />
        )}
      </MapView>

      <MapToast toastAnim={toastAnim} toastMsg={toastMsg} toastGPS={toastGPS} />

      {route.activeRoute?.status === 'success' &&
        route.activeRoute.distanceMeters !== null &&
        route.activeRoute.durationSeconds !== null && (
          <RouteInfoCard
            destinationLabel={route.activeRoute.destinationLabel}
            profile={route.activeRoute.profile}
            distanceMeters={route.activeRoute.distanceMeters}
            durationSeconds={route.activeRoute.durationSeconds}
            steps={route.activeRoute.steps}
            nearestStepIndex={route.nearestStepIndex}
          />
        )}

      {route.activeRoute?.status === 'success' && (
        <ClearRouteButton onPress={route.clearRoute} stacked={searchResultMarkers.length > 0} />
      )}

      <FriendsButton onPress={friends.open} hasUnread={friends.hasUnread} />

      {searchResultMarkers.length > 0 && (
        <ClearSearchResultsButton
          count={searchResultMarkers.length}
          onPress={onClearSearchResults}
        />
      )}

      <MapControls
        gpsCoords={gpsCoords}
        onCenterGPS={handleCenterGPS}
        onAdd={handleAddAtCurrentLocation}
        onSearch={search.open}
      />

      <QuickAddPlaceSheet
        visible={showQuickAddSheet}
        coordinates={pendingPlaceCoords}
        onSave={handleSaveQuickAddPlace}
        onClose={handleCloseQuickAddSheet}
        onDirections={onQuickAddDirections}
      />

      <RouteModePicker
        visible={route.pickerVisible}
        destinationLabel={route.pendingLabel}
        selectedProfile={route.selectedProfile}
        onSelectProfile={route.setSelectedProfile}
        previews={route.previews}
        hasLocation={route.hasLocation}
        loading={route.activeRoute?.status === 'loading'}
        errorMessage={route.activeRoute?.status === 'error' ? route.activeRoute.error : null}
        onConfirm={() => route.confirmRoute(route.selectedProfile)}
        onClose={route.closeModePicker}
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
