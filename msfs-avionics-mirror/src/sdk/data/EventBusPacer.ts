/** A noop interface for global type guards */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EventTypes { }

/**
 * A generic class for injecting pacing logic into a publisher.
 */
export interface PublishPacer<E extends EventTypes> {
  canPublish<K extends keyof E>(topic: K, data: E[K]): boolean;
}

/**
 * A PublishPacer that only allows publishing on an interval.
 */
export class IntervalPacer<E> {
  private interval: number;
  private lastPublished = new Map<keyof E, number>();

  /**
   * Create an IntervalPacer.
   * @param msec Time to wait between publishs in ms
   */
  constructor(msec: number) {
    this.interval = msec;
  }

  /**
   * Determine whether the data can be published based on the time since its
   * prior publish.
   * @param topic The topic data would be sent on.
   * @param data The data which would be sent.
   * @returns A bool indicating if the data should be published.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public canPublish<K extends keyof E>(topic: keyof E, data: E[K]): boolean {
    const prior = this.lastPublished.get(topic);
    const now = Date.now();
    if (prior && now - prior < this.interval) {
      return false;
    }
    this.lastPublished.set(topic, now);
    return true;
  }
}

/**
 * A PublishPacer that only allows publishing when a value has changed
 * by a specifed amount from the prior publish.
 */
export class DeltaPacer<E> {
  private delta: number;
  private lastPublished = new Map<keyof E, number>();

  /**
   * Create a DeltaPacer.
   * @param delta The difference required for publishing to be allowed.
   */
  constructor(delta: number) {
    this.delta = delta;
  }

  /**
   * Determine whether the data can be published based on its delta from the
   * pror publish.
   * @param topic The topic data would be sent on.
   * @param data The data which would be sent.
   * @returns A bool indicating if the data should be published.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public canPublish<K extends keyof E>(topic: keyof E, data: number): boolean {
    const prior = this.lastPublished.get(topic);
    if (prior && Math.abs(data - prior) < this.delta) {
      return false;
    }
    this.lastPublished.set(topic, data);
    return true;
  }
}