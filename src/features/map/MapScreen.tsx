import { Camera, MapView, UserLocation } from '@rnmapbox/maps';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Share, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { usePlacesStore } from '../../store/usePlacesStore';
import { getPlacePhotoPreview } from './utils/placePhoto';
import { mapStyleUrl } from './mapStyles';
import { useMapStyleStore } from '../../store/useMapStyleStore';
import { openPlaceSearch } from '../../services/webSearch';
import { shareSpot } from '../../shared/sharePlace';
import { ClearMapButton } from './components/ClearMapButton';
import { ClearRouteButton } from './components/ClearRouteButton';
import { FlyToLandingMarker } from './components/FlyToLandingMarker';
import { FlyToSheet } from './components/FlyToSheet';
import { MapControls } from './components/MapControls';
import { MapStyleSheet } from './components/MapStyleSheet';
import { MapCardSheet } from './components/MapCardSheet';
import { MapMarkers, MarkerCallout } from './components/MapMarkers';
import { MapSearchBar } from './components/MapSearchBar';
import { MapToast } from './components/MapToast';
import { NativePoiCallout, NativePoiMarker } from './components/NativePoiMarker';
import { QuickAddPlaceSheet } from './components/QuickAddPlaceSheet';
import { QuickAddPreviewMarker } from './components/QuickAddPreviewMarker';
import { RouteDestinationMarker, RouteWaypointCallout } from './components/RouteDestinationMarker';
import { RouteInfoCard } from './components/RouteInfoCard';
import { RouteLineLayer } from './components/RouteLineLayer';
import { RouteModePicker } from './components/RouteModePicker';
import { SearchResultCallout, SearchResultMarker } from './components/SearchResultMarker';
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
import { logPlaceShared, logRouteShared } from '../../services/analytics';
import { MapboxSearchResult, MapboxSuggestion } from '../../services/mapboxSearch';
import { buildGoogleMapsDirectionsUrl, buildGoogleMapsSearchUrl } from '../../shared/mapLinks';

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
    dismissCallouts,
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

  const search = useSearchSheet(places, getMapCenter);

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

  // "Open on map" from a place's detail screen hands the coordinates over as route params;
  // the ref makes sure one navigation flies the camera exactly once, not again on every
  // re-render or when the tab regains focus.
  const focusParams = useLocalSearchParams<{ focusLat?: string; focusLng?: string }>();
  const lastFocusRef = useRef<string | null>(null);
  const router = useRouter();

  const mapStyleId = useMapStyleStore((state) => state.styleId);
  const setMapStyleId = useMapStyleStore((state) => state.setStyleId);
  const [styleSheetVisible, setStyleSheetVisible] = useState(false);
  const openStyleSheet = useCallback(() => setStyleSheetVisible(true), []);
  const closeStyleSheet = useCallback(() => setStyleSheetVisible(false), []);

  // Every Modal presented over the MapView can drop PointAnnotation bitmaps (see
  // usePointAnnotationRefresh), so markers must re-register whenever any of them opens
  // or closes — not just the route picker. Switching the base map belongs here for a
  // different reason with the same symptom: a new style tears down and rebuilds the map's
  // layers, and the annotations come back blank unless they re-register too.
  const annotationRefreshSignal = `${route.pickerVisible}|${showQuickAddSheet}|${search.visible}|${flyTo.visible}|${styleSheetVisible}|${mapStyleId}`;

  // Keep the screen on while actively navigating a route — the phone auto-locking mid-walk
  // or mid-drive forces the user to unlock it again just to glance at directions.
  const isRouteActive = route.activeRoute?.status === 'success';
  // Map cards live in MapCardSheet at the bottom of the screen rather than anchored to their
  // pin — see that file for why. The marker components still own which pin is selected; this
  // screen owns what the card shows and what its buttons do.
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedSearchMarkerId, setSelectedSearchMarkerId] = useState<string | null>(null);
  const selectedSearchMarker =
    searchResultMarkers.find((m) => m.id === selectedSearchMarkerId) ?? null;
  const [selectedWaypointIndex, setSelectedWaypointIndex] = useState<number | null>(null);
  // Only one card at a time. Anchored callouts could coexist harmlessly — they hung off
  // different pins — but two sheets share the same slot at the bottom and would stack. The
  // marker components can't sort this out themselves: tapping a second annotation is guarded
  // out of handleMapPress, so nothing else clears the first one.
  //
  // Each component gets its own dismiss counter rather than having this screen null out the
  // other selections directly: the components own their internal selectedId, and clearing
  // only the copy up here would leave that stale — the same pin, tapped again, would report
  // an unchanged id and its card would never come back.
  const [placeDismiss, setPlaceDismiss] = useState(0);
  const [searchDismiss, setSearchDismiss] = useState(0);
  const [waypointDismiss, setWaypointDismiss] = useState(0);

  const selectPlace = useCallback(
    (id: string | null) => {
      setSelectedPlaceId(id);
      if (id === null) return;
      setSearchDismiss((n) => n + 1);
      setWaypointDismiss((n) => n + 1);
      handleCloseNativePoiMarker();
    },
    [handleCloseNativePoiMarker],
  );

  const selectSearchMarker = useCallback(
    (id: string | null) => {
      setSelectedSearchMarkerId(id);
      if (id === null) return;
      setPlaceDismiss((n) => n + 1);
      setWaypointDismiss((n) => n + 1);
      handleCloseNativePoiMarker();
    },
    [handleCloseNativePoiMarker],
  );

  const selectWaypoint = useCallback(
    (index: number | null) => {
      setSelectedWaypointIndex(index);
      if (index === null) return;
      setPlaceDismiss((n) => n + 1);
      setSearchDismiss((n) => n + 1);
      handleCloseNativePoiMarker();
    },
    [handleCloseNativePoiMarker],
  );

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) ?? null;
  const notes = usePlacesStore((state) => state.notes);
  const getLatestMoodForPlace = usePlacesStore((state) => state.getLatestMoodForPlace);
  const selectedPlacePreview = useMemo(
    () => (selectedPlace ? getPlacePhotoPreview(selectedPlace, notes) : null),
    [selectedPlace, notes],
  );
  const selectedPlaceMood = selectedPlace ? getLatestMoodForPlace(selectedPlace.id) : undefined;

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

  // A suggestion carries no coordinates — retrieve resolves it, and only then is there
  // something to put on the map.
  const onSuggestionPress = useCallback(
    async (suggestion: MapboxSuggestion) => {
      const result = await search.selectSuggestion(suggestion);
      if (!result) return false;
      handleSelectSearchResult(result);
      return true;
    },
    [search, handleSelectSearchResult],
  );

  // Closing without picking anything no longer pins the whole result list: suggestions have
  // no coordinates, and resolving all ten just to drop pins would cost ten retrieves. Pinning
  // many results at once is what the category chips do, and that path still uses forward
  // search, which returns coordinates up front.
  const onSearchClose = useCallback(() => {
    search.close();
  }, [search]);

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

  useEffect(() => {
    const { focusLat, focusLng } = focusParams;
    if (!focusLat || !focusLng) return;
    const key = `${focusLat},${focusLng}`;
    if (lastFocusRef.current === key) return;
    lastFocusRef.current = key;

    const latitude = Number(focusLat);
    const longitude = Number(focusLng);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return;

    currentCenter.current = [longitude, latitude];
    cameraRef.current?.setCamera({
      centerCoordinate: [longitude, latitude],
      zoomLevel: 16,
      animationDuration: 800,
    });
  }, [focusParams, cameraRef, currentCenter]);

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
    // Deliberately leaves any active route alone. The two red buttons are now strictly one
    // control each: this one clears search results and category filters, ClearRouteButton
    // clears the route. A route keeps its own waypoints and pins, so it survives its search
    // markers disappearing perfectly well.
  }, [handleClearSearchResultMarkers, quickSearch, search]);

  const onPlaceDirections = useCallback(
    (place: Place) => {
      route.openModePicker(place.coordinates, place.name);
    },
    [route],
  );

  const onPlaceCardOpen = useCallback(() => {
    if (selectedPlace) handleMarkerPress(selectedPlace.id);
  }, [handleMarkerPress, selectedPlace]);

  const onPlaceCardDirections = useCallback(() => {
    if (!selectedPlace) return;
    dismissCallouts();
    onPlaceDirections(selectedPlace);
  }, [dismissCallouts, onPlaceDirections, selectedPlace]);

  const onPlaceCardDelete = useCallback(() => {
    if (!selectedPlace) return;
    dismissCallouts();
    handleDeleteMarker(selectedPlace.id, selectedPlace.name);
  }, [dismissCallouts, handleDeleteMarker, selectedPlace]);

  const onPlaceCardShare = useCallback(() => {
    if (!selectedPlace) return;
    const { latitude, longitude } = selectedPlace.coordinates;
    const mapsUrl = buildGoogleMapsSearchUrl(selectedPlace.coordinates);
    // The message always carries the name, coordinates, and Google Maps link as text; when
    // there's a photo it's attached via `url` too (iOS's share sheet renders it inline) —
    // falls back to sharing the maps link itself as `url` when there's no photo.
    const message = `${selectedPlace.name}\n${latitude.toFixed(5)}, ${longitude.toFixed(5)}\n${mapsUrl}`;
    logPlaceShared();
    void Share.share({ message, url: selectedPlacePreview?.photoUri ?? mapsUrl });
  }, [selectedPlace, selectedPlacePreview]);

  const onSearchCardShare = useCallback(() => {
    if (!selectedSearchMarker) return;
    shareSpot({
      name: selectedSearchMarker.name,
      coordinates: selectedSearchMarker.coordinates,
      address: selectedSearchMarker.fullAddress,
    });
  }, [selectedSearchMarker]);

  const onSearchCardWebsite = useCallback(() => {
    if (selectedSearchMarker?.website) void Linking.openURL(selectedSearchMarker.website);
  }, [selectedSearchMarker]);

  const onSearchCardSearch = useCallback(() => {
    if (!selectedSearchMarker) return;
    void openPlaceSearch(
      selectedSearchMarker.name,
      selectedSearchMarker.coordinates,
      'search_result',
    );
  }, [selectedSearchMarker]);

  const onSearchResultDirections = useCallback(
    (marker: MapboxSearchResult) => {
      route.openModePicker(marker.coordinates, marker.name);
    },
    [route],
  );

  const onSearchCardDirections = useCallback(() => {
    if (!selectedSearchMarker) return;
    dismissCallouts();
    onSearchResultDirections(selectedSearchMarker);
  }, [dismissCallouts, onSearchResultDirections, selectedSearchMarker]);

  const onSearchCardConfirm = useCallback(() => {
    if (!selectedSearchMarker) return;
    dismissCallouts();
    handleConfirmSearchResultMarker(selectedSearchMarker);
  }, [dismissCallouts, handleConfirmSearchResultMarker, selectedSearchMarker]);

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

  const onSavePoint = useCallback(
    (waypoint: RouteWaypoint) => {
      handleSaveWaypointAsPlace(waypoint.coordinates);
    },
    [handleSaveWaypointAsPlace],
  );

  const selectedWaypoint =
    selectedWaypointIndex !== null ? (routeWaypoints[selectedWaypointIndex] ?? null) : null;

  const onWaypointCardSave = useCallback(() => {
    if (!selectedWaypoint) return;
    dismissCallouts();
    onSavePoint(selectedWaypoint);
  }, [dismissCallouts, onSavePoint, selectedWaypoint]);

  // Shares the stop as a Google Maps link — opening it drops the recipient straight on the
  // point, which a bare "lat, lng" line doesn't do.
  const onWaypointCardShare = useCallback(() => {
    if (!selectedWaypoint) return;
    shareSpot({ name: selectedWaypoint.label, coordinates: selectedWaypoint.coordinates });
  }, [selectedWaypoint]);

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
        styleURL={mapStyleUrl(mapStyleId)}
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
          places={myPlacesHidden ? EMPTY_PLACES : places}
          refreshSignal={annotationRefreshSignal}
          onAnnotationSelected={markAnnotationTapped}
          onSelectedPlaceIdChange={selectPlace}
          dismissSignal={`${dismissSignal}|${placeDismiss}`}
        />
        {searchResultMarkers.length > 0 && (
          <SearchResultMarker
            markers={searchResultMarkers}
            refreshSignal={annotationRefreshSignal}
            onAnnotationSelected={markAnnotationTapped}
            onSelectedMarkerIdChange={selectSearchMarker}
            dismissSignal={`${dismissSignal}|${searchDismiss}`}
          />
        )}
        {nativePoiMarker && (
          <NativePoiMarker
            marker={nativePoiMarker}
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
            onSelectedWaypointIndexChange={selectWaypoint}
            dismissSignal={`${dismissSignal}|${waypointDismiss}`}
          />
        )}
      </MapView>

      {landingSignal > 0 && <FlyToLandingMarker signal={landingSignal} onDone={onLandingDone} />}

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
            destinationCoordinates={
              route.activeRoute.waypoints[route.activeRoute.waypoints.length - 1]?.coordinates ??
              null
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
          onPress={route.clearRoute}
          onLongPress={route.removeLastWaypoint}
          stacked={searchResultMarkers.length > 0}
        />
      )}

      {searchResultMarkers.length > 0 && (
        <ClearMapButton onPress={onClearSearchResults} raised={isRouteActive} />
      )}

      <MapControls
        gpsCoords={gpsCoords}
        onCenterGPS={handleCenterGPS}
        onAdd={handleAddAtCurrentLocation}
        onFlyTo={flyTo.open}
        onOpenStyles={openStyleSheet}
      />

      <MapStyleSheet
        visible={styleSheetVisible}
        styleId={mapStyleId}
        onSelect={setMapStyleId}
        onClose={closeStyleSheet}
      />

      {/* Last of the map chrome on purpose: rendering after MapSearchBar and MapControls is
          what puts the card above them. */}
      {nativePoiMarker && (
        <MapCardSheet>
          <NativePoiCallout
            marker={nativePoiMarker}
            onClose={handleCloseNativePoiMarker}
            onDirections={onNativePoiDirections}
            onAddPlace={handleConfirmNativePoiMarker}
          />
        </MapCardSheet>
      )}

      {selectedWaypoint && (
        <MapCardSheet>
          <RouteWaypointCallout
            waypoint={selectedWaypoint}
            onClose={dismissCallouts}
            onSavePointPress={onWaypointCardSave}
            onSharePress={onWaypointCardShare}
          />
        </MapCardSheet>
      )}

      {selectedSearchMarker && (
        <MapCardSheet>
          <SearchResultCallout
            marker={selectedSearchMarker}
            onClose={dismissCallouts}
            onSharePress={onSearchCardShare}
            onWebsitePress={onSearchCardWebsite}
            onSearchPress={onSearchCardSearch}
            onDirectionsPress={onSearchCardDirections}
            onConfirmPress={onSearchCardConfirm}
          />
        </MapCardSheet>
      )}

      {selectedPlace && (
        <MapCardSheet>
          <MarkerCallout
            place={selectedPlace}
            preview={selectedPlacePreview}
            mood={selectedPlaceMood}
            onClose={dismissCallouts}
            onSharePress={onPlaceCardShare}
            onCalloutPress={onPlaceCardOpen}
            onDirectionsPress={onPlaceCardDirections}
            onDeletePress={onPlaceCardDelete}
          />
        </MapCardSheet>
      )}

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
        suggestions={search.suggestions}
        externalLoading={search.externalLoading}
        externalSearched={search.externalSearched}
        retrievingId={search.retrievingId}
        onChangeQuery={search.setQuery}
        onPlacePress={onSearchPlacePress}
        onSuggestionPress={onSuggestionPress}
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
