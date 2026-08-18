import { Meeting } from '../../models/types';
import { useMeetingsStore } from '../useMeetingsStore';

beforeEach(() => {
  useMeetingsStore.setState({ meetings: [] });
});

let nextId = 0;

function makeMeeting(overrides: Partial<Meeting> = {}): Meeting {
  nextId += 1;
  return {
    id: `meeting-${nextId}`,
    title: 'Team lunch',
    coordinates: { latitude: 55.75, longitude: 37.62 },
    date: new Date('2025-09-01T12:00:00.000Z').toISOString(),
    createdAt: new Date('2025-08-01T12:00:00.000Z').toISOString(),
    status: 'draft',
    proposedPlaceIds: [],
    participants: [],
    ...overrides,
  };
}

function seedMeetings(...meetings: Meeting[]) {
  useMeetingsStore.setState({ meetings });
}

// ─── updateMeeting ─────────────────────────────────────────────────────────

describe('updateMeeting', () => {
  it('updates only the specified fields', () => {
    const meeting = makeMeeting();
    seedMeetings(meeting);
    useMeetingsStore.getState().updateMeeting(meeting.id, { title: 'Updated lunch' });
    const m = useMeetingsStore.getState().meetings[0];
    expect(m.title).toBe('Updated lunch');
    expect(m.status).toBe('draft'); // untouched
  });

  it('does not affect other meetings', () => {
    const meetingA = makeMeeting({ title: 'A' });
    const meetingB = makeMeeting({ title: 'B' });
    seedMeetings(meetingA, meetingB);
    useMeetingsStore.getState().updateMeeting(meetingA.id, { title: 'A-updated' });
    const titles = useMeetingsStore.getState().meetings.map((m) => m.title);
    expect(titles).toContain('A-updated');
    expect(titles).toContain('B');
  });
});

// ─── updateMeetingStatus ───────────────────────────────────────────────────

describe('updateMeetingStatus', () => {
  it('changes status to proposed', () => {
    const meeting = makeMeeting();
    seedMeetings(meeting);
    useMeetingsStore.getState().updateMeetingStatus(meeting.id, 'proposed');
    expect(useMeetingsStore.getState().meetings[0].status).toBe('proposed');
  });

  it('changes status to confirmed', () => {
    const meeting = makeMeeting();
    seedMeetings(meeting);
    useMeetingsStore.getState().updateMeetingStatus(meeting.id, 'confirmed');
    expect(useMeetingsStore.getState().meetings[0].status).toBe('confirmed');
  });

  it('changes status to done', () => {
    const meeting = makeMeeting();
    seedMeetings(meeting);
    useMeetingsStore.getState().updateMeetingStatus(meeting.id, 'done');
    expect(useMeetingsStore.getState().meetings[0].status).toBe('done');
  });
});

// ─── deleteMeeting ─────────────────────────────────────────────────────────

describe('deleteMeeting', () => {
  it('removes the meeting', () => {
    const meeting = makeMeeting();
    seedMeetings(meeting);
    useMeetingsStore.getState().deleteMeeting(meeting.id);
    expect(useMeetingsStore.getState().meetings).toHaveLength(0);
  });

  it('does not remove other meetings', () => {
    const meetingA = makeMeeting({ title: 'A' });
    const meetingB = makeMeeting({ title: 'B' });
    seedMeetings(meetingA, meetingB);
    useMeetingsStore.getState().deleteMeeting(meetingA.id);
    expect(useMeetingsStore.getState().meetings).toHaveLength(1);
    expect(useMeetingsStore.getState().meetings[0].title).toBe('B');
  });
});
