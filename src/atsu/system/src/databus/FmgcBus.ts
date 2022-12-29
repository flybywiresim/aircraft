import { Arinc429Word } from '@shared/arinc429';
import { EventBus, SimVarDefinition, SimVarPublisher, SimVarValueType } from 'msfssdk';

interface FmgcSimvars {
    msfsFlightNumber: string,
    msfsPresentPositionLatitude: number,
    msfsPresentPositionLongitude: number,
    msfsPresentAltitude: number,
    msfsPresentHeading: number,
    msfsPresentTrack: number,
    msfsComputedAirspeed: number,
    msfsPresentMach: number,
    msfsGroundSpeed: number,
    msfsVerticalSpeed: number,
    msfsAutopilotActive: boolean,
    msfsAutothrustMode: number,
    msfsAutothrustSelectedMach: number,
    msfsAutothrustSelectedKnots: number,
    msfsWindDirection: number,
    msfsWindSpeed: number,
    msfsStaticAirTemperature: number,
}

enum FmgcSimvarSources {
    flightNumber = 'ATC FLIGHT NUMBER',
    presentPositionLatitude = 'L:A32NX_ADIRS_IR_1_LATITUDE',
    presentPositionLongitude = 'L:A32NX_ADIRS_IR_1_LONGITUDE',
    presentAltitude = 'L:A32NX_ADIRS_ADR_1_ALTITUDE',
    presentHeading = 'L:A32NX_ADIRS_IR_1_HEADING',
    presentTrack = 'L:A32NX_ADIRS_IR_1_TRACK',
    computedAirspeed = 'L:A32NX_ADIRS_ADR_1_COMPUTED_AIRSPEED',
    presentMach = 'L:A32NX_ADIRS_ADR_1_MACH',
    groundSpeed = 'L:A32NX_ADIRS_IR_1_GROUND_SPEED',
    verticalSpeed = 'L:A32NX_ADIRS_IR_1_VERTICAL_SPEED',
    autopilotActive = 'L:A32NX_AUTOPILOT_ACTIVE',
    autothrustMode = 'L:A32NX_AUTOTHRUST_MODE',
    autothrustSelectedMach = 'L:A32NX_MachPreselVal',
    autothrustSelectedKnots = 'L:A32NX_SpeedPreselVal',
    windDirection = 'L:A32NX_ADIRS_IR_1_WIND_DIRECTION',
    windSpeed = 'L:A32NX_ADIRS_IR_1_WIND_SPEED',
    staticAirTemperature = 'L:A32NX_ADIRS_ADR_1_STATIC_AIR_TEMPERATURE',
}

export class FmgcSimvarPuplisher extends SimVarPublisher<FmgcSimvars> {
    private static simvars = new Map<keyof FmgcSimvars, SimVarDefinition>([
        ['msfsFlightNumber', { name: FmgcSimvarSources.flightNumber, type: SimVarValueType.String }],
        ['msfsPresentPositionLatitude', { name: FmgcSimvarSources.presentPositionLatitude, type: SimVarValueType.Number }],
        ['msfsPresentPositionLongitude', { name: FmgcSimvarSources.presentPositionLongitude, type: SimVarValueType.Number }],
        ['msfsPresentAltitude', { name: FmgcSimvarSources.presentAltitude, type: SimVarValueType.Number }],
        ['msfsPresentHeading', { name: FmgcSimvarSources.presentHeading, type: SimVarValueType.Number }],
        ['msfsPresentTrack', { name: FmgcSimvarSources.presentTrack, type: SimVarValueType.Number }],
        ['msfsComputedAirspeed', { name: FmgcSimvarSources.computedAirspeed, type: SimVarValueType.Number }],
        ['msfsPresentMach', { name: FmgcSimvarSources.presentMach, type: SimVarValueType.Number }],
        ['msfsGroundSpeed', { name: FmgcSimvarSources.groundSpeed, type: SimVarValueType.Number }],
        ['msfsAutopilotActive', { name: FmgcSimvarSources.autopilotActive, type: SimVarValueType.Number }],
        ['msfsAutothrustMode', { name: FmgcSimvarSources.autothrustMode, type: SimVarValueType.Number }],
        ['msfsAutothrustSelectedMach', { name: FmgcSimvarSources.autothrustSelectedMach, type: SimVarValueType.Number }],
        ['msfsAutothrustSelectedKnots', { name: FmgcSimvarSources.autothrustSelectedKnots, type: SimVarValueType.Number }],
        ['msfsWindDirection', { name: FmgcSimvarSources.windDirection, type: SimVarValueType.Number }],
        ['msfsWindSpeed', { name: FmgcSimvarSources.windSpeed, type: SimVarValueType.Number }],
        ['msfsStaticAirTemperature', { name: FmgcSimvarSources.staticAirTemperature, type: SimVarValueType.Number }],
    ]);

    public constructor(bus: EventBus) {
        super(FmgcSimvarPuplisher.simvars, bus);
    }
}

export interface FmgcDataBusTypes {
    flightNumber: Arinc429Word,
    presentPositionLatitude: Arinc429Word,
    presentPositionLongitude: Arinc429Word,
    presentAltitude: Arinc429Word,
    presentHeading: Arinc429Word,
    presentTrack: Arinc429Word,
    computedAirspeed: Arinc429Word,
    presentMach: Arinc429Word,
    groundSpeed: Arinc429Word,
    verticalSpeed: Arinc429Word,
    autopilotActive: Arinc429Word,
    autothrustMode: Arinc429Word,
    autothrustSelectedMach: Arinc429Word,
    autothrustSelectedKnots: Arinc429Word,
    windDirection: Arinc429Word,
    windSpeed: Arinc429Word,
    staticAirTemperature: Arinc429Word,
}

export class FmgcDataBus {
    constructor(private readonly bus: EventBus) { }
}
