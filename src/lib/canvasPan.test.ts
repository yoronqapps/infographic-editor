import { describe, expect, it } from 'vitest';
import { shouldStartCanvasPan } from './canvasPan';

describe('shouldStartCanvasPan', () => {
  it('starts panning for a middle-mouse gesture in any mode', () => {
    expect(shouldStartCanvasPan(1, false)).toBe(true);
  });

  it('starts panning for a left-mouse gesture when pan mode is enabled', () => {
    expect(shouldStartCanvasPan(0, true)).toBe(true);
  });

  it('keeps ordinary left-click available for selection', () => {
    expect(shouldStartCanvasPan(0, false)).toBe(false);
  });
});
