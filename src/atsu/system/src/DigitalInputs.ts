import { Clock } from '@atsu/common/types';
import { Arinc429Word } from '@shared/arinc429';
import { FmgcFlightPhase } from '@shared/flightphase';
import { EventBus, EventSubscriber } from 'msfssdk';
import { AtcMessageButtonBusTypes } from './databus/AtcMessageButtonBus';
import { ClockDataBusTypes } from './databus/ClockBus';
import { FmgcDataBusTypes } from './databus/FmgcBus';
import { FwcDataBusTypes } from './databus/FwcBus';
import { TransponderDataBusTypes } from './databus/TransponderBus';

export class DigitalInputs {
    private subscriber: EventSubscriber<AtcMessageButtonBusTypes & ClockDataBusTypes & FmgcDataBusTypes & FwcDataBusTypes & TransponderDataBusTypes> = null;

    public UtcClock: Clock = {
        year: 0,
        month: 0,
        dayOfMonth: 0,
        hour: 0,
        minute: 0,
        second: 0,
        secondsOfDay: 0,
    };

    public PresentPosition: {
        latitude: Arinc429Word,
        longitude: Arinc429Word,
        altitude: Arinc429Word,
        heading: Arinc429Word,
        track: Arinc429Word,
    } = {
        latitude: new Arinc429Word(0),
        longitude: new Arinc429Word(0),
        altitude: new Arinc429Word(0),
        heading: new Arinc429Word(0),
        track: new Arinc429Word(0),
    }

    public PresentDynamics: {
        verticalSpeed: Arinc429Word,
        computedAirspeed: Arinc429Word,
        groundSpeed: Arinc429Word,
        mach: Arinc429Word,
    } = {
        verticalSpeed: new Arinc429Word(0),
        computedAirspeed: new Arinc429Word(0),
        groundSpeed: new Arinc429Word(0),
        mach: new Arinc429Word(0),
    }

    public MeteoData: {
        windDirection: Arinc429Word,
        windSpeed: Arinc429Word,
        staticAirTemperature: Arinc429Word,
    } = {
        windDirection: new Arinc429Word(0),
        windSpeed: new Arinc429Word(0),
        staticAirTemperature: new Arinc429Word(0),
    }

    public AutopilotData: {
        active: Arinc429Word,
        autothrustMode: Arinc429Word,
        selectedSpeed: Arinc429Word,
        selectedMach: Arinc429Word,
    } = {
        active: new Arinc429Word(0),
        autothrustMode: new Arinc429Word(0),
        selectedSpeed: new Arinc429Word(0),
        selectedMach: new Arinc429Word(0),
    }

    public FlightPhase: FmgcFlightPhase = FmgcFlightPhase.Preflight;

    public CompanyMessageCount: number = 0;

    public AtcMessageButtonPressed: boolean = false;

    public TransponderCode: number = 2000;

    constructor(private readonly bus: EventBus) { }

    public initialize(): void {
        this.subscriber = this.bus.getSubscriber<AtcMessageButtonBusTypes & ClockDataBusTypes & FmgcDataBusTypes & FwcDataBusTypes & TransponderDataBusTypes>();

        this.subscriber.on('utcYear').handle((year: number) => this.UtcClock.year = year);
        this.subscriber.on('utcMonth').handle((month: number) => this.UtcClock.month = month);
        this.subscriber.on('utcDayOfMonth').handle((dayOfMonth: number) => this.UtcClock.dayOfMonth = dayOfMonth);
        this.subscriber.on('utcHour').handle((hour: number) => this.UtcClock.hour = hour);
        this.subscriber.on('utcMinute').handle((minute: number) => this.UtcClock.minute = minute);
        this.subscriber.on('utcSecond').handle((second: number) => this.UtcClock.second = second);
        this.subscriber.on('utcSecondsOfDay').handle((seconds: number) => this.UtcClock.secondsOfDay = seconds);

        this.subscriber.on('presentPositionLatitude').handle((latitude: Arinc429Word) => this.PresentPosition.latitude = latitude);
        this.subscriber.on('presentPositionLongitude').handle((longitude: Arinc429Word) => this.PresentPosition.longitude = longitude);
        this.subscriber.on('presentAltitude').handle((altitude: Arinc429Word) => this.PresentPosition.altitude = altitude);
        this.subscriber.on('presentHeading').handle((heading: Arinc429Word) => this.PresentPosition.heading = heading);
        this.subscriber.on('presentTrack').handle((track: Arinc429Word) => this.PresentPosition.track = track);

        this.subscriber.on('verticalSpeed').handle((verticalSpeed: Arinc429Word) => this.PresentDynamics.verticalSpeed = verticalSpeed);
        this.subscriber.on('computedAirspeed').handle((computedAirspeed: Arinc429Word) => this.PresentDynamics.computedAirspeed = computedAirspeed);
        this.subscriber.on('groundSpeed').handle((groundSpeed: Arinc429Word) => this.PresentDynamics.groundSpeed = groundSpeed);
        this.subscriber.on('presentMach').handle((mach: Arinc429Word) => this.PresentDynamics.mach = mach);

        this.subscriber.on('windDirection').handle((windDirection: Arinc429Word) => this.MeteoData.windDirection = windDirection);
        this.subscriber.on('windSpeed').handle((windSpeed: Arinc429Word) => this.MeteoData.windSpeed = windSpeed);
        this.subscriber.on('staticAirTemperature').handle((staticAirTemperature: Arinc429Word) => this.MeteoData.staticAirTemperature = staticAirTemperature);

        this.subscriber.on('autopilotActive').handle((active: Arinc429Word) => this.AutopilotData.active = active);
        this.subscriber.on('autothrustMode').handle((autothrustMode: Arinc429Word) => this.AutopilotData.autothrustMode = autothrustMode);
        this.subscriber.on('autothrustSelectedMach').handle((selectedMach: Arinc429Word) => this.AutopilotData.selectedMach = selectedMach);
        this.subscriber.on('autothrustSelectedKnots').handle((selectedSpeed: Arinc429Word) => this.AutopilotData.selectedSpeed = selectedSpeed);

        this.subscriber.on('companyMessageCount').handle((count: number) => this.CompanyMessageCount = count);

        this.subscriber.on('buttonPressed').handle((pressed: boolean) => this.AtcMessageButtonPressed = pressed);

        this.subscriber.on('flightPhase').handle((phase: Arinc429Word) => {
            if (phase.isNormalOperation()) {
                this.FlightPhase = phase.value as FmgcFlightPhase;
            } else {
                this.FlightPhase = FmgcFlightPhase.Preflight;
            }
        });

        this.subscriber.on('transponderCode').handle((code: number) => this.TransponderCode = code);
    }
}
