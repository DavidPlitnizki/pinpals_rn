import { Camera, MapView, UserLocation } from '@rnmapbox/maps';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ClearMapButton } from './components/ClearMapButton';
import { ClearRouteButton } from './components/ClearRouteButton';
import { FlyToLandingMarker } from './components/FlyToLandingMarker';
import { FlyToSheet } from './components/FlyToSheet';
import { MapControls } from './components/MapControls';
import { MapMarkers } from './components/MapMarkers';
import { MapSearchBar } from './components/MapSearchBar';
import { MapToast } from './components/MapToast';
import { NativePoiMarker } from './components/NativePoiMarker';
import { QuickAddPlaceSheet } from './components/QuickAddPlaceSheet';
import { QuickAddPreviewMarker } from './components/QuickAddPreviewMarker';
import { RouteDestinationMarker } from './components/RouteDestinationMarker';
import { RouteInfoCard } from './components/RouteInfoCard';
import { RouteLineLayer } from './components/RouteLineLayer';
import { RouteModePicker } from './components/RouteModePicker';
import { SearchResultMarker } from './components/SearchResultMarker';
import { SearchSheet } from './components/SearchSheet';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from './constants';
import { useFlyToSheet } from './hooks/useFlyToSheet';
import { useMapScreen } from './hooks/useMapScreen';
import { useQuickCategorySearch } from './hooks/useQuickCategorySearch';
import { useRouteDirections } from './hooks/useRouteDirections';
import { useSearchSheet } from './hooks/useSearchSheet';
import { useWeather } from './hooks/useWeather';
import { NativePoiMarker as NativePoiMarkerData, RouteWaypoint } from './types';
import { Coordinates, Place } from '../../models/types';
import { logRouteShared } from '../../services/analytics';
import { MapboxSearchResult } from '../../services/mapboxSearch';
import { buildGoogleMapsDirectionsUrl } from '../../shared/mapLinks';
import { useSavedRoutesStore } from '../../store/useSavedRoutesStore';

// Stable empty list — a fresh `[]` each render would remount every annotation in MapMarkers.
const EMPTY_PLACES: Place[] = [];

function isSameCoordinates(a: Coordinates, b: Coordinates): boolean {
  return a.latitude === b.latitude && a.longitude === b.longitude;
}

const ACTIVE_ROUTE_KEEP_AWAKE_TAG = 'pinpals-active-route';

