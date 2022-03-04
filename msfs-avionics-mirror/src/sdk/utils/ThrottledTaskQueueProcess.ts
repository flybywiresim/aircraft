import { TaskQueue } from './TaskQueue';

/**
 * A handler which defines the behavior of a ThrottledTaskQueueProcess.
 */
export interface ThrottledTaskQueueHandler {
  /**
   * This method is called when queue processing is started.
   */
  onStarted(): void;

  /**
   * Checks if queue processing can continue in the current frame. If this method returns false, queue processing will
   * pause in the current frame and resume in the next frame via requestAnimationFrame().
   * @param elapsedFrameCount The number of frames elapsed since queue processing started. Equal to 0 on the first
   * frame, 1 on the second, etc.
   * @param dispatchedTaskCount The number of tasks already dispatched in the current frame.
   * @param timeElapsed The time elapsed so far in the current frame, in milliseconds.
   * @returns whether queue processing can continue in the current frame.
   */
  canContinue(elapsedFrameCount: number, dispatchedTaskCount: number, timeElapsed: number): boolean;

  /**
   * This method is called when queue processing is paused.
   * @param elapsedFrameCount The number of frames elapsed since queue processing started. Equal to 0 on the first
   * frame, 1 on the second, etc.
   */
  onPaused(elapsedFrameCount: number): void;

  /**
   * This method is called when queue processing is finished.
   * @param elapsedFrameCount The number of frames elpased since queue processing started. Equal to 0 on the first
   * frame, 1 on the second, etc.
   */
  onFinished(elapsedFrameCount: number): void;

  /**
   * This method is called when queue processing is aborted.
   */
  onAborted(): void;
}

/**
 * A process which dispatches tasks in a task queue potentially over multiple frames.
 */
export class ThrottledTaskQueueProcess {
  private _hasStarted = false;
  private _hasEnded = false;
  private _shouldAbort = false;

  /**
   * Constructor.
   * @param queue The queue to process.
   * @param handler A handler which defines the behavior of this process.
   */
  constructor(private readonly queue: TaskQueue, private readonly handler: ThrottledTaskQueueHandler) {
  }

  /**
   * Checks whether this process has been started.
   * @returns whether this process has been started.
   */
  public hasStarted(): boolean {
    return this._hasStarted;
  }

  /**
   * Checks whether this process has ended.
   * @returns whether this process has ended.
   */
  public hasEnded(): boolean {
    return this._hasEnded;
  }

  /**
   * Starts this process.
   */
  public start(): void {
    this._hasStarted = true;
    this.processQueue(0);
  }

  /**
   * Processes the queue.
   * @param elapsedFrameCount The number of frames elapsed since queue processing started.
   */
  private processQueue(elapsedFrameCount: number): void {
    let dispatchCount = 0;
    const t0 = performance.now();
    while (!this._shouldAbort && this.queue.hasNext()) {
      if (this.handler.canContinue(elapsedFrameCount, dispatchCount, performance.now() - t0)) {
        const task = this.queue.next();
        task();
        dispatchCount++;
      } else {
        break;
      }
    }

    if (this._shouldAbort) {
      return;
    }

    if (!this.queue.hasNext()) {
      this.handler.onFinished(elapsedFrameCount);
      this._hasEnded = true;
    } else {
      this.handler.onPaused(elapsedFrameCount);
      requestAnimationFrame(this.processQueue.bind(this, elapsedFrameCount + 1));
    }
  }

  /**
   * Aborts this process. Has no effect if the process has not been started or if it has already ended.
   */
  public abort(): void {
    if (this._hasStarted && !this._hasEnded) {
      this.handler.onAborted();
      this._shouldAbort = true;
      this._hasEnded = true;
    }
  }
}