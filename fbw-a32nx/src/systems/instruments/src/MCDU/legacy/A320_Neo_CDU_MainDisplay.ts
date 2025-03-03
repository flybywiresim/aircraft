// Copyright (c) 2021-2023, 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { NXDataStore, UpdateThrottler } from '@flybywiresim/fbw-sdk';
import { FMCMainDisplay } from './A32NX_FMCMainDisplay';
import { recallMessageById } from '@fmgc/components';
import { Keypad } from './A320_Neo_CDU_Keypad';
import { NXNotifManager, NXPopUp } from '@shared/NxNotif';
import { McduMessage, NXFictionalMessages, NXSystemMessages, TypeIIMessage } from '../messages/NXSystemMessages';
import { McduServerClient } from '@simbridge/index';
import { ScratchpadDataLink, ScratchpadDisplay } from './A320_Neo_CDU_Scratchpad';
import { CDUMenuPage } from '../legacy_pages/A320_Neo_CDU_MenuPage';
import { CDUFuelPredPage } from '../legacy_pages/A320_Neo_CDU_FuelPredPage';
import { FmgcFlightPhase } from '@shared/flightphase';
import { CDU_Field } from './A320_Neo_CDU_Field';
import { AtsuStatusCodes } from '@datalink/common';
import { EventBus, GameStateProvider, HEvent } from '@microsoft/msfs-sdk';
import { CDUInitPage } from '../legacy_pages/A320_Neo_CDU_InitPage';
import { LegacyFmsPageInterface, LskCallback, LskDelayFunction } from './LegacyFmsPageInterface';
import { LegacyAtsuPageInterface } from './LegacyAtsuPageInterface';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';

