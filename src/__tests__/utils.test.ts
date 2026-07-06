import { describe, it, expect } from 'vitest';
import { calculateElo, getTier } from '@/lib/utils';

describe('calculateElo', () => {
  it('should increase rating on win against equal opponent', () => {
    const newRating = calculateElo(1200, 1200, 1);
    expect(newRating).toBe(1216);
  });

  it('should decrease rating on loss against equal opponent', () => {
    const newRating = calculateElo(1200, 1200, 0);
    expect(newRating).toBe(1184);
  });

  it('should increase more when beating higher-rated opponent', () => {
    const newRating = calculateElo(1200, 1400, 1);
    expect(newRating).toBeGreaterThan(1216);
  });

  it('should lose less when losing to higher-rated opponent', () => {
    const newRating = calculateElo(1200, 1400, 0);
    expect(newRating).toBeGreaterThan(1184);
  });

  it('should produce draw result correctly', () => {
    const newRating = calculateElo(1200, 1200, 0.5);
    expect(newRating).toBe(1200);
  });
});

describe('getTier', () => {
  it('should return Beginner for rating below 800', () => {
    expect(getTier(500)).toBe('Beginner');
    expect(getTier(799)).toBe('Beginner');
  });

  it('should return Learner for rating 800-1199', () => {
    expect(getTier(800)).toBe('Learner');
    expect(getTier(1199)).toBe('Learner');
  });

  it('should return Intermediate for rating 1200-1599', () => {
    expect(getTier(1200)).toBe('Intermediate');
    expect(getTier(1599)).toBe('Intermediate');
  });

  it('should return Advanced for rating 1600-1999', () => {
    expect(getTier(1600)).toBe('Advanced');
    expect(getTier(1999)).toBe('Advanced');
  });

  it('should return Expert for rating 2000-2399', () => {
    expect(getTier(2000)).toBe('Expert');
    expect(getTier(2399)).toBe('Expert');
  });

  it('should return Master for rating 2400+', () => {
    expect(getTier(2400)).toBe('Master');
    expect(getTier(3000)).toBe('Master');
  });
});
