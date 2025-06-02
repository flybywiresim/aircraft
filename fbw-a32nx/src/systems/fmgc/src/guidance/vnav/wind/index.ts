// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

export class WindComponent {
  /**
   *
   * @param value +ve for a tailwind, -ve for headwind
   */
  constructor(public value: number) {}

  static zero(): WindComponent {
    return new WindComponent(0);
  }
}
