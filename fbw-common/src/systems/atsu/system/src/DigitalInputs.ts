import { FmsAtsuMessages, FmsRouteData, Clock } from '@atsu/common';
import { Arinc429Word } from '@shared/arinc429';
import { FmgcFlightPhase } from '@shared/flightphase';
import { EventBus, EventSubscriber } from 'msfssdk';
import { AtcMessageButtonBusTypes, AtcMessageButtonInputBus } from './databus/AtcMessageButtonBus';
import { ClockDataBusTypes, ClockInputBus } from './databus/ClockBus';
import { FmgcDataBusTypes, FmgcInputBus } from './databus/FmgcBus';
import { FmsInputBus } from './databus/FmsBus';
import { FwcDataBusTypes, FwcInputBus } from './databus/FwcBus';
import { RmpDataBusTypes, RmpInputBus } from './databus/RmpBus';

export class DigitalInputs {
    private subscriber: EventSubscriber<
        AtcMessageButtonBusTypes &
        ClockDataBusTypes &
        FmgcDataBusTypes &
        FwcDataBusTypes &
        FmsAtsuMessages &
        RmpDataBusTypes
    > = null;

    private poweredUp: boolean = false;

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

    public RmpData: {
        transponderCode: number,
        vhf3DataMode: boolean,
    };

    public FlightPhase: FmgcFlightPhase = FmgcFlightPhase.Preflight;

    public CompanyMessageCount: number = 0;

    public FlightRoute: FmsRouteData;

    public readonly atcMessageButtonBus: AtcMessageButtonInputBus;

    public readonly clockBus: ClockInputBus;

    public readonly fmgcBus: FmgcInputBus;

    public readonly fwcBus: FwcInputBus;

    public readonly fmsBus: FmsInputBus;

    public readonly rmpBus: RmpInputBus;

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

        this.RmpData = {
            transponderCode: 2000,
            vhf3DataMode: false,
        }

        this.FlightPhase = FmgcFlightPhase.Preflight;

        this.CompanyMessageCount = 0;

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
        this.clockBus = new ClockInputBus(this.bus);
        this.fmgcBus = new FmgcInputBus(this.bus);
        this.fwcBus = new FwcInputBus(this.bus);
        this.fmsBus = new FmsInputBus(this.bus);
        this.rmpBus = new RmpInputBus(this.bus);
    }

    public initialize(): void {
        this.atcMessageButtonBus.initialize();
        this.clockBus.initialize();
        this.fmgcBus.initialize();
        this.fwcBus.initialize();
        this.fmsBus.initialize();
        this.rmpBus.initialize();

        this.subscriber = this.bus.getSubscriber<
            AtcMessageButtonBusTypes &
            ClockDataBusTypes &
            FmgcDataBusTypes &
            FwcDataBusTypes &
            FmsAtsuMessages &
            RmpDataBusTypes
        >();
    }

    public connectedCallback(): void {
        this.atcMessageButtonBus.connectedCallback();
        this.clockBus.connectedCallback();
        this.fmgcBus.connectedCallback();
        this.fwcBus.connectedCallback();
        this.rmpBus.connectedCallback();

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

        this.subscriber.on('companyMessageCount').handle((count: number) => {
            if (this.poweredUp) this.CompanyMessageCount = count;
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
            if (this.poweredUp) this.RmpData.transponderCode = code;
        });
        this.subscriber.on('vhf3DataMode').handle((active: boolean) => {
            if (this.poweredUp) this.RmpData.vhf3DataMode = active;
        });

        this.subscriber.on('routeData').handle((route) => {
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
    }

    public startPublish(): void {
        this.atcMessageButtonBus.startPublish();
        this.clockBus.startPublish();
        this.fmgcBus.startPublish();
        this.fwcBus.startPublish();
        this.rmpBus.startPublish();
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
        this.clockBus.update();
        this.fmgcBus.update();
        this.fwcBus.update();
        this.rmpBus.update();
    }
}
