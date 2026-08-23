# Changelog

All notable changes to this app are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [1.0.0] — 2026-08-22

First version. Phase 1 solo features: map, memories, place detail, profile, auth.

### Auth
- Sign in with Google or Apple, guest mode (anonymous Firebase)
- Signing in from a guest session keeps the places and memories already saved
- Account deletion from Profile, including for guest accounts

### Map
- Mapbox map with place search (Mapbox Search Box API), quick category chips
- Quick Add for a place — photo, tags, rating, pin color, favorite/want-to-visit
- Callout cards for saved places, search results, and native map POIs
- Route directions (walking/driving/cycling) with a route card, step-by-step
  instructions, and sharing to Google Maps
- Weather at the current map location (widget + a dedicated detail screen)
- Profile menu and quick actions right from the map

### Place Detail
- Full place card: photo gallery, map, address/phone/website
- Editable name, description, tags, pin color, rating
- Favorite and Want to visit as independent flags
- Memory notes on a place: text, photos, mood, companions
- "Open on map" and "I was here" (visit tracking)

### Remembrance
- List/grid of saved places with sorting and filters (period, tags)
- "Memory of the day" widget, stats (total places, most visited, top month)
- Filter by favorite / want to visit

### Profile
- Editable name and avatar (photo or presets)
- Saved block: total places, want to visit, favorite
- Font size setting that composes with the system text-size setting
- What's New: tap the version row to see the release notes for every version
- Privacy Policy and Terms of Service, also linked from the sign-in screen

### Infrastructure
- Zustand + AsyncStorage: persisted stores for places, profile, settings
- Firebase Analytics + Crashlytics, global error handling
- Design system: tokens (colors, spacing, radii, typography), reusable components
  (PinButton, PinCard, PinTextField, PlaceFlags, and more)
- Mapbox and OpenStreetMap attribution on every surface showing map imagery
- Public Privacy Policy / Terms page generated from the same source the app renders
