import { usePlacesStore } from '../usePlacesStore';

// Reset store to a clean state before each test
beforeEach(() => {
  usePlacesStore.setState({ places: [], notes: [] });
});

// ─── helpers ───────────────────────────────────────────────────────────────

function makePlaceInput(overrides = {}) {
  return {
    name: 'Test Place',
    coordinates: { latitude: 55.75, longitude: 37.62 },
    category: 'coffee' as const,
    rating: 4,
    isFavorite: false,
    ...overrides,
  };
}

function makePlaceInStore(overrides = {}) {
  usePlacesStore.getState().addPlace(makePlaceInput(overrides));
  return usePlacesStore.getState().places[0];
}

// ─── addPlace ──────────────────────────────────────────────────────────────

describe('addPlace', () => {
  it('adds a place with generated id and createdAt', () => {
    usePlacesStore.getState().addPlace(makePlaceInput());
    const { places } = usePlacesStore.getState();
    expect(places).toHaveLength(1);
    expect(places[0].id).toBeTruthy();
    expect(places[0].createdAt).toBeTruthy();
  });

  it('initialises tags as empty array and visitCount as 0', () => {
    usePlacesStore.getState().addPlace(makePlaceInput());
    const place = usePlacesStore.getState().places[0];
    expect(place.tags).toEqual([]);
    expect(place.visitCount).toBe(0);
  });

  it('stores the supplied fields correctly', () => {
    usePlacesStore.getState().addPlace(makePlaceInput({ name: 'Кофейня', rating: 5 }));
    const place = usePlacesStore.getState().places[0];
    expect(place.name).toBe('Кофейня');
    expect(place.rating).toBe(5);
  });
});

// ─── updatePlace ───────────────────────────────────────────────────────────

describe('updatePlace', () => {
  it('updates only the specified fields', () => {
    const place = makePlaceInStore();
    usePlacesStore.getState().updatePlace(place.id, { name: 'Updated' });
    const updated = usePlacesStore.getState().places[0];
    expect(updated.name).toBe('Updated');
    expect(updated.rating).toBe(place.rating); // untouched
  });

  it('does not affect other places', () => {
    usePlacesStore.getState().addPlace(makePlaceInput({ name: 'A' }));
    usePlacesStore.getState().addPlace(makePlaceInput({ name: 'B' }));
    const idA = usePlacesStore.getState().places[0].id;
    usePlacesStore.getState().updatePlace(idA, { name: 'A-Updated' });
    const names = usePlacesStore.getState().places.map((p) => p.name);
    expect(names).toContain('A-Updated');
    expect(names).toContain('B');
  });
});

// ─── deletePlace ───────────────────────────────────────────────────────────

describe('deletePlace', () => {
  it('removes the place', () => {
    const place = makePlaceInStore();
    usePlacesStore.getState().deletePlace(place.id);
    expect(usePlacesStore.getState().places).toHaveLength(0);
  });

  it('also removes notes belonging to the deleted place', () => {
    const place = makePlaceInStore();
    usePlacesStore.getState().addNote({
      placeId: place.id,
      text: 'Note',
      companions: [],
    });
    expect(usePlacesStore.getState().notes).toHaveLength(1);
    usePlacesStore.getState().deletePlace(place.id);
    expect(usePlacesStore.getState().notes).toHaveLength(0);
  });

  it('does not remove notes for other places', () => {
    usePlacesStore.getState().addPlace(makePlaceInput({ name: 'A' }));
    usePlacesStore.getState().addPlace(makePlaceInput({ name: 'B' }));
    const [a, b] = usePlacesStore.getState().places;
    usePlacesStore.getState().addNote({ placeId: a.id, text: 'note-a', companions: [] });
    usePlacesStore.getState().addNote({ placeId: b.id, text: 'note-b', companions: [] });
    usePlacesStore.getState().deletePlace(a.id);
    const remaining = usePlacesStore.getState().notes;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].placeId).toBe(b.id);
  });
});

// ─── toggleFavorite ────────────────────────────────────────────────────────

describe('toggleFavorite', () => {
  it('flips isFavorite from false to true', () => {
    const place = makePlaceInStore({ isFavorite: false });
    usePlacesStore.getState().toggleFavorite(place.id);
    expect(usePlacesStore.getState().places[0].isFavorite).toBe(true);
  });

  it('flips isFavorite from true to false', () => {
    const place = makePlaceInStore({ isFavorite: true });
    usePlacesStore.getState().toggleFavorite(place.id);
    expect(usePlacesStore.getState().places[0].isFavorite).toBe(false);
  });
});

// ─── addNote ───────────────────────────────────────────────────────────────

describe('addNote', () => {
  it('adds a note with generated id', () => {
    const place = makePlaceInStore();
    usePlacesStore.getState().addNote({ placeId: place.id, text: 'Hi', companions: [] });
    const notes = usePlacesStore.getState().notes;
    expect(notes).toHaveLength(1);
    expect(notes[0].id).toBeTruthy();
  });

  it('increments visitCount on the parent place', () => {
    const place = makePlaceInStore();
    expect(place.visitCount).toBe(0);
    usePlacesStore.getState().addNote({ placeId: place.id, text: 'visit', companions: [] });
    const updated = usePlacesStore.getState().places.find((p) => p.id === place.id)!;
    expect(updated.visitCount).toBe(1);
  });

  it('sets lastVisited on the parent place', () => {
    const place = makePlaceInStore();
    expect(place.lastVisited).toBeUndefined();
    usePlacesStore.getState().addNote({ placeId: place.id, text: 'visit', companions: [] });
    const updated = usePlacesStore.getState().places.find((p) => p.id === place.id)!;
    expect(updated.lastVisited).toBeTruthy();
  });

  it('uses supplied createdAt when provided', () => {
    const place = makePlaceInStore();
    const customDate = '2024-01-01T12:00:00.000Z';
    usePlacesStore.getState().addNote({
      placeId: place.id,
      text: 'retroactive',
      companions: [],
      createdAt: customDate,
    });
    expect(usePlacesStore.getState().notes[0].createdAt).toBe(customDate);
  });
});

