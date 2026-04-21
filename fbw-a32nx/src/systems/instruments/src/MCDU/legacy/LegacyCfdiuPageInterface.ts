// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { LskCallback, LskDelayFunction } from './LegacyFmsPageInterface';

interface LegacyCfdiuPageDrawingInterface {
  clearDisplay(webSocketDraw?: boolean): void;
  setTemplate(template: any[][], large?: boolean): void;
  getDelaySwitchPage(): number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onUnload: () => void;
  onLeftInput: LskCallback[];
  onRightInput: LskCallback[];
  leftInputDelay: LskDelayFunction[];
  rightInputDelay: LskDelayFunction[];
  activeSystem: 'AIDS' | 'ATSU' | 'CFDS' | 'FMGC';
}

/** This breaks some circular refs, and tells us what we need a shim for to wrap legacy pages in future. */
export type LegacyCfdiuPageInterface = LegacyCfdiuPageDrawingInterface;
