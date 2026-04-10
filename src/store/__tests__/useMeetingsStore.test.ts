import { useMeetingsStore } from '../useMeetingsStore';

beforeEach(() => {
  useMeetingsStore.setState({ meetings: [] });
});

function makeMeetingInput(overrides = {}) {
  return {
    title: 'Team lunch',
    coordinates: { latitude: 55.75, longitude: 37.62 },
    date: new Date('2025-09-01T12:00:00.000Z').toISOString(),
    ...overrides,
  };
}

// ─── addMeeting ────────────────────────────────────────────────────────────

describe('addMeeting', () => {
  it('adds a meeting with generated id and createdAt', () => {
    useMeetingsStore.getState().addMeeting(makeMeetingInput());
    const { meetings } = useMeetingsStore.getState();
    expect(meetings).toHaveLength(1);
    expect(meetings[0].id).toBeTruthy();
    expect(meetings[0].createdAt).toBeTruthy();
  });

  it('defaults status to "draft"', () => {
    useMeetingsStore.getState().addMeeting(makeMeetingInput());
    expect(useMeetingsStore.getState().meetings[0].status).toBe('draft');
  });

  it('defaults proposedPlaceIds and participants to empty arrays', () => {
    useMeetingsStore.getState().addMeeting(makeMeetingInput());
    const m = useMeetingsStore.getState().meetings[0];
    expect(m.proposedPlaceIds).toEqual([]);
    expect(m.participants).toEqual([]);
  });

  it('stores supplied fields correctly', () => {
    useMeetingsStore.getState().addMeeting(makeMeetingInput({ title: 'Coffee run' }));
    expect(useMeetingsStore.getState().meetings[0].title).toBe('Coffee run');
  });
});

// ─── updateMeeting ─────────────────────────────────────────────────────────

describe('updateMeeting', () => {
  it('updates only the specified fields', () => {
    useMeetingsStore.getState().addMeeting(makeMeetingInput());
    const id = useMeetingsStore.getState().meetings[0].id;
    useMeetingsStore.getState().updateMeeting(id, { title: 'Updated lunch' });
    const m = useMeetingsStore.getState().meetings[0];
    expect(m.title).toBe('Updated lunch');
    expect(m.status).toBe('draft'); // untouched
  });

  it('does not affect other meetings', () => {
    useMeetingsStore.getState().addMeeting(makeMeetingInput({ title: 'A' }));
    useMeetingsStore.getState().addMeeting(makeMeetingInput({ title: 'B' }));
    const idA = useMeetingsStore.getState().meetings[0].id;
    useMeetingsStore.getState().updateMeeting(idA, { title: 'A-updated' });
    const titles = useMeetingsStore.getState().meetings.map((m) => m.title);
    expect(titles).toContain('A-updated');
    expect(titles).toContain('B');
  });
});

// ─── updateMeetingStatus ───────────────────────────────────────────────────

describe('updateMeetingStatus', () => {
  it('changes status to proposed', () => {
    useMeetingsStore.getState().addMeeting(makeMeetingInput());
    const id = useMeetingsStore.getState().meetings[0].id;
    useMeetingsStore.getState().updateMeetingStatus(id, 'proposed');
    expect(useMeetingsStore.getState().meetings[0].status).toBe('proposed');
  });

  it('changes status to confirmed', () => {
    useMeetingsStore.getState().addMeeting(makeMeetingInput());
    const id = useMeetingsStore.getState().meetings[0].id;
    useMeetingsStore.getState().updateMeetingStatus(id, 'confirmed');
    expect(useMeetingsStore.getState().meetings[0].status).toBe('confirmed');
  });

  it('changes status to done', () => {
    useMeetingsStore.getState().addMeeting(makeMeetingInput());
    const id = useMeetingsStore.getState().meetings[0].id;
    useMeetingsStore.getState().updateMeetingStatus(id, 'done');
    expect(useMeetingsStore.getState().meetings[0].status).toBe('done');
  });
});

// ─── deleteMeeting ─────────────────────────────────────────────────────────

describe('deleteMeeting', () => {
  it('removes the meeting', () => {
    useMeetingsStore.getState().addMeeting(makeMeetingInput());
    const id = useMeetingsStore.getState().meetings[0].id;
    useMeetingsStore.getState().deleteMeeting(id);
    expect(useMeetingsStore.getState().meetings).toHaveLength(0);
  });

  it('does not remove other meetings', () => {
    useMeetingsStore.getState().addMeeting(makeMeetingInput({ title: 'A' }));
    useMeetingsStore.getState().addMeeting(makeMeetingInput({ title: 'B' }));
    const idA = useMeetingsStore.getState().meetings[0].id;
    useMeetingsStore.getState().deleteMeeting(idA);
    expect(useMeetingsStore.getState().meetings).toHaveLength(1);
    expect(useMeetingsStore.getState().meetings[0].title).toBe('B');
  });
});
