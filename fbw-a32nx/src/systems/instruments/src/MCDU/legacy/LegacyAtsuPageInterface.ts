// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FmsClient } from '@atsu/fmsclient';
import { LskCallback, LskDelayFunction, SimbriefOfpState } from './LegacyFmsPageInterface';
import { AtsuStatusCodes } from '@datalink/common';
import { McduMessage } from '../messages/NXSystemMessages';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { FlightPhaseManager } from '@fmgc/flightphase';
import { ISimbriefData } from '../../../../../../../fbw-common/src/systems/instruments/src/EFB/Apis/Simbrief';

interface LegacyAtsuPageDrawingInterface {
  clearDisplay(webSocketDraw?: boolean): void;
  setTemplate(template: any[][], large?: boolean): void;
  setTitle(title: string): void;
  setArrows(up: boolean, down: boolean, left: boolean, right: boolean): void;
  getDelaySwitchPage(): number;
  getDelayBasic(): number;
  getDelayMedium(): number;
  getDelayHigh(): number;
  getDelayFuelPred(): number;
  getDelayWindLoad(): number;
  requestUpdate(): void;

  pageRedrawCallback?: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onUp: () => void;
  onDown: () => void;
  page: Record<string, number>;
  SelfPtr: ReturnType<typeof setTimeout> | false;
  onLeftInput: LskCallback[];
  onRightInput: LskCallback[];
  leftInputDelay: LskDelayFunction[];
  rightInputDelay: LskDelayFunction[];
  activeSystem: 'AIDS' | 'ATSU' | 'CFDS' | 'FMGC';
  readonly PageTimeout: {
    Fast: number;
    Medium: number;
    Dyn: number;
    Default: number;
    Slow: number;
  };

  printPage(lines: any[]): void;
  addNewAtsuMessage(code: AtsuStatusCodes): void;
  setScratchpadMessage(message: McduMessage): void;
}

/** These all need to be things published on the FMGC output bus. */
interface LegacyAtsuPageFmsInterface {
  // NO!
  isAnEngineOn(): boolean;
  // NO!
  getFOB(): number | undefined;

  atsu?: FmsClient;
  // NO!
  flightPlanService: FlightPlanService;
  // NO!
  flightPhaseManager: FlightPhaseManager;
  // NO!
  simbrief: any;
  // NO!
  simbriefOfp: ISimbriefData;
  // NO!
  simbriefOfpState: SimbriefOfpState;
  // Move to ATSU
  aocTimes: {
    doors: number;
    off: number;
    out: number;
    on: number;
    in: number;
  };
}

/** This breaks some circular refs, and tells us what we need a shim for to wrap legacy pages in future. */
export type LegacyAtsuPageInterface = LegacyAtsuPageDrawingInterface & LegacyAtsuPageFmsInterface;
