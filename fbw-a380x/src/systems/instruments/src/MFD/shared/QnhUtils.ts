// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Units } from '@flybywiresim/fbw-sdk';

export function isQnhInHg(qnh: number): boolean {
  return qnh < 100;
}

export function qnhToMillibar(qnh: number): number {
  return isQnhInHg(qnh) ? Units.inchOfMercuryToHectopascal(qnh) : qnh;
}
