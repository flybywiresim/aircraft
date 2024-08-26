// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, Instrument, SimVarDefinition, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';
import { Arinc429Word, ArincEventBus } from '@flybywiresim/fbw-sdk';

/**
 * Transmitted from FMS to OANS
 */
export interface FmsOansData {
  /** (FMS -> OANS) Selected origin airport. */
  fmsOrigin: string;
  /** (FMS -> OANS) Selected destination airport. */
  fmsDestination: string;
  /** (FMS -> OANS) Selected alternate airport. */
  fmsAlternate: string;
  /** (FMS -> OANS) Identifier of departure runway. */
  fmsDepartureRunway: string;
  /** (FMS -> OANS) Identifier of landing runway selected through FMS. */
  fmsLandingRunway: string;
  /** Identifier of landing runway selected for BTV through OANS. */
  oansSelectedLandingRunway: string;
  /** Length of landing runway selected for BTV through OANS, in meters. */
  oansSelectedLandingRunwayLengthRaw: number;
  /** Bearing of landing runway selected for BTV through OANS, in degrees. */
  oansSelectedLandingRunwayBearingRaw: number;
  /** Identifier of exit selected for BTV through OANS. */
  oansSelectedExit: string;
  /** (OANS -> BTV)  Requested stopping distance (through OANS), in meters. */
  oansRequestedStoppingDistanceRaw: number;
  /** (OANS -> BTV) Distance to opposite end of runway, in meters. */
  oansRemainingDistToRwyEndRaw: number;
  /** (OANS -> BTV) Distance to requested stopping distance, in meters. */
  oansRemainingDistToExitRaw: number;
  /** (OANS -> ND) QFU to be displayed in flashing RWY AHEAD warning in ND */
  ndRwyAheadQfu: string;
  /** (OANS -> ND) Message displayed at the top of the ND (instead of TRUE REF), e.g. BTV 08R/A13 */
  ndBtvMessage: string;
}

export enum FmsOansSimVars {
  oansRequestedStoppingDistanceRaw = 'L:A32NX_OANS_BTV_REQ_STOPPING_DISTANCE',
  oansSelectedLandingRunwayLengthRaw = 'L:A32NX_OANS_RWY_LENGTH',
  oansSelectedLandingRunwayBearingRaw = 'L:A32NX_OANS_RWY_BEARING',
  oansRemainingDistToRwyEndRaw = 'L:A32NX_OANS_BTV_REMAINING_DIST_TO_RWY_END',
  oansRemainingDistToExitRaw = 'L:A32NX_OANS_BTV_REMAINING_DIST_TO_EXIT',
}

export class FmsOansSimvarPublisher extends SimVarPublisher<FmsOansData> {
  private static simvars = new Map<keyof FmsOansData, SimVarDefinition>([
    [
      'oansRequestedStoppingDistanceRaw',
      { name: FmsOansSimVars.oansRequestedStoppingDistanceRaw, type: SimVarValueType.Number },
    ],
    [
      'oansSelectedLandingRunwayLengthRaw',
      { name: FmsOansSimVars.oansSelectedLandingRunwayLengthRaw, type: SimVarValueType.Number },
    ],
    [
      'oansSelectedLandingRunwayBearingRaw',
      { name: FmsOansSimVars.oansSelectedLandingRunwayBearingRaw, type: SimVarValueType.Number },
    ],
    [
      'oansRemainingDistToRwyEndRaw',
      { name: FmsOansSimVars.oansRemainingDistToRwyEndRaw, type: SimVarValueType.Number },
    ],
    ['oansRemainingDistToExitRaw', { name: FmsOansSimVars.oansRemainingDistToExitRaw, type: SimVarValueType.Number }],
  ]);

  public constructor(bus: ArincEventBus) {
    super(FmsOansSimvarPublisher.simvars, bus);
  }
}

export interface FmsOansDataArinc429 {
  /** Length of landing runway selected for BTV through OANS, in meters. */
  oansSelectedLandingRunwayLength: Arinc429Word;
  /** Bearing of landing runway selected for BTV through OANS, in degrees. */
  oansSelectedLandingRunwayBearing: Arinc429Word;
  /** (OANS -> BTV)  Requested stopping distance (through OANS), in meters. */
  oansRequestedStoppingDistance: Arinc429Word;
  /** (OANS -> BTV) Distance to opposite end of runway, in meters. */
  oansRemainingDistToRwyEnd: Arinc429Word;
  /** (OANS -> BTV) Distance to requested stopping distance, in meters. */
  oansRemainingDistToExit: Arinc429Word;
}

export class FmsOansArincProvider implements Instrument {
  constructor(private readonly bus: EventBus) {}

  /** @inheritdoc */
  public init(): void {
    const publisher = this.bus.getPublisher<FmsOansDataArinc429>();
    const subscriber = this.bus.getSubscriber<FmsOansData>();

    subscriber
      .on('oansSelectedLandingRunwayLengthRaw')
      .whenChanged()
      .handle((w) => {
        publisher.pub('oansSelectedLandingRunwayLength', new Arinc429Word(w));
      });

    subscriber
      .on('oansSelectedLandingRunwayBearingRaw')
      .whenChanged()
      .handle((w) => {
        publisher.pub('oansSelectedLandingRunwayBearing', new Arinc429Word(w));
      });

    subscriber
      .on('oansRequestedStoppingDistanceRaw')
      .whenChanged()
      .handle((w) => {
        publisher.pub('oansRequestedStoppingDistance', new Arinc429Word(w));
      });

    subscriber
      .on('oansRemainingDistToRwyEndRaw')
      .whenChanged()
      .handle((w) => {
        publisher.pub('oansRemainingDistToRwyEnd', new Arinc429Word(w));
      });

    subscriber
      .on('oansRemainingDistToExitRaw')
      .whenChanged()
      .handle((w) => {
        publisher.pub('oansRemainingDistToExit', new Arinc429Word(w));
      });
  }

  /** @inheritdoc */
  public onUpdate(): void {
    // noop
  }
}
