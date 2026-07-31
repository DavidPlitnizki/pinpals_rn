import { findNearestStepIndex, haversineMeters } from '../geo';

describe('haversineMeters', () => {
  it('returns 0 for identical coordinates', () => {
    const point = { latitude: 55.75, longitude: 37.62 };
    expect(haversineMeters(point, point)).toBe(0);
  });

  it('returns a positive distance for distinct coordinates', () => {
    const a = { latitude: 55.75, longitude: 37.62 };
    const b = { latitude: 55.76, longitude: 37.64 };
    expect(haversineMeters(a, b)).toBeGreaterThan(0);
  });
});

describe('findNearestStepIndex', () => {
  const steps = [
    { maneuverLocation: { latitude: 0, longitude: 0 } },
    { maneuverLocation: { latitude: 1, longitude: 1 } },
    { maneuverLocation: { latitude: 2, longitude: 2 } },
  ];

  it('returns null for an empty steps list', () => {
    expect(findNearestStepIndex({ latitude: 0, longitude: 0 }, [])).toBeNull();
  });

  it('returns the index of the closest maneuver location', () => {
    expect(findNearestStepIndex({ latitude: 0.9, longitude: 0.9 }, steps)).toBe(1);
    expect(findNearestStepIndex({ latitude: 2.1, longitude: 2.1 }, steps)).toBe(2);
    expect(findNearestStepIndex({ latitude: -0.1, longitude: -0.1 }, steps)).toBe(0);
  });
});
