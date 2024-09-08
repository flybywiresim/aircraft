// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Arinc429Word, ArincEventBus } from '@flybywiresim/fbw-sdk';
import { Instrument, SimVarPublisher, SimVarDefinition, SimVarValueType, EventBus } from '@microsoft/msfs-sdk';

/**
 * Transmitted from FMS to OANS
 */
export interface FmsOansData {
    /** (FMS -> OANS) Selected origin airport. */
    fmsOrigin: string,
    /** (FMS -> OANS) Selected destination airport. */
    fmsDestination: string,
    /** (FMS -> OANS) Selected alternate airport. */
    fmsAlternate: string,
    /** (FMS -> OANS) Identifier of departure runway. */
    fmsDepartureRunway: string,
    /** (FMS -> OANS) Identifier of landing runway selected through FMS. */
    fmsLandingRunway: string,
    /** Identifier of landing runway selected for BTV through OANS. */
    oansSelectedLandingRunway: string,
    /** Length of landing runway selected for BTV through OANS, in meters. */
    oansSelectedLandingRunwayLengthRaw: number,
    /** Bearing of landing runway selected for BTV through OANS, in degrees. */
    oansSelectedLandingRunwayBearingRaw: number,
    /** Identifier of exit selected for BTV through OANS. */
    oansSelectedExit: string,
    /** (OANS -> BTV)  Requested stopping distance (through OANS), in meters. */
    oansRequestedStoppingDistanceRaw: number,
    /** (OANS -> BTV) Distance to opposite end of runway, in meters. */
    oansRemainingDistToRwyEndRaw: number,
    /** (OANS -> BTV) Distance to requested stopping distance, in meters. */
    oansRemainingDistToExitRaw: number,
    /** (BTV -> OANS) Estimated runway occupancy time (ROT), in seconds. */
    btvRotRaw: number,
    /** (BTV -> OANS) Estimated turnaround time, when using idle reverse during deceleration, in minutes. */
    btvTurnAroundIdleReverseRaw: number;
    /** (BTV -> OANS) Estimated turnaround time, when using max. reverse during deceleration, in minutes. */
    btvTurnAroundMaxReverseRaw: number;
    /** Message displayed at the top of the ND (instead of TRUE REF), e.g. BTV 08R/A13 */
    ndBtvMessage: string;
}

export enum FmsOansSimVars {
    oansRequestedStoppingDistanceRaw = 'L:A32NX_OANS_BTV_REQ_STOPPING_DISTANCE',
    oansSelectedLandingRunwayLengthRaw = 'L:A32NX_OANS_RWY_LENGTH',
    oansSelectedLandingRunwayBearingRaw = 'L:A32NX_OANS_RWY_BEARING',
    oansRemainingDistToRwyEndRaw = 'L:A32NX_OANS_BTV_REMAINING_DIST_TO_RWY_END',
    oansRemainingDistToExitRaw = 'L:A32NX_OANS_BTV_REMAINING_DIST_TO_EXIT',
    btvRotRaw = 'L:A32NX_BTV_ROT',
    btvTurnAroundIdleReverseRaw = 'L:A32NX_BTV_TURNAROUND_IDLE_REVERSE',
    btvTurnAroundMaxReverseRaw = 'L:A32NX_BTV_TURNAROUND_MAX_REVERSE',
}

/** A publisher to poll and publish nav/com simvars. */
export class FmsOansSimvarPublisher extends SimVarPublisher<FmsOansData> {
    private static simvars = new Map<keyof FmsOansData, SimVarDefinition>([
        ['oansRequestedStoppingDistanceRaw', { name: FmsOansSimVars.oansRequestedStoppingDistanceRaw, type: SimVarValueType.Number }],
        ['oansSelectedLandingRunwayLengthRaw', { name: FmsOansSimVars.oansSelectedLandingRunwayLengthRaw, type: SimVarValueType.Number }],
        ['oansSelectedLandingRunwayBearingRaw', { name: FmsOansSimVars.oansSelectedLandingRunwayBearingRaw, type: SimVarValueType.Number }],
        ['oansRemainingDistToRwyEndRaw', { name: FmsOansSimVars.oansRemainingDistToRwyEndRaw, type: SimVarValueType.Number }],
        ['oansRemainingDistToExitRaw', { name: FmsOansSimVars.oansRemainingDistToExitRaw, type: SimVarValueType.Number }],
        ['btvRotRaw', { name: FmsOansSimVars.btvRotRaw, type: SimVarValueType.Number }],
        ['btvTurnAroundIdleReverseRaw', { name: FmsOansSimVars.btvTurnAroundIdleReverseRaw, type: SimVarValueType.Number }],
        ['btvTurnAroundMaxReverseRaw', { name: FmsOansSimVars.btvTurnAroundMaxReverseRaw, type: SimVarValueType.Number }],
    ])