export class A320_Neo_CDU_MainDisplay
  extends FMCMainDisplay
  implements LegacyFmsPageInterface, LegacyAtsuPageInterface
{
  private static readonly MIN_BRIGHTNESS = 0.5;
  private static readonly MAX_BRIGHTNESS = 8;

  private static readonly H_EVENT_PREFIX = 'A320_Neo_CDU_';

  private readonly minPageUpdateThrottler = new UpdateThrottler(100);
  private readonly mcduServerConnectUpdateThrottler = new UpdateThrottler(1000);
  private readonly powerCheckUpdateThrottler = new UpdateThrottler(500);

  public readonly fmgcMesssagesListener = RegisterViewListener('JS_LISTENER_SIMVARS', null, true);

  private readonly _keypad = new Keypad(this);

  private _title = undefined;
  private _titleLeft = '';
  private _pageCurrent = undefined;
  private _pageCount = undefined;
  private _labels = [];
  private _lines = [];
  private scratchpadDisplay = null;
  private _scratchpad = null;
  private scratchpads?: Record<'MCDU' | 'FMGC' | 'ATSU' | 'AIDS' | 'CFDS', ScratchpadDataLink>;
  private _arrows = [false, false, false, false];

  private annunciators = {
    left: {
      // note these must match the base names in the model xml
      fmgc: false,
      fail: false,
      mcdu_menu: false,
      fm1: false,
      ind: false,
      rdy: false,
      blank: false,
      fm2: false,
    },
    right: {
      fmgc: false,
      fail: false,
      mcdu_menu: false,
      fm1: false,
      ind: false,
      rdy: false,
      blank: false,
      fm2: false,
    },
  };

  /** MCDU request flags from subsystems */
  private requests = {
    AIDS: false,
    ATSU: false,
    CFDS: false,
    FMGC: false,
  };
  private _lastAtsuMessageCount = 0;
  private leftBrightness = 0;
  private rightBrightness = 0;
  public onLeftInput: LskCallback[] = [];
  public onRightInput: LskCallback[] = [];
  public leftInputDelay: LskDelayFunction[] = [];
  public rightInputDelay: LskDelayFunction[] = [];
  private _activeSystem: 'FMGC' | 'ATSU' | 'AIDS' | 'CFDS' = 'FMGC';
  private inFocus = false;
  private lastInput = new Date(0);
  private clrStop = false;
  private allSelected = false;
  private updateRequest = false;
  private initB = false;
  private lastPowerState = null;
  public readonly PageTimeout = {
    Fast: 500,
    Medium: 1000,
    Dyn: 1500,
    Default: 2000,
    Slow: 3000,
  };
  public returnPageCallback: typeof EmptyCallback.Void | null = null;

  public SelfPtr: ReturnType<typeof setTimeout> | false = false;

  public page = {
    Current: 0,
    Clear: 0,
    AirportsMonitor: 1,
    AirwaysFromWaypointPage: 2,
    // AirwaysFromWaypointPageGetAllRows: 3,
    AvailableArrivalsPage: 4,
    AvailableArrivalsPageVias: 5,
    AvailableDeparturesPage: 6,
    AvailableFlightPlanPage: 7,
    DataIndexPage1: 8,
    DataIndexPage2: 9,
    DirectToPage: 10,
    FlightPlanPage: 11,
    FuelPredPage: 12,
    GPSMonitor: 13,
    HoldAtPage: 14,
    IdentPage: 15,
    InitPageA: 16,
    InitPageB: 17,
    IRSInit: 18,
    IRSMonitor: 19,
    IRSStatus: 20,
    IRSStatusFrozen: 21,
    LateralRevisionPage: 22,
    MenuPage: 23,
    NavaidPage: 24,
    NavRadioPage: 25,
    NewWaypoint: 26,
    PerformancePageTakeoff: 27,
    PerformancePageClb: 28,
    PerformancePageCrz: 29,
    PerformancePageDes: 30,
    PerformancePageAppr: 31,
    PerformancePageGoAround: 32,
    PilotsWaypoint: 33,
    PosFrozen: 34,
    PositionMonitorPage: 35,
    ProgressPage: 36,
    ProgressPageReport: 37,
    ProgressPagePredictiveGPS: 38,
    SelectedNavaids: 39,
    SelectWptPage: 40,
    VerticalRevisionPage: 41,
    WaypointPage: 42,
    AOCInit: 43,
    AOCInit2: 44,
    AOCOfpData: 45,
    AOCOfpData2: 46,
    AOCMenu: 47,
    AOCRequestWeather: 48,
    AOCRequestAtis: 49,
    AOCDepartRequest: 50,
    ATCMenu: 51,
    ATCModify: 52,
    ATCAtis: 53,
    ATCMessageRecord: 54,
    ATCMessageMonitoring: 55,
    ATCConnection: 56,
    ATCNotification: 57,
    ATCConnectionStatus: 58,
    ATCPositionReport1: 59,
    ATCPositionReport2: 60,
    ATCPositionReport3: 61,
    ATCFlightRequest: 62,
    ATCUsualRequest: 63,
    ATCGroundRequest: 64,
    ATCReports: 65,
    ATCEmergency: 66,
    ATCComLastId: 67, // This is needed for automatic page changes triggered by DCDU
    ATSUMenu: 68,
    ATSUDatalinkStatus: 69,
    ClimbWind: 70,
    CruiseWind: 71,
    DescentWind: 72,
    FixInfoPage: 73,
    AOCRcvdMsgs: 74,
    AOCSentMsgs: 75,
    AOCFreeText: 76,
    StepAltsPage: 77,
    ATCDepartReq: 78,
  };

  private mcduServerClient?: McduServerClient;

  private readonly emptyLines = {
    lines: [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ],
    scratchpad: '',
    title: '',
    titleLeft: '',
    page: '',
    arrows: [false, false, false, false],
    annunciators: {
      fmgc: false,
      fail: false,
      mcdu_menu: false,
      fm1: false,
      ind: false,
      rdy: false,
      blank: false,
      fm2: false,
    },
    displayBrightness: 0,
    integralBrightness: 0,
  };

  private _titleLeftElement?: HTMLElement;
  private _titleElement?: HTMLElement;
  private _pageCurrentElement?: HTMLElement;
  private _pageCountElement?: HTMLElement;
  private _labelElements?: any[];
  private _lineElements?: any[];

  public pageRedrawCallback?: () => void;
  public pageUpdate?: () => void;

  private arrowHorizontal?: HTMLSpanElement;
  private arrowVertical?: HTMLSpanElement;

  private check_focus?: ReturnType<typeof setInterval>;
  private check_clr?: ReturnType<typeof setTimeout>;

  private printing = false;

  /** The following events remain due to shared use by the keypad and keyboard type entry */
  public onLetterInput = (l: string) => this.scratchpad.addChar(l);
  public onSp = () => this.scratchpad.addChar(' ');
  public onDiv = () => this.scratchpad.addChar('/');
  public onDot = () => this.scratchpad.addChar('.');
  public onClr = () => this.scratchpad.clear();
  public onClrHeld = () => this.scratchpad.clearHeld();
  public onPlusMinus = (defaultKey = '-') => this.scratchpad.plusMinus(defaultKey);
  public onLeftFunction = (f) => this.onLsk(this.onLeftInput[f], this.leftInputDelay[f]);
  public onRightFunction = (f) => this.onLsk(this.onRightInput[f], this.rightInputDelay[f]);
  public onOvfy = () => this.scratchpad.addChar('Δ');
  public onUnload = () => {};

  public onPrevPage = () => {};
  public onNextPage = () => {};
  public onUp = () => {};
  public onDown = () => {};

  constructor(bus: EventBus) {
    super(bus);
    this.setupFmgcTriggers();
  }

  // TODO this really belongs in the FMCMainDisplay, not the CDU
  private setupFmgcTriggers() {
    Coherent.on('A32NX_FMGC_SEND_MESSAGE_TO_MCDU', (message) => {
      this.addMessageToQueue(
        new TypeIIMessage(message.text, message.color === 'Amber'),
        () => false,
        () => {
          if (message.clearable) {
            recallMessageById(message.id);
          }
        },
      );
    });

    Coherent.on('A32NX_FMGC_RECALL_MESSAGE_FROM_MCDU_WITH_ID', (text) => {
      this.removeMessageFromQueue(text);
    });
  }

  public get templateID() {
    return 'A320_Neo_CDU';
  }

  public get isInteractive() {
    return true;
  }

  public connectedCallback() {
    RegisterViewListener('JS_LISTENER_KEYEVENT', () => {
      console.log('JS_LISTENER_KEYEVENT registered.');
      RegisterViewListener('JS_LISTENER_FACILITY', () => {
        console.log('JS_LISTENER_FACILITY registered.');
      });
    });

    this.bus
      .getSubscriber<HEvent>()
      .on('hEvent')
      .handle((ev) => {
        if (ev.startsWith(A320_Neo_CDU_MainDisplay.H_EVENT_PREFIX)) {
          this.onEvent(ev.slice(A320_Neo_CDU_MainDisplay.H_EVENT_PREFIX.length));
        }
      });

    this.Init();
  }

  // The callback is called when an event is received from the McduServerClient's socket.
  // See https://developer.mozilla.org/en-US/docs/Web/API/WebSocket#events for possible events.
  // This will be used as a parameter when the McduServerClient's connect method is called.
  // this.mcduServerClient.connect(this, this.mcduServerClientEventHandler);
  private mcduServerClientEventHandler(event) {
    switch (event.type) {
      case 'open': {
        console.log(`[MCDU] Websocket connection to SimBridge opened. (${McduServerClient.url()})`);
        new NXNotifManager().showNotification({
          title: 'MCDU CONNECTED',
          message: 'A32NX MCDU successfully connected to SimBridge MCDU Server.',
          timeout: 5000,
        });
        this.sendToMcduServerClient('mcduConnected');
        this.sendUpdate();
        break;
      }
      case 'close': {
        console.log(`[MCDU] Websocket connection to SimBridge closed. (${McduServerClient.url()})`);
        break;
      }
      case 'error': {
        console.log(`[MCDU] Websocket connection to SimBridge error. (${McduServerClient.url()}): ${event.get()}`);
        break;
      }
      case 'message': {
        const [messageType, ...args] = event.data.split(':');
        if (messageType === 'event') {
          // backwards compatible with the old MCDU server...
          // accepts either event:button_name (old), or event:side:button_name (current)
          const mcduIndex = args.length > 1 && args[0] === 'right' ? 2 : 1;
          const button = args.length > 1 ? args[1] : args[0];
          SimVar.SetSimVarValue(`H:A320_Neo_CDU_${mcduIndex}_BTN_${button}`, 'number', 0);
          SimVar.SetSimVarValue(`L:A32NX_MCDU_PUSH_ANIM_${mcduIndex}_${button}`, 'Number', 1);
        }
        if (messageType === 'requestUpdate') {
          this.sendUpdate();
        }
        break;
      }
    }
  }

  private getChildById(elementId: string): HTMLElement | null {
    return document.getElementById(elementId);
  }

  protected Init() {
    super.Init();

    this.generateHTMLLayout(this.getChildById('Mainframe') || this);

    this.scratchpadDisplay = new ScratchpadDisplay(this, this.getChildById('in-out'));
    this.scratchpads = {
      MCDU: new ScratchpadDataLink(this, this.scratchpadDisplay, 'MCDU', false),
      FMGC: new ScratchpadDataLink(this, this.scratchpadDisplay, 'FMGC'),
      ATSU: new ScratchpadDataLink(this, this.scratchpadDisplay, 'ATSU'),
      AIDS: new ScratchpadDataLink(this, this.scratchpadDisplay, 'AIDS'),
      CFDS: new ScratchpadDataLink(this, this.scratchpadDisplay, 'CFDS'),
    };
    this.activateMcduScratchpad();

    try {
      // note: without this, resetting mcdu kills camera
      if (this.scratchpadDisplay && this.scratchpadDisplay.guid) {
        Coherent.trigger('UNFOCUS_INPUT_FIELD', this.scratchpadDisplay.guid);
      }
    } catch (e) {
      console.error(e);
    }

    this.initKeyboardScratchpad();
    this._titleLeftElement = this.getChildById('title-left');
    this._titleElement = this.getChildById('title');
    this._pageCurrentElement = this.getChildById('page-current');
    this._pageCountElement = this.getChildById('page-count');
    this._labelElements = [];
    this._lineElements = [];
    for (let i = 0; i < 6; i++) {
      this._labelElements[i] = [
        this.getChildById('label-' + i + '-left'),
        this.getChildById('label-' + i + '-right'),
        this.getChildById('label-' + i + '-center'),
      ];
      this._lineElements[i] = [
        this.getChildById('line-' + i + '-left'),
        this.getChildById('line-' + i + '-right'),
        this.getChildById('line-' + i + '-center'),
      ];
    }

    CDUMenuPage.ShowPage(this);

    // If the consent is not set, show telex page
    const onlineFeaturesStatus = NXDataStore.get('CONFIG_ONLINE_FEATURES_STATUS', 'UNKNOWN');

    if (onlineFeaturesStatus === 'UNKNOWN') {
      new NXPopUp().showPopUp(
        'TELEX CONFIGURATION',
        'You have not yet configured the telex option. Telex enables free text and live map. If enabled, aircraft position data is published for the duration of the flight. Messages are public and not moderated. USE AT YOUR OWN RISK. To learn more about telex and the features it enables, please go to https://docs.flybywiresim.com/telex. Would you like to enable telex?',
        'small',
        () => NXDataStore.set('CONFIG_ONLINE_FEATURES_STATUS', 'ENABLED'),
        () => NXDataStore.set('CONFIG_ONLINE_FEATURES_STATUS', 'DISABLED'),
      );
    }

    SimVar.SetSimVarValue('L:A32NX_GPS_PRIMARY_LOST_MSG', 'Bool', 0).then();

    NXDataStore.subscribe('*', () => {
      this.requestUpdate();
    });

    this.mcduServerClient = new McduServerClient();

    // sync annunciator simvar state
    this.updateAnnunciators(true);
  }

  public requestUpdate() {
    this.updateRequest = true;
  }

  public onUpdate(_deltaTime: number) {
    super.onUpdate(_deltaTime);

    // every 100ms
    if (this.minPageUpdateThrottler.canUpdate(_deltaTime) !== -1 && this.updateRequest) {
      this.updateRequest = false;
      if (this.pageRedrawCallback) {
        this.pageRedrawCallback();
      }
    }

    // Create a connection to the SimBridge MCDU Server if it is not already connected
    // every 1000ms
    if (
      this.mcduServerConnectUpdateThrottler.canUpdate(_deltaTime) !== -1 &&
      GameStateProvider.get().get() === GameState.ingame &&
      this.mcduServerClient
    ) {
      if (this.mcduServerClient.isConnected()) {
        // Check if connection or SimBridge Setting is still valid.
        // validateConnection() will return false if the connection is not established
        // any longer (probably not the case here as we test isConnected) or if the
        // SimBridge Enabled setting (persistent property CONFIG_SIMBRIDGE_ENABLED) is set
        // to off - this is the case where this clears the remote MCDU screen and
        // disconnects the client.
        if (!this.mcduServerClient.validateConnection()) {
          this.sendClearScreen();
          this.mcduServerClient.disconnect();
        }
      } else {
        // not connected - try to connect
        this.mcduServerClient.connect(this.mcduServerClientEventHandler.bind(this));
      }
    }

    // There is no (known) event when power is turned on or off (e.g. Ext Pwr) and remote clients
    // would not be updated (cleared or updated). Therefore, monitoring power is necessary.
    // every 500ms
    if (this.powerCheckUpdateThrottler.canUpdate(_deltaTime) !== -1) {
      const isPoweredL = SimVar.GetSimVarValue('L:A32NX_ELEC_AC_ESS_SHED_BUS_IS_POWERED', 'Number');
      if (this.lastPowerState !== isPoweredL) {
        this.lastPowerState = isPoweredL;
        this.onFmPowerStateChanged(isPoweredL);

        if (this.mcduServerClient && this.mcduServerClient.isConnected()) {
          this.sendUpdate();
        }
      }
    }

    // TODO these other mechanisms are replaced in the MCDU split PR
    if (this.pageUpdate) {
      this.pageUpdate();
    }
    this.checkAocTimes();
    this.updateMCDU();
  }

  /* MCDU UPDATE */

  /**
   * Updates the MCDU state.
   */
  private updateMCDU() {
    this.updateAnnunciators();

    this.updateBrightness();

    this.updateInitBFuelPred();

    this.updateAtsuRequest();
  }

  /**
   * Checks whether INIT page B is open and an engine is being started, if so:
   * The INIT page B reverts to the FUEL PRED page 15 seconds after the first engine start and cannot be accessed after engine start.
   */
  private updateInitBFuelPred() {
    if (this.isAnEngineOn()) {
      if (!this.initB) {
        this.initB = true;
        setTimeout(() => {
          if (this.page.Current === this.page.InitPageB && this.isAnEngineOn()) {
            CDUFuelPredPage.ShowPage(this);
          }
        }, 15000);
      }
    } else {
      this.initB = false;
    }
  }

  private updateAnnunciators(forceWrite = false) {
    const lightTestPowered = SimVar.GetSimVarValue('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'bool');
    const lightTest = lightTestPowered && SimVar.GetSimVarValue('L:A32NX_OVHD_INTLT_ANN', 'number') === 0;

    // lights are AC1, MCDU is ACC ESS SHED
    const leftAnnuncPower =
      SimVar.GetSimVarValue('L:A32NX_ELEC_AC_1_BUS_IS_POWERED', 'bool') &&
      SimVar.GetSimVarValue('L:A32NX_ELEC_AC_ESS_SHED_BUS_IS_POWERED', 'bool');
    this.updateAnnunciatorsForSide('left', lightTest, leftAnnuncPower, forceWrite);

    // lights and MCDU are both AC2
    const rightAnnuncPower = SimVar.GetSimVarValue('L:A32NX_ELEC_AC_2_BUS_IS_POWERED', 'bool');
    this.updateAnnunciatorsForSide('right', lightTest, rightAnnuncPower, forceWrite);
  }

  private updateBrightness() {
    const left = SimVar.GetSimVarValue('L:A32NX_MCDU_L_BRIGHTNESS', 'number');
    const right = SimVar.GetSimVarValue('L:A32NX_MCDU_R_BRIGHTNESS', 'number');

    let updateNeeded = false;

    if (left !== this.leftBrightness) {
      this.leftBrightness = left;
      updateNeeded = true;
    }

    if (right !== this.rightBrightness) {
      this.rightBrightness = right;
      updateNeeded = true;
    }

    if (updateNeeded) {
      this.sendUpdate();
    }
  }

  private updateAtsuRequest() {
    // the ATSU currently doesn't have the MCDU request signal, so we just check for messages and set it's flag
    const msgs = SimVar.GetSimVarValue('L:A32NX_COMPANY_MSG_COUNT', 'number');
    if (msgs > this._lastAtsuMessageCount) {
      this.setRequest('ATSU');
    }
    this._lastAtsuMessageCount = msgs;
  }

  /**
   * Updates the annunciator light states for one MCDU.
   * @param side Which MCDU to update.
   * @param lightTest Whether ANN LT TEST is active.
   * @param powerOn Whether annunciator LED power is available.
   */
  private updateAnnunciatorsForSide(side: 'left' | 'right', lightTest: boolean, powerOn: boolean, forceWrite = false) {
    let updateNeeded = false;

    const simVarSide = side.toUpperCase().charAt(0);

    const states = this.annunciators[side];
    for (const [annunc, state] of Object.entries(states)) {
      let newState = !!(lightTest && powerOn);

      if (annunc === 'fmgc') {
        newState = newState || this.isSubsystemRequesting('FMGC');
      } else if (annunc === 'mcdu_menu') {
        newState =
          newState ||
          this.isSubsystemRequesting('AIDS') ||
          this.isSubsystemRequesting('ATSU') ||
          this.isSubsystemRequesting('CFDS');
      }

      if (newState !== state || forceWrite) {
        states[annunc] = newState;
        SimVar.SetSimVarValue(`L:A32NX_MCDU_${simVarSide}_ANNUNC_${annunc.toUpperCase()}`, 'bool', newState);
        updateNeeded = true;
      }
    }

    if (updateNeeded) {
      this.sendUpdate();
    }
  }

  // FIXME move ATSU code to ATSU
  private checkAocTimes() {
    if (!this.aocTimes.off) {
      if (this.flightPhaseManager.phase === FmgcFlightPhase.Takeoff && !this.isOnGround()) {
        // Wheels off
        // Off: remains blank until Take off time
        this.aocTimes.off = Math.floor(SimVar.GetGlobalVarValue('ZULU TIME', 'seconds'));
      }
    }

    if (!this.aocTimes.out) {
      const currentPKGBrakeState = SimVar.GetSimVarValue('L:A32NX_PARK_BRAKE_LEVER_POS', 'Bool');
      if (this.flightPhaseManager.phase === FmgcFlightPhase.Preflight && !currentPKGBrakeState) {
        // Out: is when you set the brakes to off
        this.aocTimes.out = Math.floor(SimVar.GetGlobalVarValue('ZULU TIME', 'seconds'));
      }
    }

    if (!this.aocTimes.on) {
      if (this.aocTimes.off && this.isOnGround()) {
        // On: remains blank until Landing time
        this.aocTimes.on = Math.floor(SimVar.GetGlobalVarValue('ZULU TIME', 'seconds'));
      }
    }

    if (!this.aocTimes.in) {
      const currentPKGBrakeState = SimVar.GetSimVarValue('L:A32NX_PARK_BRAKE_LEVER_POS', 'Bool');
      const cabinDoorPctOpen = SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:0', 'percent');
      if (this.aocTimes.on && currentPKGBrakeState && cabinDoorPctOpen > 20) {
        // In: remains blank until brakes set to park AND the first door opens
        this.aocTimes.in = Math.floor(SimVar.GetGlobalVarValue('ZULU TIME', 'seconds'));
      }
    }

    if (this.flightPhaseManager.phase === FmgcFlightPhase.Preflight) {
      const cabinDoorPctOpen = SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:0', 'percent');
      if (!this.aocTimes.doors && cabinDoorPctOpen < 20) {
        this.aocTimes.doors = Math.floor(SimVar.GetGlobalVarValue('ZULU TIME', 'seconds'));
      } else {
        if (cabinDoorPctOpen > 20) {
          this.aocTimes.doors = 0;
        }
      }
    }
  }

  /* END OF MCDU UPDATE */
  /* MCDU INTERFACE/LAYOUT */

  private _formatCell(str) {
    return str
      .replace(/{big}/g, "<span class='b-text'>")
      .replace(/{small}/g, "<span class='s-text'>")
      .replace(/{big}/g, "<span class='b-text'>")
      .replace(/{amber}/g, "<span class='amber'>")
      .replace(/{red}/g, "<span class='red'>")
      .replace(/{green}/g, "<span class='green'>")
      .replace(/{cyan}/g, "<span class='cyan'>")
      .replace(/{white}/g, "<span class='white'>")
      .replace(/{magenta}/g, "<span class='magenta'>")
      .replace(/{yellow}/g, "<span class='yellow'>")
      .replace(/{inop}/g, "<span class='inop'>")
      .replace(/{sp}/g, '&nbsp;')
      .replace(/{left}/g, "<span class='left'>")
      .replace(/{right}/g, "<span class='right'>")
      .replace(/{end}/g, '</span>');
  }

  public setTitle(content: string) {
    let color = content.split('[color]')[1];
    if (!color) {
      color = 'white';
    }
    this._title = content.split('[color]')[0];
    this._title = `{${color}}${this._title}{end}`;
    this._titleElement.textContent = this._title;
  }

  private setTitleLeft(content: string) {
    if (!content) {
      this._titleLeft = '';
      this._titleLeftElement.textContent = '';
      return;
    }
    let color = content.split('[color]')[1];
    if (!color) {
      color = 'white';
    }
    this._titleLeft = content.split('[color]')[0];
    this._titleLeft = `{${color}}${this._titleLeft}{end}`;
    this._titleLeftElement.textContent = this._titleLeft;
  }

  private setPageCurrent(value: string | number) {
    if (typeof value === 'number') {
      this._pageCurrent = value;
    } else if (typeof value === 'string') {
      this._pageCurrent = parseInt(value);
    }
    this._pageCurrentElement.textContent = (this._pageCurrent > 0 ? this._pageCurrent : '') + '';
  }

  private setPageCount(value: string | number) {
    if (typeof value === 'number') {
      this._pageCount = value;
    } else if (typeof value === 'string') {
      this._pageCount = parseInt(value);
    }
    this._pageCountElement.textContent = (this._pageCount > 0 ? this._pageCount : '') + '';
    if (this._pageCount === 0) {
      this.getChildById('page-slash').textContent = '';
    } else {
      this.getChildById('page-slash').textContent = '/';
    }
  }

  private setLabel(label: string, row: number, col = -1, websocketDraw = true) {
    if (col >= this._labelElements[row].length) {
      return;
    }
    if (!this._labels[row]) {
      this._labels[row] = [];
    }
    if (!label) {
      label = '';
    }
    if (col === -1) {
      for (let i = 0; i < this._labelElements[row].length; i++) {
        this._labels[row][i] = '';
        this._labelElements[row][i].textContent = '';
      }
      col = 0;
    }
    if (label === '__FMCSEPARATOR') {
      label = '------------------------';
    }
    if (label !== '') {
      if (label.indexOf('[b-text]') !== -1) {
        label = label.replace('[b-text]', '');
        this._lineElements[row][col].classList.remove('s-text');
        this._lineElements[row][col].classList.add('msg-text');
      } else {
        this._lineElements[row][col].classList.remove('msg-text');
      }

      let color = label.split('[color]')[1];
      if (!color) {
        color = 'white';
      }
      label = label.split('[color]')[0];
      label = `{${color}}${label}{end}`;
    }
    this._labels[row][col] = label;
    this._labelElements[row][col].textContent = label;

    if (websocketDraw) {
      this.sendUpdate();
    }
  }

  private setLine(content: string | CDU_Field, row: number, col = -1, websocketDraw = true) {
    if (content instanceof CDU_Field) {
      const field = content;
      (col === 0 || col === -1 ? this.onLeftInput : this.onRightInput)[row] = (value) => {
        field.onSelect(value);
      };
      content = content.getValue();
    }

    if (col >= this._lineElements[row].length) {
      return;
    }
    if (!content) {
      content = '';
    }
    if (!this._lines[row]) {
      this._lines[row] = [];
    }
    if (col === -1) {
      for (let i = 0; i < this._lineElements[row].length; i++) {
        this._lines[row][i] = '';
        this._lineElements[row][i].textContent = '';
      }
      col = 0;
    }
    if (content === '__FMCSEPARATOR') {
      content = '------------------------';
    }
    if (content !== '') {
      let color = content.split('[color]')[1];
      if (!color) {
        color = 'white';
      }
      content = content.split('[color]')[0];
      content = `{${color}}${content}{end}`;
      if (content.indexOf('[s-text]') !== -1) {
        content = content.replace('[s-text]', '');
        content = `{small}${content}{end}`;
      }
    }
    this._lines[row][col] = content;
    this._lineElements[row][col].textContent = this._lines[row][col];

    if (websocketDraw) {
      this.sendUpdate();
    }
  }

  public setTemplate(template: any[][], large = false) {
    if (template[0]) {
      this.setTitle(template[0][0]);
      this.setPageCurrent(template[0][1]);
      this.setPageCount(template[0][2]);
      this.setTitleLeft(template[0][3]);
    }
    for (let i = 0; i < 6; i++) {
      let tIndex = 2 * i + 1;
      if (template[tIndex]) {
        if (large) {
          if (template[tIndex][1] !== undefined) {
            this.setLine(template[tIndex][0], i, 0, false);
            this.setLine(template[tIndex][1], i, 1, false);
            this.setLine(template[tIndex][2], i, 2, false);
            this.setLine(template[tIndex][3], i, 3, false);
          } else {
            this.setLine(template[tIndex][0], i, -1, false);
          }
        } else {
          if (template[tIndex][1] !== undefined) {
            this.setLabel(template[tIndex][0], i, 0, false);
            this.setLabel(template[tIndex][1], i, 1, false);
            this.setLabel(template[tIndex][2], i, 2, false);
            this.setLabel(template[tIndex][3], i, 3, false);
          } else {
            this.setLabel(template[tIndex][0], i, -1, false);
          }
        }
      }
      tIndex = 2 * i + 2;
      if (template[tIndex]) {
        if (template[tIndex][1] !== undefined) {
          this.setLine(template[tIndex][0], i, 0, false);
          this.setLine(template[tIndex][1], i, 1, false);
          this.setLine(template[tIndex][2], i, 2, false);
          this.setLine(template[tIndex][3], i, 3, false);
        } else {
          this.setLine(template[tIndex][0], i, -1, false);
        }
      }
    }
    if (template[13]) {
      this.setScratchpadText(template[13][0]);
    }

    // Apply formatting helper to title page, lines and labels
    if (this._titleElement !== null) {
      this._titleElement.innerHTML = this._formatCell(this._titleElement.innerHTML);
    }
    if (this._titleLeftElement !== null) {
      this._titleLeftElement.innerHTML = this._formatCell(this._titleLeftElement.innerHTML);
    }
    this._lineElements.forEach((row) => {
      row.forEach((column) => {
        if (column !== null) {
          column.innerHTML = this._formatCell(column.innerHTML);
        }
      });
    });
    this._labelElements.forEach((row) => {
      row.forEach((column) => {
        if (column !== null) {
          column.innerHTML = this._formatCell(column.innerHTML);
        }
      });
    });
    this.sendUpdate();
  }

  /**
   * Sets what arrows will be displayed in the corner of the screen. Arrows are removed when clearDisplay() is called.
   * @param up whether the up arrow will be displayed
   * @param down whether the down arrow will be displayed
   * @param left whether the left arrow will be displayed
   * @param right whether the right arrow will be displayed
   */
  public setArrows(up: boolean, down: boolean, left: boolean, right: boolean) {
    this._arrows = [up, down, left, right];
    this.arrowHorizontal.style.opacity = left || right ? '1' : '0';
    this.arrowVertical.style.opacity = up || down ? '1' : '0';
    if (up && down) {
      this.arrowVertical.innerHTML = '↓↑\xa0';
    } else if (up) {
      this.arrowVertical.innerHTML = '↑\xa0';
    } else {
      this.arrowVertical.innerHTML = '↓\xa0\xa0';
    }
    if (left && right) {
      this.arrowHorizontal.innerHTML = '←→\xa0';
    } else if (right) {
      this.arrowHorizontal.innerHTML = '→\xa0';
    } else {
      this.arrowHorizontal.innerHTML = '←\xa0\xa0';
    }
  }

  public clearDisplay(webSocketDraw = false) {
    this.onUnload();
    this.onUnload = () => {};
    this.setTitle('');
    this.setTitleLeft('');
    this.setPageCurrent(0);
    this.setPageCount(0);
    for (let i = 0; i < 6; i++) {
      this.setLabel('', i, -1, webSocketDraw);
    }
    for (let i = 0; i < 6; i++) {
      this.setLine('', i, -1, webSocketDraw);
    }
    this.onLeftInput = [];
    this.onRightInput = [];
    this.leftInputDelay = [];
    this.rightInputDelay = [];
    this.onPrevPage = () => {};
    this.onNextPage = () => {};
    this.pageUpdate = () => {};
    this.pageRedrawCallback = null;
    if (this.page.Current === this.page.MenuPage) {
      this.setScratchpadText('');
    }
    this.page.Current = this.page.Clear;
    this.setArrows(false, false, false, false);
    this.tryDeleteTimeout();
    this.onUp = () => {};
    this.onDown = () => {};
    this.updateRequest = false;
  }

  /**
   * Set the active subsystem
   * @param {'AIDS' | 'ATSU' | 'CFDS' | 'FMGC'} subsystem
   */
  public set activeSystem(subsystem: 'AIDS' | 'ATSU' | 'CFDS' | 'FMGC') {
    this._activeSystem = subsystem;
    this.scratchpad = this.scratchpads[subsystem];
    this._clearRequest(subsystem);
  }

  public get activeSystem() {
    return this._activeSystem;
  }

  private set scratchpad(sp) {
    if (sp === this._scratchpad) {
      return;
    }

    // pause the old scratchpad so it stops writing to the display
    if (this._scratchpad) {
      this._scratchpad.pause();
    }

    // set the new scratchpad and resume it to update the display
    this._scratchpad = sp;
    this._scratchpad.resume();
  }

  private get scratchpad(): ScratchpadDataLink {
    return this._scratchpad;
  }

  public get mcduScratchpad() {
    return this.scratchpads['MCDU'];
  }

  public get fmgcScratchpad() {
    return this.scratchpads['FMGC'];
  }

  public get atsuScratchpad() {
    return this.scratchpads['ATSU'];
  }

  public get aidsScratchpad() {
    return this.scratchpads['AIDS'];
  }

  public get cfdsScratchpad() {
    return this.scratchpads['CFDS'];
  }

  public activateMcduScratchpad() {
    this.scratchpad = this.scratchpads['MCDU'];
  }

  /**
   * Check if there is an active request from a subsystem to the MCDU
   * @returns true if an active request exists
   */
  public isSubsystemRequesting(subsystem: 'AIDS' | 'ATSU' | 'CFDS' | 'FMGC') {
    return this.requests[subsystem] === true;
  }

  /**
   * Set a request from a subsystem to the MCDU
   */
  public setRequest(subsystem: 'AIDS' | 'ATSU' | 'CFDS' | 'FMGC') {
    if (!(subsystem in this.requests) || this.activeSystem === subsystem) {
      return;
    }
    if (!this.requests[subsystem]) {
      this.requests[subsystem] = true;

      // refresh the menu page if active
      if (this.page.Current === this.page.MenuPage) {
        CDUMenuPage.ShowPage(this);
      }
    }
  }

  /**
   * Clear a request from a subsystem to the MCDU
   */
  private _clearRequest(subsystem: 'AIDS' | 'ATSU' | 'CFDS' | 'FMGC') {
    if (!(subsystem in this.requests)) {
      return;
    }

    if (this.requests[subsystem]) {
      this.requests[subsystem] = false;

      // refresh the menu page if active
      if (this.page.Current === this.page.MenuPage) {
        CDUMenuPage.ShowPage(this);
      }
    }
  }

  private generateHTMLLayout(parent) {
    while (parent.children.length > 0) {
      parent.removeChild(parent.children[0]);
    }
    const header = document.createElement('div');
    header.id = 'header';

    const titleLeft = document.createElement('div');
    titleLeft.classList.add('s-text');
    titleLeft.id = 'title-left';
    parent.appendChild(titleLeft);

    const title = document.createElement('span');
    title.id = 'title';
    header.appendChild(title);

    this.arrowHorizontal = document.createElement('span');
    this.arrowHorizontal.id = 'arrow-horizontal';
    this.arrowHorizontal.innerHTML = '←→\xa0';
    header.appendChild(this.arrowHorizontal);

    parent.appendChild(header);

    const page = document.createElement('div');
    page.id = 'page-info';
    page.classList.add('s-text');

    const pageCurrent = document.createElement('span');
    pageCurrent.id = 'page-current';

    const pageSlash = document.createElement('span');
    pageSlash.id = 'page-slash';
    pageSlash.textContent = '/';

    const pageCount = document.createElement('span');
    pageCount.id = 'page-count';

    page.appendChild(pageCurrent);
    page.appendChild(pageSlash);
    page.appendChild(pageCount);
    parent.appendChild(page);

    for (let i = 0; i < 6; i++) {
      const label = document.createElement('div');
      label.classList.add('label', 's-text');
      const labelLeft = document.createElement('span');
      labelLeft.id = 'label-' + i + '-left';
      labelLeft.classList.add('fmc-block', 'label', 'label-left');
      const labelRight = document.createElement('span');
      labelRight.id = 'label-' + i + '-right';
      labelRight.classList.add('fmc-block', 'label', 'label-right');
      const labelCenter = document.createElement('span');
      labelCenter.id = 'label-' + i + '-center';
      labelCenter.classList.add('fmc-block', 'label', 'label-center');
      label.appendChild(labelLeft);
      label.appendChild(labelRight);
      label.appendChild(labelCenter);
      parent.appendChild(label);
      const line = document.createElement('div');
      line.classList.add('line');
      const lineLeft = document.createElement('span');
      lineLeft.id = 'line-' + i + '-left';
      lineLeft.classList.add('fmc-block', 'line', 'line-left');
      const lineRight = document.createElement('span');
      lineRight.id = 'line-' + i + '-right';
      lineRight.classList.add('fmc-block', 'line', 'line-right');
      const lineCenter = document.createElement('span');
      lineCenter.id = 'line-' + i + '-center';
      lineCenter.classList.add('fmc-block', 'line', 'line-center');
      line.appendChild(lineLeft);
      line.appendChild(lineRight);
      line.appendChild(lineCenter);
      parent.appendChild(line);
    }
    const footer = document.createElement('div');
    footer.classList.add('line');
    const inout = document.createElement('span');
    inout.id = 'in-out';
    this.arrowVertical = document.createElement('span');
    this.arrowVertical.id = 'arrow-vertical';
    this.arrowVertical.innerHTML = '↓↑\xa0';

    footer.appendChild(inout);
    footer.appendChild(this.arrowVertical);
    parent.appendChild(footer);
  }

  /* END OF MCDU INTERFACE/LAYOUT */
  /* MCDU SCRATCHPAD */

  public setScratchpadUserData(value: string) {
    this.scratchpad.setUserData(value);
  }

  private clearFocus() {
    this.inFocus = false;
    this.allSelected = false;
    try {
      Coherent.trigger('UNFOCUS_INPUT_FIELD', this.scratchpadDisplay.guid);
    } catch (e) {
      console.error(e);
    }
    this.scratchpadDisplay.setStyle(null);
    // This is legal but the TS DOM types mark it readonly.
    (this.getChildById('header').style as unknown as any) = null;
    if (this.check_focus) {
      clearInterval(this.check_focus);
    }
  }

  private initKeyboardScratchpad() {
    window.document.addEventListener('click', () => {
      const mcduInput = NXDataStore.get('MCDU_KB_INPUT', 'DISABLED');
      const mcduTimeout = parseInt(NXDataStore.get('CONFIG_MCDU_KB_TIMEOUT', '60'));
      const isPoweredL = SimVar.GetSimVarValue('L:A32NX_ELEC_AC_ESS_SHED_BUS_IS_POWERED', 'Number');
      const isPoweredR = SimVar.GetSimVarValue('L:A32NX_ELEC_AC_2_BUS_IS_POWERED', 'Number');

      // TODO: L/R MCDU
      if (mcduInput === 'ENABLED') {
        this.inFocus = !this.inFocus;
        if (this.inFocus && (isPoweredL || isPoweredR)) {
          // This is legal but the TS DOM types mark it readonly.
          (this.getChildById('header').style as unknown as any) =
            'background: linear-gradient(180deg, rgba(2,182,217,1.0) 65%, rgba(255,255,255,0.0) 65%);';
          this.scratchpadDisplay.setStyle('display: inline-block; width:87%; background: rgba(255,255,255,0.2);');
          try {
            Coherent.trigger('FOCUS_INPUT_FIELD', this.scratchpadDisplay.guid, '', '', '', false);
          } catch (e) {
            console.error(e);
          }
          this.lastInput = new Date();
          if (mcduTimeout) {
            this.check_focus = setInterval(
              () => {
                if (Math.abs(Date.now() - this.lastInput.getTime()) / 1000 >= mcduTimeout) {
                  this.clearFocus();
                }
              },
              Math.min((mcduTimeout * 1000) / 2, 1000),
            );
          }
        } else {
          this.clearFocus();
        }
      } else {
        this.clearFocus();
      }
    });
    window.document.addEventListener('keydown', (e) => {
      // MCDU should not accept input while unpowered
      if (this.inFocus && SimVar.GetSimVarValue('L:A32NX_ELEC_AC_ESS_SHED_BUS_IS_POWERED', 'Number')) {
        let keycode = e.keyCode;
        this.lastInput = new Date();
        if (keycode >= KeyCode.KEY_NUMPAD0 && keycode <= KeyCode.KEY_NUMPAD9) {
          keycode -= 48; // numpad support
        }
        // Note: tried using H-events, worse performance. Reverted to direct input.
        // Preventing repeated input also similarly felt awful and defeated the point.
        // Clr hold functionality pointless as scratchpad will be cleared (repeated input).

        if (e.altKey || (e.ctrlKey && keycode === KeyCode.KEY_Z)) {
          this.clearFocus();
        } else if (e.ctrlKey && keycode === KeyCode.KEY_A) {
          this.allSelected = !this.allSelected;
          this.scratchpadDisplay.setStyle(
            `display: inline-block; width:87%; background: ${this.allSelected ? 'rgba(235,64,52,1.0)' : 'rgba(255,255,255,0.2)'};`,
          );
        } else if (e.shiftKey && e.ctrlKey && keycode === KeyCode.KEY_BACK_SPACE) {
          this.setScratchpadText('');
        } else if (e.ctrlKey && keycode === KeyCode.KEY_BACK_SPACE) {
          const scratchpadTextContent = this.scratchpad.getText();
          let wordFlag = !scratchpadTextContent.includes(' ');
          for (let i = scratchpadTextContent.length; i > 0; i--) {
            if (scratchpadTextContent.slice(-1) === ' ') {
              if (!wordFlag) {
                this.onClr();
              } else {
                wordFlag = true;
                break;
              }
            }
            if (scratchpadTextContent.slice(-1) !== ' ') {
              if (!wordFlag) {
                wordFlag = true;
              } else {
                this.onClr();
              }
            }
          }
        } else if (e.shiftKey && keycode === KeyCode.KEY_BACK_SPACE) {
          if (!this.check_clr) {
            this.onClr();
            this.check_clr = setTimeout(() => {
              this.onClrHeld();
            }, 2000);
          }
          SimVar.SetSimVarValue('L:A32NX_MCDU_PUSH_ANIM_1_CLR', 'Number', 1);
          SimVar.SetSimVarValue('L:A32NX_MCDU_PUSH_ANIM_2_CLR', 'Number', 1);
        } else if (
          (keycode >= KeyCode.KEY_0 && keycode <= KeyCode.KEY_9) ||
          (keycode >= KeyCode.KEY_A && keycode <= KeyCode.KEY_Z)
        ) {
          const letter = String.fromCharCode(keycode);
          this.onLetterInput(letter);
          SimVar.SetSimVarValue('L:A32NX_MCDU_PUSH_ANIM_1_' + letter.toUpperCase(), 'Number', 1); // TODO: L/R [1/2] side MCDU Split
          SimVar.SetSimVarValue('L:A32NX_MCDU_PUSH_ANIM_2_' + letter.toUpperCase(), 'Number', 1);
        } else if (keycode === KeyCode.KEY_PERIOD || keycode === KeyCode.KEY_DECIMAL) {
          this.onDot();
          SimVar.SetSimVarValue('L:A32NX_MCDU_PUSH_ANIM_1_DOT', 'Number', 1);
          SimVar.SetSimVarValue('L:A32NX_MCDU_PUSH_ANIM_2_DOT', 'Number', 1);
        } else if (
          keycode === KeyCode.KEY_SLASH ||
          keycode === KeyCode.KEY_BACK_SLASH ||
          keycode === KeyCode.KEY_DIVIDE ||
          keycode === 226
        ) {
          this.onDiv();
          SimVar.SetSimVarValue('L:A32NX_MCDU_PUSH_ANIM_1_SLASH', 'Number', 1);
          SimVar.SetSimVarValue('L:A32NX_MCDU_PUSH_ANIM_2_SLASH', 'Number', 1);
        } else if (keycode === KeyCode.KEY_BACK_SPACE || keycode === KeyCode.KEY_DELETE) {
          if (this.allSelected) {
            this.setScratchpadText('');
          } else if (!this.clrStop) {
            this.onClr();
            SimVar.SetSimVarValue('L:A32NX_MCDU_PUSH_ANIM_1_CLR', 'Number', 1);
            SimVar.SetSimVarValue('L:A32NX_MCDU_PUSH_ANIM_2_CLR', 'Number', 1);
            this.clrStop = this.scratchpad.isClearStop();
          }
        } else if (keycode === KeyCode.KEY_SPACE) {
          this.onSp();
          SimVar.SetSimVarValue('L:A32NX_MCDU_PUSH_ANIM_1_SP', 'Number', 1);
          SimVar.SetSimVarValue('L:A32NX_MCDU_PUSH_ANIM_2_SP', 'Number', 1);
        } else if (keycode === 189 || keycode === KeyCode.KEY_SUBTRACT) {
          this.onPlusMinus('-');
          SimVar.SetSimVarValue('L:A32NX_MCDU_PUSH_ANIM_1_PLUSMINUS', 'Number', 1);
          SimVar.SetSimVarValue('L:A32NX_MCDU_PUSH_ANIM_2_PLUSMINUS', 'Number', 1);
        } else if (keycode === 187 || keycode === KeyCode.KEY_ADD) {
          this.onPlusMinus('+');
          SimVar.SetSimVarValue('L:A32NX_MCDU_PUSH_ANIM_1_PLUSMINUS', 'Number', 1);
          SimVar.SetSimVarValue('L:A32NX_MCDU_PUSH_ANIM_2_PLUSMINUS', 'Number', 1);
        } else if (keycode >= KeyCode.KEY_F1 && keycode <= KeyCode.KEY_F6) {
          const func_num = keycode - KeyCode.KEY_F1;
          this.onLeftFunction(func_num);
          SimVar.SetSimVarValue('L:A32NX_MCDU_PUSH_ANIM_1_L' + (func_num + 1), 'Number', 1);
          SimVar.SetSimVarValue('L:A32NX_MCDU_PUSH_ANIM_2_L' + (func_num + 1), 'Number', 1);
        } else if (keycode >= KeyCode.KEY_F7 && keycode <= KeyCode.KEY_F12) {
          const func_num = keycode - KeyCode.KEY_F7;
          this.onRightFunction(func_num);
          SimVar.SetSimVarValue('L:A32NX_MCDU_PUSH_ANIM_1_R' + (func_num + 1), 'Number', 1);
          SimVar.SetSimVarValue('L:A32NX_MCDU_PUSH_ANIM_2_R' + (func_num + 1), 'Number', 1);
        }
      }
    });
    window.document.addEventListener('keyup', (e) => {
      this.lastInput = new Date();
      const keycode = e.keyCode;
      if (keycode === KeyCode.KEY_BACK_SPACE || keycode === KeyCode.KEY_DELETE) {
        this.clrStop = false;
      }
      if (this.check_clr) {
        clearTimeout(this.check_clr);
        this.check_clr = undefined;
      }
    });
  }

  /* END OF MCDU SCRATCHPAD */
  /* MCDU MESSAGE SYSTEM */

  /**
   * Display a type I message on the active subsystem's scratch pad
   */
  public setScratchpadMessage(message: McduMessage) {
    if (message instanceof TypeIIMessage) {
      console.error('Type II message passed to setScratchpadMessage! Redirecting to the queue.', message);
      this.addMessageToQueue(message);
      return;
    }

    if (this.scratchpad) {
      this.scratchpad.setMessage(message);
    }
  }

  public setScratchpadText(value: string) {
    this.scratchpad.setText(value);
  }

  // FIXME move non-FMS code out of FMS
  /**
   * General ATSU message handler which converts ATSU status codes to new MCDU messages
   * @param code ATSU status code
   */
  public addNewAtsuMessage(code: AtsuStatusCodes) {
    if (!this.atsuScratchpad) {
      return;
    }
    switch (code) {
      case AtsuStatusCodes.CallsignInUse:
        this.atsuScratchpad.setMessage(NXFictionalMessages.fltNbrInUse);
        break;
      case AtsuStatusCodes.NoHoppieConnection:
        this.atsuScratchpad.setMessage(NXFictionalMessages.noHoppieConnection);
        break;
      case AtsuStatusCodes.ComFailed:
        this.atsuScratchpad.setMessage(NXSystemMessages.comUnavailable);
        break;
      case AtsuStatusCodes.NoAtc:
        this.atsuScratchpad.setMessage(NXSystemMessages.noAtc);
        break;
      case AtsuStatusCodes.MailboxFull:
        this.atsuScratchpad.setMessage(NXSystemMessages.dcduFileFull);
        break;
      case AtsuStatusCodes.UnknownMessage:
        this.atsuScratchpad.setMessage(NXFictionalMessages.unknownAtsuMessage);
        break;
      case AtsuStatusCodes.ProxyError:
        this.atsuScratchpad.setMessage(NXFictionalMessages.reverseProxy);
        break;
      case AtsuStatusCodes.NoTelexConnection:
        this.atsuScratchpad.setMessage(NXFictionalMessages.telexNotEnabled);
        break;
      case AtsuStatusCodes.OwnCallsign:
        this.atsuScratchpad.setMessage(NXSystemMessages.noAtc);
        break;
      case AtsuStatusCodes.SystemBusy:
        this.atsuScratchpad.setMessage(NXSystemMessages.systemBusy);
        break;
      case AtsuStatusCodes.NewAtisReceived:
        this.atsuScratchpad.setMessage(NXSystemMessages.newAtisReceived);
        break;
      case AtsuStatusCodes.NoAtisReceived:
        this.atsuScratchpad.setMessage(NXSystemMessages.noAtisReceived);
        break;
      case AtsuStatusCodes.EntryOutOfRange:
        this.atsuScratchpad.setMessage(NXSystemMessages.entryOutOfRange);
        break;
      case AtsuStatusCodes.FormatError:
        this.atsuScratchpad.setMessage(NXSystemMessages.formatError);
        break;
      case AtsuStatusCodes.NotInDatabase:
        this.atsuScratchpad.setMessage(NXSystemMessages.notInDatabase);
        break;
      default:
        break;
    }
  }

  /* END OF MCDU MESSAGE SYSTEM */
  /* MCDU EVENTS */

  public onPowerOn() {
    super.onPowerOn();
  }

  protected onEvent(_event) {
    super.onEvent(_event);

    // MCDU should not accept input while unpowered
    if (!SimVar.GetSimVarValue('L:A32NX_ELEC_AC_ESS_SHED_BUS_IS_POWERED', 'Number')) {
      return;
    }

    const isLeftMcduEvent = _event.indexOf('1_BTN_') !== -1;
    const isRightMcduEvent = _event.indexOf('2_BTN_') !== -1;

    if (isLeftMcduEvent || isRightMcduEvent || _event.indexOf('BTN_') !== -1) {
      const input = _event.replace('1_BTN_', '').replace('2_BTN_', '').replace('BTN_', '');
      if (this._keypad.onKeyPress(input, isRightMcduEvent ? 'R' : 'L')) {
        return;
      }

      if (input.length === 2 && input[0] === 'L') {
        const v = parseInt(input[1]) - 1;
        if (isFinite(v)) {
          this.onLeftFunction(v);
        }
      } else if (input.length === 2 && input[0] === 'R') {
        const v = parseInt(input[1]) - 1;
        if (isFinite(v)) {
          this.onRightFunction(v);
        }
      } else {
        console.log("'" + input + "'");
      }
    }
  }

  private onLsk(fncAction, fncActionDelay = this.getDelayBasic) {
    if (!fncAction) {
      return;
    }

    // First timeout simulates delay for key press
    // Second delay simulates delay for input validation
    const cur = this.page.Current;
    setTimeout(() => {
      const value = this.scratchpad.removeUserContentFromScratchpadAndDisplayAndReturnTextContent();
      setTimeout(() => {
        if (this.page.Current === cur) {
          fncAction(value, () => this.setScratchpadUserData(value));
        }
      }, fncActionDelay());
    }, 100);
  }

  /**
   * Handle brightness key events
   */
  public onBrightnessKey(side: 'L' | 'R', sign: -1 | 1) {
    const oldBrightness = side === 'R' ? this.rightBrightness : this.leftBrightness;
    SimVar.SetSimVarValue(
      `L:A32NX_MCDU_${side}_BRIGHTNESS`,
      'number',
      Math.max(
        A320_Neo_CDU_MainDisplay.MIN_BRIGHTNESS,
        Math.min(A320_Neo_CDU_MainDisplay.MAX_BRIGHTNESS, oldBrightness + sign * 0.2 * oldBrightness),
      ),
    );
  }

  /* END OF MCDU EVENTS */
  /* MCDU DELAY SIMULATION */

  /**
   * Used for switching pages
   * @returns delay in ms between 150 and 200
   */
  public getDelaySwitchPage(): number {
    return 150 + 50 * Math.random();
  }

  /**
   * Used for basic inputs e.g. alternate airport, ci, fl, temp, constraints, ...
   * @returns delay in ms between 300 and 400
   */
  public getDelayBasic(): number {
    return 300 + 100 * Math.random();
  }

  /**
   * Used for e.g. loading time fore pages
   * @returns delay in ms between 600 and 800
   */
  public getDelayMedium(): number {
    return 600 + 200 * Math.random();
  }

  /**
   * Used for intense calculation
   * @returns delay in ms between 900 and 12000
   */
  public getDelayHigh(): number {
    return 900 + 300 * Math.random();
  }

  /**
   * Used for calculation time for fuel pred page
   * @returns dynamic delay in ms between 2000ms and 4000ms
   */
  public getDelayFuelPred(): number {
    return Math.max(2000, Math.min(4000, 225 * this.getActivePlanLegCount()));
  }

  /**
   * Used to load wind data into sfms
   * @returns dynamic delay in ms dependent on amount of waypoints
   */
  public getDelayWindLoad(): number {
    return Math.pow(this.getActivePlanLegCount(), 2);
  }

  /**
   * Tries to delete a pages timeout
   */
  private tryDeleteTimeout() {
    if (this.SelfPtr) {
      clearTimeout(this.SelfPtr);
      this.SelfPtr = false;
    }
  }

  /* END OF MCDU DELAY SIMULATION */
  /* MCDU AOC MESSAGE SYSTEM */

  public printPage(lines: any[]) {
    if (this.printing) {
      return;
    }
    this.printing = true;

    const formattedValues = lines.map((l) => {
      return l
        .replace(/\[color]cyan/g, '<br/>')
        .replace(/{white}[-]{3,}{end}/g, '<br/>')
        .replace(/{end}/g, '<br/>')
        .replace(/(\[color][a-z]*)/g, '')
        .replace(/{[a-z]*}/g, '');
    });

    const websocketLines = formattedValues.map((l) => {
      return l.replace(/<br\/>[ ]*/g, '\n');
    });

    if (SimVar.GetSimVarValue('L:A32NX_PRINTER_PRINTING', 'bool') === 1) {
      SimVar.SetSimVarValue(
        'L:A32NX_PAGES_PRINTED',
        'number',
        SimVar.GetSimVarValue('L:A32NX_PAGES_PRINTED', 'number') + 1,
      );
      SimVar.SetSimVarValue('L:A32NX_PRINT_PAGE_OFFSET', 'number', 0);
    }
    SimVar.SetSimVarValue('L:A32NX_PRINT_LINES', 'number', lines.length);
    SimVar.SetSimVarValue('L:A32NX_PAGE_ID', 'number', SimVar.GetSimVarValue('L:A32NX_PAGE_ID', 'number') + 1);
    SimVar.SetSimVarValue('L:A32NX_PRINTER_PRINTING', 'bool', 0).then(() => {
      this.fmgcMesssagesListener.triggerToAllSubscribers('A32NX_PRINT', formattedValues);
      this.sendToMcduServerClient(`print:${JSON.stringify({ lines: websocketLines })}`);
      setTimeout(() => {
        SimVar.SetSimVarValue('L:A32NX_PRINTER_PRINTING', 'bool', 1);
        this.printing = false;
      }, 2500);
    });
  }

  /* END OF MCDU AOC MESSAGE SYSTEM */

  /* MCDU SERVER CLIENT */

  /**
   * Sends a message to the websocket server (if connected)
   * @param {string} message
   */
  private sendToMcduServerClient(message: string) {
    if (this.mcduServerClient && this.mcduServerClient.isConnected()) {
      try {
        this.mcduServerClient.send(message);
      } catch (e) {
        /** ignore **/
      }
    }
  }

  /**
   * Sends an update to the websocket server (if connected) with the current state of the MCDU
   */
  public sendUpdate() {
    // only calculate update when mcduServerClient is established.
    if (this.mcduServerClient && !this.mcduServerClient.isConnected()) {
      return;
    }
    let left = this.emptyLines;
    let right = this.emptyLines;

    const mcdu1Powered = SimVar.GetSimVarValue('L:A32NX_ELEC_AC_ESS_SHED_BUS_IS_POWERED', 'bool');
    const mcdu2Powered = SimVar.GetSimVarValue('L:A32NX_ELEC_AC_2_BUS_IS_POWERED', 'bool');
    const integralLightsPowered = SimVar.GetSimVarValue('L:A32NX_ELEC_AC_1_BUS_IS_POWERED', 'bool');

    let screenState;
    if (mcdu1Powered || mcdu2Powered) {
      screenState = {
        lines: [
          this._labels[0],
          this._lines[0],
          this._labels[1],
          this._lines[1],
          this._labels[2],
          this._lines[2],
          this._labels[3],
          this._lines[3],
          this._labels[4],
          this._lines[4],
          this._labels[5],
          this._lines[5],
        ],
        scratchpad: `{${this.scratchpadDisplay.getColor()}}${this.scratchpadDisplay.getText()}{end}`,
        title: this._title,
        titleLeft: `{small}${this._titleLeft}{end}`,
        page: this._pageCount > 0 ? `{small}${this._pageCurrent}/${this._pageCount}{end}` : '',
        arrows: this._arrows,
        integralBrightness: integralLightsPowered
          ? SimVar.GetSimVarValue('A:LIGHT POTENTIOMETER:85', 'percent over 100')
          : 0,
      };
    }

    if (mcdu1Powered) {
      left = Object.assign({}, screenState);
      left.annunciators = this.annunciators.left;
      left.displayBrightness = this.leftBrightness / A320_Neo_CDU_MainDisplay.MAX_BRIGHTNESS;
    }

    if (mcdu2Powered) {
      right = Object.assign({}, screenState);
      right.annunciators = this.annunciators.right;
      right.displayBrightness = this.rightBrightness / A320_Neo_CDU_MainDisplay.MAX_BRIGHTNESS;
    }

    const content = { right, left };
    this.sendToMcduServerClient(`update:${JSON.stringify(content)}`);
  }

  /**
   * Clears the remote MCDU clients' screens
   */
  private sendClearScreen() {
    // only calculate update when mcduServerClient is established.
    if (this.mcduServerClient && !this.mcduServerClient.isConnected()) {
      return;
    }
    const left = this.emptyLines;
    const right = left;
    const content = { right, left };
    this.sendToMcduServerClient(`update:${JSON.stringify(content)}`);
  }

  /* END OF WEBSOCKET */

  public goToFuelPredPage(forPlan: FlightPlanIndex) {
    if (this.isAnEngineOn()) {
      CDUFuelPredPage.ShowPage(this);
    } else {
      CDUInitPage.ShowPage2(this, forPlan);
    }
  }

  public logTroubleshootingError(msg: any) {
    this.bus.pub('troubleshooting_log_error', String(msg), true, false);
  }
}
// registerInstrument('a320-neo-cdu-main-display', A320_Neo_CDU_MainDisplay);
