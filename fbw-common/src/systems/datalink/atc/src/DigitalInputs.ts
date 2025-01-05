import { Arinc429Word } from '@flybywiresim/fbw-sdk';
import { EventBus, EventSubscriber, Publisher } from '@microsoft/msfs-sdk';
import { RouterAtcAocMessages } from '../../router/src';
import {
  AtisType,
  AtsuMessage,
  AtsuStatusCodes,
  Clock,
  Conversion,
  CpdlcMessage,
  FmgcDataBusTypes,
  FreetextMessage,
  PositionReportData,
  RmpDataBusTypes,
  SimVarSources,
} from '../../common/src';
import { AtcMessageButtonBusMessages } from './databus/AtcMessageButtonBus';
import { ClockDataBusTypes } from '../../common/src/databus/ClockBus';
import { AtcFmsMessages, FmsAtcMessages, FmsRouteData } from './databus/FmsBus';
import { AtsuFlightPhase } from '../../common/src/types/AtsuFlightPhase';

export type AtcDigitalInputCallbacks = {
  receivedFreetextMessage: (message: FreetextMessage) => void;
  receivedCpdlcMessage: (message: CpdlcMessage) => void;
  routeData: (route: FmsRouteData) => void;
  sendMessage: (message: AtsuMessage) => Promise<AtsuStatusCodes>;
  updateMessage: (message: AtsuMessage) => void;
  atcLogon: (station: string) => Promise<AtsuStatusCodes>;
  atcLogoff: () => Promise<AtsuStatusCodes>;
  activateAtisAutoUpdate: (data: { icao: string; type: AtisType }) => void;
  deactivateAtisAutoUpdate: (icao: string) => void;
  togglePrintAtisReportsPrint: () => void;
  setMaxUplinkDelay: (delay: number) => void;
  toggleAutomaticPositionReport: () => void;
  requestAtis: (icao: string, type: AtisType) => Promise<AtsuStatusCodes>;
  positionReportData: () => PositionReportData;
  registerMessages: (messages: AtsuMessage[]) => void;
  messageRead: (uid: number) => void;
  removeMessage: (uid: number) => void;
  cleanupMessages: () => void;
  resetAtisAutoUpdate: () => void;
  onAtcMessageButtonPressed: () => void;
};

export class DigitalInputs {
  private subscriber: EventSubscriber<
    AtcMessageButtonBusMessages &
      ClockDataBusTypes &
      FmgcDataBusTypes &
      FmsAtcMessages &
      RmpDataBusTypes &
      RouterAtcAocMessages
  > = null;

  private publisher: Publisher<AtcFmsMessages>;

  private poweredUp: boolean = false;

  private callbacks: AtcDigitalInputCallbacks = {
    receivedFreetextMessage: null,
    receivedCpdlcMessage: null,
    routeData: null,
    sendMessage: null,
    updateMessage: null,
    atcLogon: null,
    atcLogoff: null,
    activateAtisAutoUpdate: null,
    deactivateAtisAutoUpdate: null,
    togglePrintAtisReportsPrint: null,
    setMaxUplinkDelay: null,
    toggleAutomaticPositionReport: null,
    requestAtis: null,
    positionReportData: null,
    registerMessages: null,
    messageRead: null,
    removeMessage: null,
    cleanupMessages: null,
    resetAtisAutoUpdate: null,
    onAtcMessageButtonPressed: null,
  };

  private atcMessageButtonActive: boolean;

  public UtcClock: Clock;

  public PresentPosition: {
    latitude: Arinc429Word;
    longitude: Arinc429Word;
    altitude: Arinc429Word;
    heading: Arinc429Word;
    track: Arinc429Word;
  };

  public PresentDynamics: {
    verticalSpeed: Arinc429Word;
    computedAirspeed: Arinc429Word;
    groundSpeed: Arinc429Word;
    mach: Arinc429Word;
  };

  public MeteoData: {
    windDirection: Arinc429Word;
    windSpeed: Arinc429Word;
    staticAirTemperature: Arinc429Word;
  };

  public AutopilotData: {
    active: Arinc429Word;
    autothrustMode: Arinc429Word;
    machMode: boolean;
    selectedSpeed: Arinc429Word;
    selectedMach: Arinc429Word;
    selectedAltitude: number;
  };

  public TransponderCode: number;

  public FlightPhase: AtsuFlightPhase = AtsuFlightPhase.Preflight;

  public FlightRoute: FmsRouteData;

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

    this.FlightPhase = AtsuFlightPhase.Preflight;

    this.FlightRoute = {
      lastWaypoint: null,
      activeWaypoint: null,
      nextWaypoint: null,
      destination: null,
    };

