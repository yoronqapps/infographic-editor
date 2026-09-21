import { describe, expect, it } from 'vitest';
import { calculateFitZoom, clampZoom } from './canvasViewport';

describe('canvas viewport calculations', () => {
  it('clamps zoom to the supported range', () => {
    expect(clampZoom(0.1)).toBe(0.25);
    expect(clampZoom(1.25)).toBe(1.25);
    expect(clampZoom(4)).toBe(2);
  });

  it('calculates fit width and height independently', () => {
    expect(calculateFitZoom('width', 600, 800, 900, 700)).toBe(1);
    expect(calculateFitZoom('height', 600, 800, 900, 700)).toBeCloseTo(0.875);
  });

  it('fits the full page without exceeding 100 percent', () => {
    expect(calculateFitZoom('page', 600, 800, 900, 700)).toBeCloseTo(0.875);
  });
});
