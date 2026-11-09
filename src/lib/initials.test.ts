import { describe, expect, it } from 'vitest';
import { initials } from './initials';

describe('initials', () => {
  it('uses the first and last word', () => {
    expect(initials('Raka Pratama')).toBe('RP');
    expect(initials('raka dewi pratama')).toBe('RP');
  });

  it('falls back to the first two letters of a single word', () => {
    expect(initials('Raka')).toBe('RA');
  });

  it('handles empty and whitespace-only names', () => {
    expect(initials('')).toBe('?');
    expect(initials('   ')).toBe('?');
  });
});
