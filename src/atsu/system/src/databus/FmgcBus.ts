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
    msfsFlightPhase: number,
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
    flightPhase = 'L:A32NX_FMGC_FLIGHT_PHASE',
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
        ['msfsFlightPhase', { name: FmgcSimvarSources.flightPhase, type: SimVarValueType.Number }],
    ]);

    public constructor(bus: EventBus) {
        super(FmgcSimvarPuplisher.simvars, bus);
    }
}

export interface FmgcDataBusTypes {
    flightNumber: string,
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
    flightPhase: Arinc429Word,
}

export class FmgcInputBus {
    private simVarPublisher: FmgcSimvarPuplisher = null;

    constructor(private readonly bus: EventBus) { }

    public initialize(): void {
        const publisher = this.bus.getPublisher<FmgcDataBusTypes>();
        const subscriber = this.bus.getSubscriber<FmgcSimvars>();

        subscriber.on('msfsFlightNumber').whenChanged().handle((flightNo: string) => publisher.pub('flightNumber', flightNo));
        subscriber.on('msfsPresentPositionLatitude').whenChanged().handle((latitude: number) => {
            publisher.pub('presentPositionLatitude', new Arinc429Word(latitude));
        });
        subscriber.on('msfsPresentPositionLongitude').whenChanged().handle((longitude: number) => {
            publisher.pub('presentPositionLongitude', new Arinc429Word(longitude));
        });
        subscriber.on('msfsPresentAltitude').whenChanged().handle((altitude: number) => {
            publisher.pub('presentAltitude', new Arinc429Word(altitude));
        });
        subscriber.on('msfsPresentHeading').whenChanged().handle((heading: number) => {
            publisher.pub('presentHeading', new Arinc429Word(heading));
        });
        subscriber.on('msfsPresentTrack').whenChanged().handle((track: number) => {
            publisher.pub('presentTrack', new Arinc429Word(track));
        });
        subscriber.on('msfsComputedAirspeed').whenChanged().handle((cas: number) => {
            publisher.pub('computedAirspeed', new Arinc429Word(cas));
        });
        subscriber.on('msfsPresentMach').whenChanged().handle((mach: number) => {
            publisher.pub('presentMach', new Arinc429Word(mach));
        });
        subscriber.on('msfsGroundSpeed').whenChanged().handle((groundSpeed: number) => {
            publisher.pub('groundSpeed', new Arinc429Word(groundSpeed));
        });
        subscriber.on('msfsVerticalSpeed').whenChanged().handle((verticalSpeed: number) => {
            publisher.pub('verticalSpeed', new Arinc429Word(verticalSpeed));
        });
        subscriber.on('msfsAutopilotActive').whenChanged().handle((active: boolean) => {
            publisher.pub('autopilotActive', new Arinc429Word(active === true ? 1 : 0));
        });
        subscriber.on('msfsAutothrustMode').whenChanged().handle((mode: number) => {
            publisher.pub('autothrustMode', new Arinc429Word(mode));
        });
        subscriber.on('msfsAutothrustSelectedMach').whenChanged().handle((mach: number) => {
            publisher.pub('autothrustSelectedMach', new Arinc429Word(mach));
        });
        subscriber.on('msfsAutothrustSelectedKnots').whenChanged().handle((knots: number) => {
            publisher.pub('autothrustSelectedKnots', new Arinc429Word(knots));
        });
        subscriber.on('msfsWindDirection').whenChanged().handle((direction: number) => {
            publisher.pub('windDirection', new Arinc429Word(direction));
        });
        subscriber.on('msfsWindSpeed').whenChanged().handle((speed: number) => {
            publisher.pub('windSpeed', new Arinc429Word(speed));
        });
        subscriber.on('msfsStaticAirTemperature').whenChanged().handle((sat: number) => {
            publisher.pub('staticAirTemperature', new Arinc429Word(sat));
        });
        subscriber.on('msfsFlightPhase').whenChanged().handle((phase: number) => {
            publisher.pub('flightPhase', new Arinc429Word(phase));
        });

        this.simVarPublisher = new FmgcSimvarPuplisher(this.bus);
    }

    public connectedCallback(): void {
        this.simVarPublisher.subscribe('msfsFlightNumber');
        this.simVarPublisher.subscribe('msfsPresentPositionLatitude');
        this.simVarPublisher.subscribe('msfsPresentPositionLongitude');
        this.simVarPublisher.subscribe('msfsPresentAltitude');
        this.simVarPublisher.subscribe('msfsPresentHeading');
        this.simVarPublisher.subscribe('msfsPresentTrack');
        this.simVarPublisher.subscribe('msfsComputedAirspeed');
        this.simVarPublisher.subscribe('msfsPresentMach');
        this.simVarPublisher.subscribe('msfsGroundSpeed');
        this.simVarPublisher.subscribe('msfsVerticalSpeed');
        this.simVarPublisher.subscribe('msfsAutopilotActive');
        this.simVarPublisher.subscribe('msfsAutothrustMode');
        this.simVarPublisher.subscribe('msfsAutothrustSelectedMach');
        this.simVarPublisher.subscribe('msfsAutothrustSelectedKnots');
        this.simVarPublisher.subscribe('msfsWindDirection');
        this.simVarPublisher.subscribe('msfsWindSpeed');
        this.simVarPublisher.subscribe('msfsStaticAirTemperature');
        this.simVarPublisher.subscribe('msfsFlightPhase');
    }
}
