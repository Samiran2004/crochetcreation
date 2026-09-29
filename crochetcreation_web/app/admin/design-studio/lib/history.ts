import type { FabricCanvas } from './engine';

/**
 * Snapshot-based undo.
 *
 * A command/inverse-command stack is leaner in memory, but it has to model
 * every mutation the editor can make — and fabric surfaces mutations from
 * dozens of places (drag, scale, in-place text editing, filter application,
 * z-order). Serializing the scene after each committed change is a few
 * hundred KB per step at worst and is correct by construction.
 */
export class History {
  private past: string[] = [];
  private future: string[] = [];
  private readonly limit: number;
  /** Set while a snapshot is being restored, so the restore is not recorded. */
  private suspended = false;

  constructor(limit = 60) {
    this.limit = limit;
  }

  get canUndo(): boolean {
    return this.past.length > 1;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  get isSuspended(): boolean {
    return this.suspended;
  }

  /** Seed the stack with the opening state, so the first undo has a target. */
  reset(snapshot: string): void {
    this.past = [snapshot];
    this.future = [];
  }

  record(snapshot: string): void {
    if (this.suspended) return;
    if (this.past[this.past.length - 1] === snapshot) return;

    this.past.push(snapshot);
    this.future = [];
    if (this.past.length > this.limit) this.past.shift();
  }

  undo(): string | null {
    if (!this.canUndo) return null;
    const current = this.past.pop();
    if (current !== undefined) this.future.push(current);
    return this.past[this.past.length - 1] ?? null;
  }

  redo(): string | null {
    if (!this.canRedo) return null;
    const next = this.future.pop();
    if (next === undefined) return null;
    this.past.push(next);
    return next;
  }

  /** Run a restore without the resulting fabric events polluting the stack. */
  async duringRestore(task: () => Promise<void>): Promise<void> {
    this.suspended = true;
    try {
      await task();
    } finally {
      this.suspended = false;
    }
  }

  current(): string | null {
    return this.past[this.past.length - 1] ?? null;
  }
}

export const snapshot = (canvas: FabricCanvas): string =>
  JSON.stringify(canvas.toObject());
