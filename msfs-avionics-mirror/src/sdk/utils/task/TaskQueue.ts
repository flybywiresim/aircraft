/** A task. */
export type Task = () => void;

/**
 * A task queue.
 */
export interface TaskQueue {
  /**
   * Checks whether this queue has more tasks.
   * @returns whether this queue has more tasks.
   */
  hasNext(): boolean;

  /**
   * Gets the next task in this queue.
   * @returns the next task in this queue.
   * @throws when the queue is empty.
   */
  next(): Task;
}

/**
 * A task queue backed by an array.
 */
export class ArrayTaskQueue {
  private head = 0;

  /**
   * Constructor.
   * @param tasks The array of tasks in this queue.
   */
  constructor(private readonly tasks: Task[]) {
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public hasNext(): boolean {
    return this.head < this.tasks.length;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public next(): Task {
    return this.tasks[this.head++];
  }
}