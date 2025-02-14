// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { LskCallback, LskDelayFunction } from './LegacyFmsPageInterface';
import { McduMessage } from '../messages/NXSystemMessages';

interface LegacyAidsPageDrawingInterface {
  clearDisplay(webSocketDraw?: boolean): void;
  setTemplate(template: any[][], large?: boolean): void;
  getDelaySwitchPage(): number;
  onRightInput: LskCallback[];
  rightInputDelay: LskDelayFunction[];
  activeSystem: 'AIDS' | 'ATSU' | 'CFDS' | 'FMGC';
  setScratchpadMessage(message: McduMessage): void;
}

/** This breaks some circular refs, and tells us what we need a shim for to wrap legacy pages in future. */
export type LegacyAidsPageInterface = LegacyAidsPageDrawingInterface;