    public constructor(bus: ArincEventBus) {
        super(FmsOansSimvarPublisher.simvars, bus);
    }
}

export interface FmsOansDataArinc429 {
    /** Length of landing runway selected for BTV through OANS, in meters. */
    oansSelectedLandingRunwayLength: Arinc429Word,
    /** Bearing of landing runway selected for BTV through OANS, in degrees. */
    oansSelectedLandingRunwayBearing: Arinc429Word,
    /** (OANS -> BTV)  Requested stopping distance (through OANS), in meters. */
    oansRequestedStoppingDistance: Arinc429Word,
    /** (OANS -> BTV) Distance to opposite end of runway, in meters. */
    oansRemainingDistToRwyEnd: Arinc429Word,
    /** (OANS -> BTV) Distance to requested stopping distance, in meters. */
    oansRemainingDistToExit: Arinc429Word,
    /** (BTV -> OANS) Estimated runway occupancy time (ROT), in seconds. */
    btvRot: Arinc429Word,
    /** (BTV -> OANS) Estimated turnaround time, when using idle reverse during deceleration, in minutes. */
    btvTurnAroundIdleReverse: Arinc429Word;
    /** (BTV -> OANS) Estimated turnaround time, when using max. reverse during deceleration, in minutes. */
    btvTurnAroundMaxReverse: Arinc429Word;
}

export class FmsOansArincProvider implements Instrument {
    constructor(private readonly bus: EventBus) {

    }

    /** @inheritdoc */
    public init(): void {
        const publisher = this.bus.getPublisher<FmsOansDataArinc429>();
        const subscriber = this.bus.getSubscriber<FmsOansData>();

        subscriber.on('oansSelectedLandingRunwayLengthRaw').whenChanged().handle((w) => {
            console.log('arinc', new Arinc429Word(w));
            publisher.pub('oansSelectedLandingRunwayLength', new Arinc429Word(w));
        });

        subscriber.on('oansSelectedLandingRunwayBearingRaw').whenChanged().handle((w) => {
            publisher.pub('oansSelectedLandingRunwayBearing', new Arinc429Word(w));
        });

        subscriber.on('oansRequestedStoppingDistanceRaw').whenChanged().handle((w) => {
            publisher.pub('oansRequestedStoppingDistance', new Arinc429Word(w));
        });

        subscriber.on('oansRemainingDistToRwyEndRaw').whenChanged().handle((w) => {
            publisher.pub('oansRemainingDistToRwyEnd', new Arinc429Word(w));
        });

        subscriber.on('oansRemainingDistToExitRaw').whenChanged().handle((w) => {
            publisher.pub('oansRemainingDistToExit', new Arinc429Word(w));
        });

        subscriber.on('btvRotRaw').whenChanged().handle((w) => {
            publisher.pub('btvRot', new Arinc429Word(w));
        });

        subscriber.on('btvTurnAroundIdleReverseRaw').whenChanged().handle((w) => {
            publisher.pub('btvTurnAroundIdleReverse', new Arinc429Word(w));
        });

        subscriber.on('btvTurnAroundMaxReverseRaw').whenChanged().handle((w) => {
            publisher.pub('btvTurnAroundMaxReverse', new Arinc429Word(w));
        });
    }

    /** @inheritdoc */
    public onUpdate(): void {
        // noop
    }
}
