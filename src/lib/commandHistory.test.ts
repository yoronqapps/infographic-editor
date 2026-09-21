import { describe, expect, it } from 'vitest';
import { createCommandHistory } from './commandHistory';

describe('command history', () => {
  it('tracks undo and redo availability around snapshots', () => {
    const history = createCommandHistory('empty');
    history.push('one');
    history.push('two');

    expect(history.canUndo()).toBe(true);
    expect(history.undo()).toBe('one');
    expect(history.redo()).toBe('two');
  });

  it('drops redo states after a new command', () => {
    const history = createCommandHistory('empty');
    history.push('one');
    history.push('two');
    history.undo();
    history.push('replacement');

    expect(history.canRedo()).toBe(false);
    expect(history.current()).toBe('replacement');
  });

  it('does not mutate the stored snapshot array when returned', () => {
    const history = createCommandHistory({ value: 1 });
    const snapshots = history.snapshots();
    snapshots.push({ value: 2 });

    expect(history.snapshots()).toEqual([{ value: 1 }]);
  });
});
