import { describe, expect, it } from 'vitest';
import { deriveKeyPrefix, uniqueKey } from './keys';

describe('deriveKeyPrefix', () => {
  it('uses word initials, capped at four characters', () => {
    expect(deriveKeyPrefix('Data Warehouse Platform')).toBe('DWP');
    expect(deriveKeyPrefix('Personal Finance Review')).toBe('PFR');
    expect(deriveKeyPrefix('Reading: Designing Data-Intensive Applications')).toBe('RDDI');
    expect(deriveKeyPrefix('One Two Three Four Five')).toBe('OTTF');
  });

  it('ignores numeric-only words such as years', () => {
    expect(deriveKeyPrefix('Family Gathering 2026')).toBe('FG');
  });

  it('falls back to the first letters of a single word', () => {
    expect(deriveKeyPrefix('Go')).toBe('GO');
    expect(deriveKeyPrefix('Warehouse')).toBe('WAR');
  });

  it('falls back to SB for unusable names', () => {
    expect(deriveKeyPrefix('2026')).toBe('SB');
    expect(deriveKeyPrefix('   ')).toBe('SB');
  });
});

describe('uniqueKey', () => {
  it('returns the base key when free', () => {
    expect(uniqueKey('DWP', new Set())).toBe('DWP');
  });

  it('appends the next free number on collision', () => {
    expect(uniqueKey('DWP', new Set(['DWP']))).toBe('DWP2');
    expect(uniqueKey('DWP', new Set(['DWP', 'DWP2']))).toBe('DWP3');
  });
});
