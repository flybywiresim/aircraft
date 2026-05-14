// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Units } from '@flybywiresim/fbw-sdk';

const MIN_QNH_HPA = 745;

export function isQnhInHg(qnh: number): boolean {
  return qnh < MIN_QNH_HPA;
}

export function qnhToMillibar(qnh: number): number {
  return isQnhInHg(qnh) ? Units.inchOfMercuryToHectopascal(qnh) : qnh;
}