export default function MapScreen() {
  const {
    cameraRef,
    mapViewRef,
    places,
    locationGranted,
    gpsCoords,
    handleConfirmFlyTo,
    showQuickAddSheet,
    pendingPlaceCoords,
    pendingPlaceMeta,
    searchResultMarkers,
    nativePoiMarker,
    dismissSignal,
    toastAnim,
    toastMsg,
    toastGPS,
    showToast,
    currentCenter,
    currentZoom,
    getMapCenter,
    getVisibleBbox,
    handleCenterGPS,
    handleLongPress,
    handleMapPress,
    markAnnotationTapped,
    handleCloseNativePoiMarker,
    handleConfirmNativePoiMarker,
    handleAddAtCurrentLocation,
    handleCloseQuickAddSheet,
    handleSaveWaypointAsPlace,
    handleSaveQuickAddPlace,
    handleSelectSearchResult,
    handleShowSearchResultsOnMap,
    handleClearSearchResultMarkers,
    handleConfirmSearchResultMarker,
    handleMarkerPress,
    handleDeleteMarker,
    myPlacesHidden,
    toggleMyPlacesHidden,
  } = useMapScreen();

  const search = useSearchSheet(places, getMapCenter, getVisibleBbox);

  // Bumped on every confirmed fly-to so the landing animation replays even when the user
  // flies to the same place twice in a row.
  const [landingSignal, setLandingSignal] = useState(0);
  const onConfirmFlyTo = useCallback(
    (coords: Coordinates, label: string) => {
      handleConfirmFlyTo(coords, label);
      setLandingSignal((n) => n + 1);
    },
    [handleConfirmFlyTo],
  );
  const onLandingDone = useCallback(() => setLandingSignal(0), []);
  const flyTo = useFlyToSheet(onConfirmFlyTo);
  const quickSearch = useQuickCategorySearch(
    handleShowSearchResultsOnMap,
    handleClearSearchResultMarkers,
    getVisibleBbox,
  );
  const onWaypointReached = useCallback(
    (label: string) => showToast(`Reached ${label}`, false),
    [showToast],
  );
  const route = useRouteDirections(gpsCoords, locationGranted, onWaypointReached);
  const weather = useWeather(gpsCoords, getMapCenter, getVisibleBbox);
  const resultWasTappedRef = useRef(false);
  const addSavedRoute = useSavedRoutesStore((s) => s.addSavedRoute);
  const router = useRouter();

  // Every Modal presented over the MapView can drop PointAnnotation bitmaps (see
  // usePointAnnotationRefresh), so markers must re-register whenever any of them opens
  // or closes — not just the route picker.
  const annotationRefreshSignal = `${route.pickerVisible}|${showQuickAddSheet}|${search.visible}|${flyTo.visible}`;

  // Keep the screen on while actively navigating a route — the phone auto-locking mid-walk
  // or mid-drive forces the user to unlock it again just to glance at directions.
  const isRouteActive = route.activeRoute?.status === 'success';
  useEffect(() => {
    if (!isRouteActive) return;
    void activateKeepAwakeAsync(ACTIVE_ROUTE_KEEP_AWAKE_TAG);
    return () => {
      void deactivateKeepAwake(ACTIVE_ROUTE_KEEP_AWAKE_TAG);
    };
  }, [isRouteActive]);

  // Pins for every stop of the route: while picking a mode, the full (possibly extended)
  // pending stop list; once confirmed, the waypoints actually being routed to. Stops that
  // land on an already-drawn pin (a saved place, or a search result still shown on the map)
  // are dropped here — that pin is already on the map, so RouteDestinationMarker would
  // otherwise stack a second one directly on top of it.
  const allRouteWaypoints = route.pickerVisible
    ? route.pendingWaypoints
    : route.activeRoute?.status === 'success'
      ? route.activeRoute.waypoints
      : [];
  const routeWaypoints = allRouteWaypoints.filter(
    (w) =>
      !places.some((p) => isSameCoordinates(p.coordinates, w.coordinates)) &&
      !searchResultMarkers.some((m) => isSameCoordinates(m.coordinates, w.coordinates)),
  );

  const onExternalResultPress = useCallback(
    (result: MapboxSearchResult) => {
      resultWasTappedRef.current = true;
      handleSelectSearchResult(result);
    },
    [handleSelectSearchResult],
  );

  const onSearchClose = useCallback(() => {
    if (!resultWasTappedRef.current && search.externalResults.length > 0) {
      handleShowSearchResultsOnMap(search.externalResults);
    }
    resultWasTappedRef.current = false;
    search.close();
  }, [search, handleShowSearchResultsOnMap]);

  const onLongPress = useCallback(
    (feature: unknown) => {
      handleLongPress(feature as { geometry: { coordinates: [number, number] } });
    },
    [handleLongPress],
  );

  const onPress = useCallback(
    (feature: unknown) => {
      void handleMapPress(
        feature as GeoJSON.Feature<GeoJSON.Point, { screenPointX: number; screenPointY: number }>,
      );
    },
    [handleMapPress],
  );

  const { onCameraSettled: onQuickSearchCameraSettled } = quickSearch;
  const { onCameraSettled: onWeatherCameraSettled, refresh: refreshWeather } = weather;

  const onCameraChanged = useCallback(
    (state: { properties: { center: unknown; zoom: number } }) => {
      const center = state.properties.center as [number, number];
      currentCenter.current = center;
      currentZoom.current = state.properties.zoom;
      onQuickSearchCameraSettled();
      onWeatherCameraSettled();
    },
    [currentCenter, currentZoom, onQuickSearchCameraSettled, onWeatherCameraSettled],
  );

  // Coming back from the weather detail screen (which may have searched a different
  // city) should re-sync the map badge with wherever the camera actually is now.
  useFocusEffect(
    useCallback(() => {
      void refreshWeather();
    }, [refreshWeather]),
  );

  const onOpenWeather = useCallback(() => {
    const { latitude, longitude } = getMapCenter();
    router.push({
      pathname: '/weather-detail',
      params: { latitude: String(latitude), longitude: String(longitude) },
    });
  }, [getMapCenter, router]);

  const { selectCategory: selectQuickCategory, searchHere: searchQuickCategoryHere } = quickSearch;
  const onSelectQuickCategory = useCallback(
    (categoryKey: string) => {
      selectQuickCategory(categoryKey, getMapCenter());
    },
    [selectQuickCategory, getMapCenter],
  );
  const onSearchHere = useCallback(() => {
    searchQuickCategoryHere(getMapCenter());
  }, [searchQuickCategoryHere, getMapCenter]);

  // Tapping one of your own places in search should behave like tapping its map marker
  // would — recentre the map on it — not jump to the edit/detail screen.
  const onSearchPlacePress = useCallback(
    (placeId: string) => {
      const place = places.find((p) => p.id === placeId);
      if (!place) return;
      cameraRef.current?.setCamera({
        centerCoordinate: [place.coordinates.longitude, place.coordinates.latitude],
        zoomLevel: 16,
        animationDuration: 600,
      });
    },
    [places, cameraRef],
  );

  const onClearSearchResults = useCallback(() => {
    handleClearSearchResultMarkers();
    quickSearch.clear();
    search.resetFilters();
    // The route (if any) was built to one of these markers — once the marker's gone,
    // a route pointing at it doesn't make sense either. Clearing the route alone
    // (ClearRouteButton) must NOT touch these markers — that direction stays one-way.
    route.clearRoute();
  }, [handleClearSearchResultMarkers, quickSearch, search, route]);

  const onPlaceDirections = useCallback(
    (place: Place) => {
      route.openModePicker(place.coordinates, place.name);
    },
    [route],
  );

  const onSearchResultDirections = useCallback(
    (marker: MapboxSearchResult) => {
      route.openModePicker(marker.coordinates, marker.name);
    },
    [route],
  );

  const onNativePoiDirections = useCallback(
    (marker: NativePoiMarkerData) => {
      route.openModePicker(marker.coordinates, marker.name);
    },
    [route],
  );

  const onQuickAddDirections = useCallback(
    (name: string) => {
      if (!pendingPlaceCoords) return;
      route.openModePicker(pendingPlaceCoords, name.trim() || 'New Pin');
    },
    [pendingPlaceCoords, route],
  );

  const onConfirmRoute = useCallback(() => {
    route.confirmRoute(route.selectedProfile);
    // A route confirmed from a tap-on-map native POI callout should close that callout —
    // once the route is drawn, the little popup it was launched from is just clutter.
    handleCloseNativePoiMarker();
  }, [route, handleCloseNativePoiMarker]);

  const onSaveRoute = useCallback(() => {
    if (route.activeRoute?.status !== 'success') return;
    const lastLabel = route.activeRoute.waypoints[route.activeRoute.waypoints.length - 1]?.label;
    addSavedRoute(
      lastLabel || 'Saved route',
      route.activeRoute.waypoints,
      route.activeRoute.profile,
    );
  }, [route, addSavedRoute]);

  const onSavePoint = useCallback(
    (waypoint: RouteWaypoint) => {
      handleSaveWaypointAsPlace(waypoint.coordinates);
    },
    [handleSaveWaypointAsPlace],
  );

  const onShareRoute = useCallback(() => {
    if (route.activeRoute?.status !== 'success') return;
    const { origin, waypoints, profile } = route.activeRoute;
    const destination = waypoints[waypoints.length - 1];
    const intermediateStops = waypoints.slice(0, -1).map((w) => w.coordinates);
    const url = buildGoogleMapsDirectionsUrl(
      origin.coordinates,
      destination.coordinates,
      intermediateStops,
      profile,
    );
    logRouteShared();
    void Share.share({ message: `${destination.label}: ${url}`, url });
  }, [route]);

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
        {/* Rendered first (right after Camera) so every annotation below — the user's own
            location dot included — always draws on top of the route line, never under it. */}
        {route.activeRoute?.status === 'success' && route.activeRoute.geometry && (
          <RouteLineLayer geometry={route.activeRoute.geometry} />
        )}
        {locationGranted && (
          <UserLocation
            visible
            // A plain dot is fine at rest, but while actively routed the heading arrow
            // (Mapbox's built-in compass-driven indicator) shows which way to walk/drive.
            showsUserHeadingIndicator={route.activeRoute?.status === 'success'}
          />
        )}
        <MapMarkers
          mapViewRef={mapViewRef}
          places={myPlacesHidden ? EMPTY_PLACES : places}
          onMarkerPress={handleMarkerPress}
          onDeleteMarker={handleDeleteMarker}
          onDirections={onPlaceDirections}
          refreshSignal={annotationRefreshSignal}
          onAnnotationSelected={markAnnotationTapped}
          dismissSignal={dismissSignal}
        />
        {searchResultMarkers.length > 0 && (
          <SearchResultMarker
            mapViewRef={mapViewRef}
            markers={searchResultMarkers}
            onConfirm={handleConfirmSearchResultMarker}
            onDirections={onSearchResultDirections}
            refreshSignal={annotationRefreshSignal}
            onAnnotationSelected={markAnnotationTapped}
            dismissSignal={dismissSignal}
          />
        )}
        {nativePoiMarker && (
          <NativePoiMarker
            mapViewRef={mapViewRef}
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
        {routeWaypoints.length > 0 && (
          <RouteDestinationMarker
            waypoints={routeWaypoints}
            refreshSignal={annotationRefreshSignal}
            onAnnotationSelected={markAnnotationTapped}
            dismissSignal={dismissSignal}
            onSaveRoute={onSaveRoute}
            onSavePoint={onSavePoint}
          />
        )}
      </MapView>

      {landingSignal > 0 && (
        <FlyToLandingMarker signal={landingSignal} onDone={onLandingDone} />
      )}

      <MapToast toastAnim={toastAnim} toastMsg={toastMsg} toastGPS={toastGPS} />

      {route.activeRoute?.status === 'success' &&
      route.activeRoute.distanceMeters !== null &&
      route.activeRoute.durationSeconds !== null ? (
        <Animated.View
          style={styles.topOverlay}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
        >
          <RouteInfoCard
            destinationLabel={
              route.activeRoute.waypoints[route.activeRoute.waypoints.length - 1]?.label ?? ''
            }
            profile={route.activeRoute.profile}
            distanceMeters={route.activeRoute.distanceMeters}
            durationSeconds={route.activeRoute.durationSeconds}
            steps={route.activeRoute.steps}
            nearestStepIndex={route.nearestStepIndex}
            onShareRoute={onShareRoute}
          />
        </Animated.View>
      ) : (
        <Animated.View
          style={styles.topOverlay}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
        >
          <MapSearchBar
            query={search.query}
            weather={weather.weather}
            activeCategory={quickSearch.activeCategory}
            myPlacesHidden={myPlacesHidden}
            onToggleMyPlaces={toggleMyPlacesHidden}
            categoryLoading={quickSearch.loading}
            canSearchHere={quickSearch.canSearchHere}
            searchHereLoading={quickSearch.searchHereLoading}
            onOpenSearch={search.open}
            onOpenWeather={onOpenWeather}
            onSelectCategory={onSelectQuickCategory}
            onSearchHere={onSearchHere}
            onClearQuery={onClearSearchResults}
          />
        </Animated.View>
      )}

      {route.activeRoute?.status === 'success' && (
        <ClearRouteButton
          onPress={route.removeLastWaypoint}
          onLongPress={route.clearRoute}
          stacked={searchResultMarkers.length > 0}
        />
      )}

      {searchResultMarkers.length > 0 && <ClearMapButton onPress={onClearSearchResults} />}

      <MapControls
        gpsCoords={gpsCoords}
        onCenterGPS={handleCenterGPS}
        onAdd={handleAddAtCurrentLocation}
        onFlyTo={flyTo.open}
      />

      <QuickAddPlaceSheet
        visible={showQuickAddSheet}
        coordinates={pendingPlaceCoords}
        suggestedName={pendingPlaceMeta?.name}
        suggestedPhone={pendingPlaceMeta?.phone}
        suggestedImageUrl={pendingPlaceMeta?.imageUrl}
        address={pendingPlaceMeta?.address}
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
        onConfirm={onConfirmRoute}
        onClose={route.closeModePicker}
      />

      <FlyToSheet
        visible={flyTo.visible}
        query={flyTo.query}
        loading={flyTo.loading}
        error={flyTo.error}
        results={flyTo.results}
        onChangeQuery={flyTo.setQuery}
        onSubmit={flyTo.submit}
        onSelectResult={flyTo.selectResult}
        onClose={flyTo.close}
      />

      <SearchSheet
        visible={search.visible}
        query={search.query}
        filteredPlaces={search.filteredPlaces}
        externalResults={search.externalResults}
        externalLoading={search.externalLoading}
        externalSearched={search.externalSearched}
        onChangeQuery={search.setQuery}
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
  // MapSearchBar/RouteInfoCard already position themselves absolutely (top:0/left:0/right:0)
  // internally — this wrapper must match that positioning too, otherwise it participates in
  // the container's normal flex flow (pushed below MapView's flex:1, off-screen) instead of
  // overlaying the map.
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
