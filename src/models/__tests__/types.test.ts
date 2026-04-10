import { MOOD_CONFIG, MEMORY_MOODS, MemoryMood } from '../types';

describe('MEMORY_MOODS', () => {
  it('contains 7 moods', () => {
    expect(MEMORY_MOODS).toHaveLength(7);
  });

  it('contains all expected mood values', () => {
    const expected: MemoryMood[] = [
      'calm',
      'happy',
      'nostalgic',
      'excited',
      'peaceful',
      'melancholic',
      'adventurous',
    ];
    expect(MEMORY_MOODS).toEqual(expect.arrayContaining(expected));
  });

  it('has no duplicate values', () => {
    expect(new Set(MEMORY_MOODS).size).toBe(MEMORY_MOODS.length);
  });
});

describe('MOOD_CONFIG', () => {
  it('has an entry for every mood in MEMORY_MOODS', () => {
    for (const mood of MEMORY_MOODS) {
      expect(MOOD_CONFIG).toHaveProperty(mood);
    }
  });

  it('each entry has emoji, color, and label', () => {
    for (const mood of MEMORY_MOODS) {
      const config = MOOD_CONFIG[mood];
      expect(typeof config.emoji).toBe('string');
      expect(config.emoji.length).toBeGreaterThan(0);
      expect(config.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(typeof config.label).toBe('string');
      expect(config.label.length).toBeGreaterThan(0);
    }
  });

  it('all colors are unique', () => {
    const colors = MEMORY_MOODS.map((m) => MOOD_CONFIG[m].color);
    expect(new Set(colors).size).toBe(colors.length);
  });
});
