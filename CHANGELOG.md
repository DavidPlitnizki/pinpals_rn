# Changelog

All notable changes to this app are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Onboarding
- A five-step tour for a first run, driven by a persisted stage rather than a session
  cursor — it survives a cold start and picks up wherever it left off
- Points in turn at: pressing the map, saving a spot from the card, writing a memory on
  the place form, committing the form, and where the saved place ends up
- Skip on the first hint ends the whole tour; Finish on the last one closes it
- "Show the tour again" on Profile replays it from the beginning
- Signing out clears the stage, so whoever signs in next gets the tour like a fresh install

### Map
- A long press now opens the same three-action card a tap does — browser, directions,
  save — instead of dropping straight into the save form with no way back to the others
- A long press names the venue under your finger when the map knows one, and falls back to
  the street address; the card is on screen immediately and fills in as the lookup answers
- Reverse geocoding answers away from mapped street addresses — parks, beaches, open
  country — instead of leaving the sheet showing bare coordinates
- The "+" control is gone from the map's button cluster: a place is added where it belongs
  on the map, not at wherever the map happens to be centred

### Memories
- A memory can be written on the place form, before the place exists — note, photos, mood
  and companions. Saving the place saves both; backing out discards both
- The attached memory shows its own photos on the form rather than a count of them

### Fixes
- Map cards no longer clip their own contents. A card's address, phone and website arrive
  after it is on screen, and the card kept the height it animated in at — silently cutting
  the action buttons off the bottom
- Cards are capped at 80% of the screen, sit level with the map controls beside them, and
  no longer lose their shadow or their close and share buttons to their own rounded corners
- A slow lookup from an abandoned long press can no longer reopen a dismissed card or
  replace the card a later tap opened

### Accessibility
- The icon-only action buttons in every map callout are now labelled for screen readers

### Performance
- The map screen subscribes to the fields it reads instead of the whole places store —
  writing a memory no longer re-renders the entire map
- Reverse-geocode results are shared between the card and the form it opens, rather than
  bought from Mapbox twice for the same point

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
- What's New: tap the version row to see the release notes for every version
- Privacy Policy and Terms of Service, also linked from the sign-in screen

### Infrastructure
- Zustand + AsyncStorage: persisted stores for places, profile, settings
- Firebase Analytics + Crashlytics, global error handling
- Design system: tokens (colors, spacing, radii, typography), reusable components
  (PinButton, PinCard, PinTextField, PlaceFlags, and more)
- Mapbox and OpenStreetMap attribution on every surface showing map imagery
- Public Privacy Policy / Terms page generated from the same source the app renders
