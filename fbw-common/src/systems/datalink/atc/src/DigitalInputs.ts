import { Clock, CpdlcMessage, FmgcDataBusTypes, FreetextMessage, RmpDataBusTypes } from '@datalink/common';
import { RouterAtcAocMessages } from '@datalink/router';
import { Arinc429Word } from '@shared/arinc429';
import { FmgcFlightPhase } from '@shared/flightphase';
import { EventBus, EventSubscriber } from 'msfssdk';
import { AtcMessageButtonBusTypes, AtcMessageButtonInputBus } from './databus/AtcMessageButtonBus';
import { ClockDataBusTypes } from '../../common/src/databus/ClockBus';
import { FmsAtcBus, FmsAtcMessages, FmsRouteData } from './databus/FmsBus';

export type DigitalInputCallbacks = {
    receivedFreetextMessage: (message: FreetextMessage) => void;
    receivedCpdlcMessage: (message: CpdlcMessage) => void;
}

export class DigitalInputs {
    private subscriber: EventSubscriber<
        AtcMessageButtonBusTypes &
        ClockDataBusTypes &
        FmgcDataBusTypes &
        FmsAtcMessages &
        RmpDataBusTypes &
        RouterAtcAocMessages
    > = null;

    private poweredUp: boolean = false;

    private callbacks: DigitalInputCallbacks = {
        receivedFreetextMessage: null,
        receivedCpdlcMessage: null,
    };

    public UtcClock: Clock;

    public PresentPosition: {
        latitude: Arinc429Word,
        longitude: Arinc429Word,
        altitude: Arinc429Word,
        heading: Arinc429Word,
        track: Arinc429Word,
    };

    public PresentDynamics: {
        verticalSpeed: Arinc429Word,
        computedAirspeed: Arinc429Word,
        groundSpeed: Arinc429Word,
        mach: Arinc429Word,
    };

    public MeteoData: {
        windDirection: Arinc429Word,
        windSpeed: Arinc429Word,
        staticAirTemperature: Arinc429Word,
    };

    public AutopilotData: {
        active: Arinc429Word,
        autothrustMode: Arinc429Word,
        machMode: boolean,
        selectedSpeed: Arinc429Word,
        selectedMach: Arinc429Word,
        selectedAltitude: number,
    };

    public TransponderCode: number;

    public FlightPhase: FmgcFlightPhase = FmgcFlightPhase.Preflight;

    public FlightRoute: FmsRouteData;

    public readonly atcMessageButtonBus: AtcMessageButtonInputBus;

    public readonly fmsBus: FmsAtcBus;

    private resetData(): void {
        this.UtcClock = new Clock(0, 0, 0, 0, 0, 0, 0);

        this.PresentPosition = {
            latitude: new Arinc429Word(0),
            longitude: new Arinc429Word(0),
            altitude: new Arinc429Word(0),
            heading: new Arinc429Word(0),
            track: new Arinc429Word(0),
        };

        this.PresentDynamics = {
            verticalSpeed: new Arinc429Word(0),
            computedAirspeed: new Arinc429Word(0),
            groundSpeed: new Arinc429Word(0),
            mach: new Arinc429Word(0),
        };

        this.MeteoData = {
            windDirection: new Arinc429Word(0),
            windSpeed: new Arinc429Word(0),
            staticAirTemperature: new Arinc429Word(0),
        };

        this.AutopilotData = {
            active: new Arinc429Word(0),
            autothrustMode: new Arinc429Word(0),
            machMode: false,
            selectedSpeed: new Arinc429Word(0),
            selectedMach: new Arinc429Word(0),
            selectedAltitude: 0,
        };

        this.TransponderCode = 2000;

        this.FlightPhase = FmgcFlightPhase.Preflight;

        this.FlightRoute = {
            lastWaypoint: null,
            activeWaypoint: null,
            nextWaypoint: null,
            destination: null,
        };
    }

    constructor(private readonly bus: EventBus) {
        this.resetData();

        this.atcMessageButtonBus = new AtcMessageButtonInputBus(this.bus);
        this.fmsBus = new FmsAtcBus(this.bus);
    }

    public initialize(): void {
        this.atcMessageButtonBus.initialize();
        this.fmsBus.initialize();

        this.subscriber = this.bus.getSubscriber<
            AtcMessageButtonBusTypes &
            ClockDataBusTypes &
            FmgcDataBusTypes &
            FmsAtcMessages &
            RmpDataBusTypes &
            RouterAtcAocMessages
        >();
    }