    this.atcMessageButtonActive = false;
  }

  constructor(private readonly bus: EventBus) {
    this.resetData();
  }

  public initialize(): void {
    this.subscriber = this.bus.getSubscriber<
      AtcMessageButtonBusMessages &
        ClockDataBusTypes &
        FmgcDataBusTypes &
        FmsAtcMessages &
        RmpDataBusTypes &
        RouterAtcAocMessages
    >();
    this.publisher = this.bus.getPublisher<AtcFmsMessages>();
  }

  private async requestWithStatusResponse<T>(
    value: T,
    requestId: number,
    callback: (value: T) => Promise<AtsuStatusCodes>,
  ): Promise<void> {
    if (callback !== null) {
      callback(value).then((code) => {
        this.publisher.pub('atcRequestAtsuStatusCode', { requestId, code }, true, false);
      });
    }
  }

  private requestWithParameter<T>(value: T, requestId: number, callback: (value: T) => void): void {
    if (callback !== null) {
      callback(value);
      this.publisher.pub('atcGenericRequestResponse', requestId, true, false);
    }
  }

  private requestWithoutParameter(requestId: number, callback: () => void): void {
    if (callback !== null) {
      callback();
      this.publisher.pub('atcGenericRequestResponse', requestId, true, false);
    }
  }

  private fireAndForgetWithParameter<T>(value: T, callback: (value: T) => void): void {
    if (callback !== null) callback(value);
  }

  private fireAndForgetWithoutParameter(callback: () => void): void {
    if (callback !== null) callback();
  }

  private static enhanceReceivedMessages<T extends AtsuMessage>(messages: T[]): T[] {
    const enhancedMessages = [];
    messages.forEach((message) => enhancedMessages.push(Conversion.messageDataToMessage(message)));
    return enhancedMessages;
  }

  public connectedCallback(): void {
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
          this.FlightPhase = phase.value as AtsuFlightPhase;
        } else {
          this.FlightPhase = AtsuFlightPhase.Preflight;
        }
      }
    });

    this.subscriber.on('transponderCode').handle((code: number) => {
      if (this.poweredUp) this.TransponderCode = code;
    });

    this.subscriber.on('atcRouteData').handle((route) => {
      if (!this.poweredUp) return;

      if (this.callbacks.routeData !== null) {
        this.callbacks.routeData(route);
      }

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

    this.subscriber
      .on('atcLogon')
      .handle((data) => this.requestWithStatusResponse(data.station, data.requestId, this.callbacks.atcLogon));
    this.subscriber.on('atcLogoff').handle((data) => {
      if (this.callbacks.atcLogoff !== null) {
        this.callbacks.atcLogoff().then((code) => {
          this.publisher.pub('atcRequestAtsuStatusCode', { requestId: data, code }, true, false);
        });
      }
    });
    this.subscriber
      .on('atcActivateAtisAutoUpdate')
      .handle((data) => this.requestWithParameter(data, data.requestId, this.callbacks.activateAtisAutoUpdate));
    this.subscriber
      .on('atcDeactivateAtisAutoUpdate')
      .handle((data) => this.requestWithParameter(data.icao, data.requestId, this.callbacks.deactivateAtisAutoUpdate));
    this.subscriber
      .on('atcTogglePrintAtisReportsPrint')
      .handle((data) => this.requestWithoutParameter(data, this.callbacks.togglePrintAtisReportsPrint));
    this.subscriber
      .on('atcSetMaxUplinkDelay')
      .handle((data) => this.requestWithParameter(data.delay, data.requestId, this.callbacks.setMaxUplinkDelay));
    this.subscriber
      .on('atcToggleAutomaticPositionReport')
      .handle((data) => this.requestWithoutParameter(data, this.callbacks.toggleAutomaticPositionReport));
    this.subscriber.on('atcRequestAtis').handle((data) => {
      if (this.callbacks.requestAtis !== null) {
        this.callbacks
          .requestAtis(data.icao, data.type)
          .then((code) =>
            this.publisher.pub('atcRequestAtsuStatusCode', { code, requestId: data.requestId }, true, false),
          );
      }
    });
    this.subscriber.on('atcRequestPositionReport').handle((data) => {
      if (this.callbacks.positionReportData !== null) {
        this.publisher.pub(
          'atcPositionReport',
          { requestId: data, data: this.callbacks.positionReportData() },
          true,
          false,
        );
      }
    });
    this.subscriber
      .on('atcRegisterCpdlcMessages')
      .handle((data) =>
        this.fireAndForgetWithParameter(DigitalInputs.enhanceReceivedMessages(data), this.callbacks.registerMessages),
      );
    this.subscriber
      .on('atcRegisterDclMessages')
      .handle((data) =>
        this.fireAndForgetWithParameter(DigitalInputs.enhanceReceivedMessages(data), this.callbacks.registerMessages),
      );
    this.subscriber
      .on('atcRegisterOclMessages')
      .handle((data) =>
        this.fireAndForgetWithParameter(DigitalInputs.enhanceReceivedMessages(data), this.callbacks.registerMessages),
      );
    this.subscriber
      .on('atcUpdateMessage')
      .handle((data) =>
        this.fireAndForgetWithParameter(Conversion.messageDataToMessage(data), this.callbacks.updateMessage),
      );
    this.subscriber
      .on('atcMessageRead')
      .handle((data) => this.fireAndForgetWithParameter(data, this.callbacks.messageRead));
    this.subscriber
      .on('atcRemoveMessage')
      .handle((data) => this.fireAndForgetWithParameter(data, this.callbacks.removeMessage));
    this.subscriber
      .on('atcCleanupMessages')
      .handle(() => this.fireAndForgetWithoutParameter(this.callbacks.cleanupMessages));
    this.subscriber
      .on('atcResetAtisAutoUpdate')
      .handle(() => this.fireAndForgetWithoutParameter(this.callbacks.resetAtisAutoUpdate));

    this.subscriber.on('atcMessageButtonActive').handle((active: boolean) => (this.atcMessageButtonActive = active));
    this.subscriber.on('atcMessageButtonPressed').handle((pressed: boolean) => {
      if (pressed) {
        if (this.poweredUp && this.atcMessageButtonActive && this.callbacks.onAtcMessageButtonPressed !== null) {
          this.callbacks.onAtcMessageButtonPressed();
        }

        SimVar.SetSimVarValue(SimVarSources.atcMessageButtonPressed, 'Number', 0);
      }
    });
  }

  public powerUp(): void {
    this.poweredUp = true;
  }

  public powerDown(): void {
    this.poweredUp = false;
    this.resetData();
  }

  public addDataCallback<K extends keyof AtcDigitalInputCallbacks>(
    event: K,
    callback: AtcDigitalInputCallbacks[K],
  ): void {
    this.callbacks[event] = callback;
  }
}
