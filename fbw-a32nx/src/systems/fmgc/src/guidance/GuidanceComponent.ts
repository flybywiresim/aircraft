// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Geometry } from '@fmgc/guidance/Geometry';

export interface GuidanceComponent {
  init(): void;

  update(deltaTime: number): void;

  /**
   * Callback invoked when the FMS decides to generate new multiple leg geometry
   *
   * @param geometry the new multiple leg geometry
   */
  acceptMultipleLegGeometry?(geometry: Geometry): void;
}
