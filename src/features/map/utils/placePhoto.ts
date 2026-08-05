import { MOOD_CONFIG, Place, PlaceNote } from '../../../models/types';

export interface PlacePhotoPreview {
  photoUri: string;
  mood?: (typeof MOOD_CONFIG)[keyof typeof MOOD_CONFIG];
}

// Shared between MapMarkers (pin photo badge) and SearchSheet (list-row thumbnail) so both
// surfaces agree on which photo represents a place: the user-picked "main" photo (long-press
// in QuickAddPlaceSheet's gallery) if one was set and still exists among the place's notes,
// otherwise the first photo of its oldest note.
export function getPlacePhotoPreview(place: Place, notes: PlaceNote[]): PlacePhotoPreview | null {
  const placeNotes = notes
    .filter((n) => n.placeId === place.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (place.mainPhotoUri) {
    for (const note of placeNotes) {
      const uris = note.photoUris ?? (note.photoUri ? [note.photoUri] : []);
      if (uris.includes(place.mainPhotoUri)) {
        return { photoUri: place.mainPhotoUri, mood: note.mood ? MOOD_CONFIG[note.mood] : undefined };
      }
    }
  }

  for (const note of placeNotes) {
    const photoUri = note.photoUris?.[0] ?? note.photoUri;
    if (photoUri) {
      return { photoUri, mood: note.mood ? MOOD_CONFIG[note.mood] : undefined };
    }
  }
  return null;
}
