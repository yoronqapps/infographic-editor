export interface CommandHistory<T> {
  push(snapshot: T): void;
  undo(): T | undefined;
  redo(): T | undefined;
  current(): T;
  canUndo(): boolean;
  canRedo(): boolean;
  snapshots(): T[];
}

export const createCommandHistory = <T>(initial: T): CommandHistory<T> => {
  let states = [initial];
  let index = 0;

  return {
    push(snapshot) {
      states = [...states.slice(0, index + 1), snapshot];
      index = states.length - 1;
    },
    undo() {
      if (index === 0) return undefined;
      index -= 1;
      return states[index];
    },
    redo() {
      if (index >= states.length - 1) return undefined;
      index += 1;
      return states[index];
    },
    current: () => states[index],
    canUndo: () => index > 0,
    canRedo: () => index < states.length - 1,
    snapshots: () => [...states],
  };
};