    public connectedCallback(): void {
        this.atcMessageButtonBus.connectedCallback();

        this.subscriber.on('utcYear').handle((year: number) => {
            if (this.poweredUp) this.UtcClock.year = year;
        });
        this.subscriber.on('utcMonth').handle((month: number) => {
            if (this.poweredUp) this.UtcClock.month = month;
        });
        this.subscriber.on('utcDayOfMonth').handle((dayOfMonth: number) => {
            if (this.poweredUp) this.UtcClock.dayOfMonth = dayOfMonth;
        });
        this.subscriber.on('utcHour').handle((hour: number) => {
            if (this.poweredUp) this.UtcClock.hour = hour;
        });
        this.subscriber.on('utcMinute').handle((minute: number) => {
            if (this.poweredUp) this.UtcClock.minute = minute;
        });
        this.subscriber.on('utcSecond').handle((second: number) => {
            if (this.poweredUp) this.UtcClock.second = second;
        });
        this.subscriber.on('utcSecondsOfDay').handle((seconds: number) => {
            if (this.poweredUp) this.UtcClock.secondsOfDay = seconds;
        });

        this.subscriber.on('presentPositionLatitude').handle((latitude: Arinc429Word) => {
            if (this.poweredUp) {
                this.PresentPosition.latitude = latitude;
                this.AutopilotData.selectedAltitude = Simplane.getAutoPilotDisplayedAltitudeLockValue();
            }
        });
        this.subscriber.on('presentPositionLongitude').handle((longitude: Arinc429Word) => {
            if (this.poweredUp) this.PresentPosition.longitude = longitude;
        });
        this.subscriber.on('presentAltitude').handle((altitude: Arinc429Word) => {
            if (this.poweredUp) this.PresentPosition.altitude = altitude;
        });
        this.subscriber.on('presentHeading').handle((heading: Arinc429Word) => {
            if (this.poweredUp) this.PresentPosition.heading = heading;
        });
        this.subscriber.on('presentTrack').handle((track: Arinc429Word) => {
            if (this.poweredUp) this.PresentPosition.track = track;
        });

        this.subscriber.on('verticalSpeed').handle((verticalSpeed: Arinc429Word) => {
            if (this.poweredUp) this.PresentDynamics.verticalSpeed = verticalSpeed;
        });
        this.subscriber.on('computedAirspeed').handle((computedAirspeed: Arinc429Word) => {
            if (this.poweredUp) this.PresentDynamics.computedAirspeed = computedAirspeed;
        });
        this.subscriber.on('groundSpeed').handle((groundSpeed: Arinc429Word) => {
            if (this.poweredUp) this.PresentDynamics.groundSpeed = groundSpeed;
        });
        this.subscriber.on('presentMach').handle((mach: Arinc429Word) => {
            if (this.poweredUp) this.PresentDynamics.mach = mach;
        });

        this.subscriber.on('windDirection').handle((windDirection: Arinc429Word) => {
            if (this.poweredUp) this.MeteoData.windDirection = windDirection;
        });
        this.subscriber.on('windSpeed').handle((windSpeed: Arinc429Word) => {
            if (this.poweredUp) this.MeteoData.windSpeed = windSpeed;
        });
        this.subscriber.on('staticAirTemperature').handle((staticAirTemperature: Arinc429Word) => {
            if (this.poweredUp) this.MeteoData.staticAirTemperature = staticAirTemperature;
        });

        this.subscriber.on('autopilotActive').handle((active: Arinc429Word) => {
            if (this.poweredUp) this.AutopilotData.active = active;
        });
        this.subscriber.on('autothrustMode').handle((autothrustMode: Arinc429Word) => {
            if (this.poweredUp) {
                this.AutopilotData.autothrustMode = autothrustMode;
                this.AutopilotData.machMode = autothrustMode.isNormalOperation() && autothrustMode.value === 8;
            }
        });
        this.subscriber.on('autothrustSelectedMach').handle((selectedMach: Arinc429Word) => {
            if (this.poweredUp) this.AutopilotData.selectedMach = selectedMach;
        });
        this.subscriber.on('autothrustSelectedKnots').handle((selectedSpeed: Arinc429Word) => {
            if (this.poweredUp) this.AutopilotData.selectedSpeed = selectedSpeed;
        });

        this.subscriber.on('flightPhase').handle((phase: Arinc429Word) => {
            if (this.poweredUp) {
                if (phase.isNormalOperation()) {
                    this.FlightPhase = phase.value as FmgcFlightPhase;
                } else {
                    this.FlightPhase = FmgcFlightPhase.Preflight;
                }
            }
        });

        this.subscriber.on('transponderCode').handle((code: number) => {
            if (this.poweredUp) this.TransponderCode = code;
        });

        this.subscriber.on('atcRouteData').handle((route) => {
            if (!this.poweredUp) return;

            this.fmsBus.newRouteDataReceived(route);

            this.FlightRoute.lastWaypoint = null;
            this.FlightRoute.activeWaypoint = null;
            this.FlightRoute.nextWaypoint = null;
            this.FlightRoute.destination = null;

            if (route.lastWaypoint !== null) {
                this.FlightRoute.lastWaypoint = route.lastWaypoint;
            }
            if (route.activeWaypoint !== null) {
                this.FlightRoute.activeWaypoint = route.activeWaypoint;
            }
            if (route.nextWaypoint !== null) {
                this.FlightRoute.nextWaypoint = route.nextWaypoint;
            }
            if (route.destination !== null) {
                this.FlightRoute.destination = route.destination;
            }
        });

        this.subscriber.on('routerReceivedFreetextMessage').handle((message: FreetextMessage) => {
            if (this.callbacks.receivedFreetextMessage !== null) {
                this.callbacks.receivedFreetextMessage(message);
            }
        });
        this.subscriber.on('routerReceivedCpdlcMessage').handle((message: CpdlcMessage) => {
            if (this.callbacks.receivedCpdlcMessage !== null) {
                this.callbacks.receivedCpdlcMessage(message);
            }
        });
    }

    public startPublish(): void {
        this.atcMessageButtonBus.startPublish();
    }

    public powerUp(): void {
        this.poweredUp = true;
        this.atcMessageButtonBus.powerUp();

        this.resetData();
    }

    public powerDown(): void {
        this.atcMessageButtonBus.powerDown();
        this.poweredUp = false;
    }

    public update(): void {
        this.atcMessageButtonBus.update();
    }

    public addDataCallback<K extends keyof DigitalInputCallbacks>(event: K, callback: DigitalInputCallbacks[K]): void {
        this.callbacks[event] = callback;
    }
}
