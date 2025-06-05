// Copyright (c) 2021-2023, 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/**
 * Utility class to throttle instrument updates
 */
export class UpdateThrottler {
  private currentTime = 0;
  private lastUpdateTime = 0;

  // Take a random offset to space out updates from different instruments among different
  // frames as much as possible.
  private refreshOffset = Math.floor(Math.random() * this.intervalMs);
  private refreshNumber = 0;

  /**
   * @param {number} intervalMs Interval between updates, in milliseconds
   */
  constructor(private readonly intervalMs: number) {}

  /**
   * Checks whether the instrument should be updated in the current frame according to the
   * configured update interval.
   *
   * @param deltaTime
   * @param forceUpdate True if you want to force an update during this frame.
   * @returns -1 if the instrument should not update, or the time elapsed since the last
   *          update in milliseconds
   */
  canUpdate(deltaTime: number, forceUpdate = false): number {
    this.currentTime += deltaTime;
    const number = Math.floor((this.currentTime + this.refreshOffset) / this.intervalMs);
    const update = number > this.refreshNumber;
    this.refreshNumber = number;
    if (update || forceUpdate) {
      const accumulatedDelta = this.currentTime - this.lastUpdateTime;
      this.lastUpdateTime = this.currentTime;
      return accumulatedDelta;
    } else {
      return -1;
    }
  }
}