// ─── deleteNote ────────────────────────────────────────────────────────────

describe('deleteNote', () => {
  it('removes the note by id', () => {
    const place = makePlaceInStore();
    usePlacesStore.getState().addNote({ placeId: place.id, text: 'note', companions: [] });
    const noteId = usePlacesStore.getState().notes[0].id;
    usePlacesStore.getState().deleteNote(noteId);
    expect(usePlacesStore.getState().notes).toHaveLength(0);
  });
});

// ─── getNotesForPlace ──────────────────────────────────────────────────────

describe('getNotesForPlace', () => {
  it('returns only notes for the given place', () => {
    usePlacesStore.getState().addPlace(makePlaceInput({ name: 'A' }));
    usePlacesStore.getState().addPlace(makePlaceInput({ name: 'B' }));
    const [a, b] = usePlacesStore.getState().places;
    usePlacesStore.getState().addNote({ placeId: a.id, text: 'note-a', companions: [] });
    usePlacesStore.getState().addNote({ placeId: b.id, text: 'note-b', companions: [] });
    const notes = usePlacesStore.getState().getNotesForPlace(a.id);
    expect(notes).toHaveLength(1);
    expect(notes[0].text).toBe('note-a');
  });
});

// ─── tags ──────────────────────────────────────────────────────────────────

describe('addTagToPlace / removeTagFromPlace', () => {
  it('addTagToPlace appends a new tag', () => {
    const place = makePlaceInStore();
    usePlacesStore.getState().addTagToPlace(place.id, 'уютно');
    expect(usePlacesStore.getState().places[0].tags).toContain('уютно');
  });

  it('addTagToPlace does not add duplicate tags', () => {
    const place = makePlaceInStore();
    usePlacesStore.getState().addTagToPlace(place.id, 'уютно');
    usePlacesStore.getState().addTagToPlace(place.id, 'уютно');
    expect(usePlacesStore.getState().places[0].tags).toHaveLength(1);
  });

  it('removeTagFromPlace removes the tag', () => {
    const place = makePlaceInStore();
    usePlacesStore.getState().addTagToPlace(place.id, 'тихо');
    usePlacesStore.getState().removeTagFromPlace(place.id, 'тихо');
    expect(usePlacesStore.getState().places[0].tags).toHaveLength(0);
  });

  it('removeTagFromPlace is a no-op for non-existent tag', () => {
    const place = makePlaceInStore();
    usePlacesStore.getState().addTagToPlace(place.id, 'тихо');
    usePlacesStore.getState().removeTagFromPlace(place.id, 'громко');
    expect(usePlacesStore.getState().places[0].tags).toEqual(['тихо']);
  });
});

// ─── recordVisit ───────────────────────────────────────────────────────────

describe('recordVisit', () => {
  it('increments visitCount', () => {
    const place = makePlaceInStore();
    usePlacesStore.getState().recordVisit(place.id);
    expect(usePlacesStore.getState().places[0].visitCount).toBe(1);
  });

  it('updates lastVisited', () => {
    const place = makePlaceInStore();
    usePlacesStore.getState().recordVisit(place.id);
    expect(usePlacesStore.getState().places[0].lastVisited).toBeTruthy();
  });
});

// ─── getLatestMoodForPlace ─────────────────────────────────────────────────

describe('getLatestMoodForPlace', () => {
  it('returns undefined when place has no notes', () => {
    const place = makePlaceInStore();
    expect(usePlacesStore.getState().getLatestMoodForPlace(place.id)).toBeUndefined();
  });

  it('returns undefined when notes have no mood', () => {
    const place = makePlaceInStore();
    usePlacesStore.getState().addNote({ placeId: place.id, text: 'no mood', companions: [] });
    expect(usePlacesStore.getState().getLatestMoodForPlace(place.id)).toBeUndefined();
  });

  it('returns the mood of the only note with a mood', () => {
    const place = makePlaceInStore();
    usePlacesStore.getState().addNote({
      placeId: place.id,
      text: 'happy',
      companions: [],
      mood: 'happy',
      createdAt: '2024-06-01T10:00:00.000Z',
    });
    expect(usePlacesStore.getState().getLatestMoodForPlace(place.id)).toBe('happy');
  });

  it('returns the mood of the most recent note', () => {
    const place = makePlaceInStore();
    usePlacesStore.getState().addNote({
      placeId: place.id,
      text: 'older',
      companions: [],
      mood: 'calm',
      createdAt: '2024-01-01T10:00:00.000Z',
    });
    usePlacesStore.getState().addNote({
      placeId: place.id,
      text: 'newer',
      companions: [],
      mood: 'excited',
      createdAt: '2024-06-01T10:00:00.000Z',
    });
    expect(usePlacesStore.getState().getLatestMoodForPlace(place.id)).toBe('excited');
  });
});
