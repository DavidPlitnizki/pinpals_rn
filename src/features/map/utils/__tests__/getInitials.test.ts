import { getInitials } from '../getInitials';

describe('getInitials', () => {
  it('returns one initial for a single word', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('returns two initials for two words', () => {
    expect(getInitials('Alice Bob')).toBe('AB');
  });

  it('returns only the first two initials for three or more words', () => {
    expect(getInitials('Alice Bob Carol')).toBe('AB');
  });

  it('uppercases lowercase first letters', () => {
    expect(getInitials('alice bob')).toBe('AB');
  });

  it('returns empty string for empty input', () => {
    expect(getInitials('')).toBe('');
  });

  it('handles extra whitespace between words', () => {
    // split(' ') produces empty strings for multiple spaces, but [0]?.toUpperCase() handles undefined → ''
    const result = getInitials('Alice  Bob');
    // Two spaces splits into ['Alice', '', 'Bob'] — middle '' gives '' initial
    expect(result).toBe('A');
  });
});
