import { describe, it, expect } from 'vitest';
import { formatTime } from '../useTimer';

describe('formatTime', () => {
  it('0초 → 00:00', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('59초 → 00:59', () => {
    expect(formatTime(59)).toBe('00:59');
  });

  it('60초 → 01:00', () => {
    expect(formatTime(60)).toBe('01:00');
  });

  it('90초 → 01:30', () => {
    expect(formatTime(90)).toBe('01:30');
  });

  it('3600초 → 60:00', () => {
    expect(formatTime(3600)).toBe('60:00');
  });

  it('3661초 → 61:01', () => {
    expect(formatTime(3661)).toBe('61:01');
  });
});
