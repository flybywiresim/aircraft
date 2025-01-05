// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

export class NavRadioUtils {
  public static vhfFrequenciesAreEqual(a?: number | null, b?: number | null): boolean {
    return Math.abs((a ?? 0) - (b ?? 0)) < 0.01;
  }
}
