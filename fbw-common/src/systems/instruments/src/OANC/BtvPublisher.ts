// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, Instrument, SimVarDefinition, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';
import { Arinc429Word, ArincEventBus } from '@flybywiresim/fbw-sdk';

export interface BtvData {
  /** (BTV -> OANS) Estimated runway occupancy time (ROT), in seconds. */
  btvRotRaw: number;
  /** (BTV -> OANS) Estimated turnaround time, when using idle reverse during deceleration, in minutes. */
  btvTurnAroundIdleReverseRaw: number;
  /** (BTV -> OANS) Estimated turnaround time, when using max. reverse during deceleration, in minutes. */
  btvTurnAroundMaxReverseRaw: number;
  /** (BTV -> OANS) Dry stopping distance */
  dryStoppingDistance: number;
  /** (BTV -> OANS) Wet stopping distance */
  wetStoppingDistance: number;
  /** (PRIM -> OANS) Remaining stop distance on ground, used for ROP */
  stopBarDistance: number;

  radioAltitude_1: number;
  radioAltitude_2: number;
  fwcFlightPhase: number;
}

export enum BtvSimVars {
  btvRotRaw = 'L:A32NX_BTV_ROT',
  btvTurnAroundIdleReverseRaw = 'L:A32NX_BTV_TURNAROUND_IDLE_REVERSE',
  btvTurnAroundMaxReverseRaw = 'L:A32NX_BTV_TURNAROUND_MAX_REVERSE',
  dryStoppingDistance = 'L:A32NX_OANS_BTV_DRY_DISTANCE_ESTIMATED',
  wetStoppingDistance = 'L:A32NX_OANS_BTV_WET_DISTANCE_ESTIMATED',
  stopBarDistance = 'L:A32NX_OANS_BTV_STOP_BAR_DISTANCE_ESTIMATED',
  radioAltitude_1 = 'L:A32NX_RA_1_RADIO_ALTITUDE',
  radioAltitude_2 = 'L:A32NX_RA_2_RADIO_ALTITUDE',
  fwcFlightPhase = 'L:A32NX_FWC_FLIGHT_PHASE',
}

export class BtvSimvarPublisher extends SimVarPublisher<BtvData> {
  private static simvars = new Map<keyof BtvData, SimVarDefinition>([
    ['btvRotRaw', { name: BtvSimVars.btvRotRaw, type: SimVarValueType.Number }],
    ['btvTurnAroundIdleReverseRaw', { name: BtvSimVars.btvTurnAroundIdleReverseRaw, type: SimVarValueType.Number }],
    ['btvTurnAroundMaxReverseRaw', { name: BtvSimVars.btvTurnAroundMaxReverseRaw, type: SimVarValueType.Number }],
    ['dryStoppingDistance', { name: BtvSimVars.dryStoppingDistance, type: SimVarValueType.Number }],
    ['wetStoppingDistance', { name: BtvSimVars.wetStoppingDistance, type: SimVarValueType.Number }],
    ['stopBarDistance', { name: BtvSimVars.stopBarDistance, type: SimVarValueType.Number }],
    ['radioAltitude_1', { name: BtvSimVars.radioAltitude_1, type: SimVarValueType.Number }],
    ['radioAltitude_2', { name: BtvSimVars.radioAltitude_2, type: SimVarValueType.Number }],
    ['fwcFlightPhase', { name: BtvSimVars.fwcFlightPhase, type: SimVarValueType.Enum }],
  ]);

  public constructor(bus: ArincEventBus) {
    super(BtvSimvarPublisher.simvars, bus);
  }
}

export interface BtvDataArinc429 {
  /** (BTV -> OANS) Estimated runway occupancy time (ROT), in seconds. */
  btvRot: Arinc429Word;
  /** (BTV -> OANS) Estimated turnaround time, when using idle reverse during deceleration, in minutes. */
  btvTurnAroundIdleReverse: Arinc429Word;
  /** (BTV -> OANS) Estimated turnaround time, when using max. reverse during deceleration, in minutes. */
  btvTurnAroundMaxReverse: Arinc429Word;
}

export class BtvArincProvider implements Instrument {
  constructor(private readonly bus: EventBus) {}

  /** @inheritdoc */
  public init(): void {
    const publisher = this.bus.getPublisher<BtvDataArinc429>();
    const subscriber = this.bus.getSubscriber<BtvData>();

    subscriber
      .on('btvRotRaw')
      .whenChanged()
      .handle((w) => {
        publisher.pub('btvRot', new Arinc429Word(w));
      });

    subscriber
      .on('btvTurnAroundIdleReverseRaw')
      .whenChanged()
      .handle((w) => {
        publisher.pub('btvTurnAroundIdleReverse', new Arinc429Word(w));
      });

    subscriber
      .on('btvTurnAroundMaxReverseRaw')
      .whenChanged()
      .handle((w) => {
        publisher.pub('btvTurnAroundMaxReverse', new Arinc429Word(w));
      });
  }

  /** @inheritdoc */
  public onUpdate(): void {
    // noop
  }
}
