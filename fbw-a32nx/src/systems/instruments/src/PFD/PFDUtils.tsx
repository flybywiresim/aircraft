// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

export const calculateHorizonOffsetFromPitch = (pitch: number) => {
  if (pitch > -5 && pitch <= 20) {
    return pitch * 1.8;
  }
  if (pitch > 20 && pitch <= 30) {
    return -0.04 * pitch ** 2 + 3.4 * pitch - 16;
  }
  if (pitch > 30) {
    return 20 + pitch;
  }
  if (pitch < -5 && pitch >= -15) {
    return 0.04 * pitch ** 2 + 2.2 * pitch + 1;
  }
  return pitch - 8;
};

export const calculateVerticalOffsetFromRoll = (roll: number) => {
  let offset = 0;

  if (Math.abs(roll) > 60) {
    offset = Math.max(0, 41 - 35.87 / Math.sin((Math.abs(roll) / 180) * Math.PI));
  }
  return offset;
};

export class LagFilter {
  private PreviousInput: number;

  private PreviousOutput: number;

  private CornerFrequency: number;

  constructor(cornerFrequency: number) {
    this.PreviousInput = 0;
    this.PreviousOutput = 0;

    this.CornerFrequency = cornerFrequency;
  }

  reset() {
    this.PreviousInput = 0;
    this.PreviousOutput = 0;
  }

  /**
   *
   * @param input Input to filter
   * @param deltaTime in seconds
   * @returns {number} Filtered output
   */
  step(input: number, deltaTime: number): number {
    const filteredInput = !Number.isNaN(input) ? input : 0;

    const scaledDeltaTime = deltaTime * this.CornerFrequency;
    const sum0 = scaledDeltaTime + 2;

    const output =
      ((filteredInput + this.PreviousInput) * scaledDeltaTime) / sum0 +
      ((2 - scaledDeltaTime) / sum0) * this.PreviousOutput;

    this.PreviousInput = filteredInput;

    if (Number.isFinite(output)) {
      this.PreviousOutput = output;
      return output;
    }
    return 0;
  }

  public previousOutput(): number {
    return this.PreviousOutput;
  }
}

export class RateLimiter {
  private PreviousOutput: number;

  private RisingRate: number;

  private FallingRate: number;

  constructor(risingRate: number, fallingRate: number) {
    this.PreviousOutput = 0;

    this.RisingRate = risingRate;
    this.FallingRate = fallingRate;
  }

  step(input: number, deltaTime: number) {
    const filteredInput = !Number.isNaN(input) ? input : 0;

    const subInput = filteredInput - this.PreviousOutput;

    const scaledUpper = deltaTime * this.RisingRate;
    const scaledLower = deltaTime * this.FallingRate;

    const output = this.PreviousOutput + Math.max(Math.min(scaledUpper, subInput), scaledLower);
    this.PreviousOutput = output;
    return output;
  }
}

/**
 * Gets the smallest angle between two angles
 * @param angle1 First angle in degrees
 * @param angle2 Second angle in degrees
 * @returns {number} Smallest angle between angle1 and angle2 in degrees
 */
export const getSmallestAngle = (angle1: number, angle2: number): number => {
  let smallestAngle = angle1 - angle2;
  if (smallestAngle > 180) {
    smallestAngle -= 360;
  } else if (smallestAngle < -180) {
    smallestAngle += 360;
  }
  return smallestAngle;
};

export const isCaptainSide = (displayIndex: number | undefined) => displayIndex === 1;

export const getSupplier = (displayIndex: number | undefined, knobValue: number) => {
  const adirs3ToCaptain = 0;
  const adirs3ToFO = 2;

  if (isCaptainSide(displayIndex)) {
    return knobValue === adirs3ToCaptain ? 3 : 1;
  }
  return knobValue === adirs3ToFO ? 3 : 2;
};
