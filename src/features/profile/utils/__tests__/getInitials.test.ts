import { getInitials } from '../getInitials';

describe('getInitials (profile)', () => {
  it('returns one initial for a single word', () => {
    expect(getInitials('Maria')).toBe('M');
  });

  it('returns two initials for two words', () => {
    expect(getInitials('Ivan Petrov')).toBe('IP');
  });

  it('limits to two initials even with more words', () => {
    expect(getInitials('Ivan Petrov Sidorov')).toBe('IP');
  });

  it('uppercases initials', () => {
    expect(getInitials('ivan petrov')).toBe('IP');
  });

  it('returns empty string for empty input', () => {
    expect(getInitials('')).toBe('');
  });
});
