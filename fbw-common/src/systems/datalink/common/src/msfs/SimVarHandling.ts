//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Arinc429Word, Arinc429SignStatusMatrix } from '@flybywiresim/fbw-sdk';
import {
  EventBus,
  EventSubscriber,
  Publisher,
  SimVarDefinition,
  SimVarPublisher,
  SimVarValueType,
} from '@microsoft/msfs-sdk';
import { AtcMessageButtonBusMessages } from '../../../atc/src';
import { ClockDataBusTypes, FmgcDataBusTypes, FwcDataBusTypes, RmpDataBusTypes } from '../databus';

interface SimVars {
  msfsUtcYear: number;
  msfsUtcMonth: number;
  msfsUtcDayOfMonth: number;
  msfsUtcSeconds: number;
  msfsPresentPositionLatitude: number;
  msfsPresentPositionLongitude: number;
  msfsPresentAltitude: number;
  msfsPresentHeading: number;
  msfsPresentTrack: number;
  msfsComputedAirspeed: number;
  msfsPresentMach: number;
  msfsGroundSpeed: number;
  msfsVerticalSpeed: number;
  msfsAutopilotActive: boolean;
  msfsAutothrustMode: number;
  msfsAutothrustSelectedMach: number;
  msfsAutothrustSelectedKnots: number;
  msfsWindDirection: number;
  msfsWindSpeed: number;
  msfsStaticAirTemperature: number;
  msfsFlightPhase: number;
  msfsVhf3Powered: number;
  msfsVhf3Frequency: number;
  msfsTransponderCode: number;
  msfsCompanyMessageCount: number;
  msfsAtcMessageButtonActive: boolean;
  msfsAtcMessageButtonPressed: number;
}

export enum SimVarSources {
  utcYear = 'E:ZULU YEAR',
  utcMonth = 'E:ZULU MONTH OF YEAR',
  utcDayOfMonth = 'E:ZULU DAY OF MONTH',
  utcSeconds = 'E:ZULU TIME',
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
  vhf3Powered = 'L:A32NX_ELEC_DC_1_BUS_IS_POWERED',
  vhf3Frequency = 'A:COM ACTIVE FREQUENCY:3',
  transponderCode = 'TRANSPONDER CODE:1',
  companyMessageCount = 'L:A32NX_COMPANY_MSG_COUNT',
  atcMessageButtonActive = 'L:A32NX_DCDU_ATC_MSG_WAITING',
  atcMessageButtonPressed = 'L:A32NX_DCDU_ATC_MSG_ACK',
}

export class SimVarHandling extends SimVarPublisher<SimVars> {
  private subscriber: EventSubscriber<SimVars> = null;

  private datalinkPublisher: Publisher<
    AtcMessageButtonBusMessages & ClockDataBusTypes & FmgcDataBusTypes & RmpDataBusTypes & FwcDataBusTypes
  > = null;

  private static simvars = new Map<keyof SimVars, SimVarDefinition>([
    ['msfsUtcYear', { name: SimVarSources.utcYear, type: SimVarValueType.Number }],
    ['msfsUtcMonth', { name: SimVarSources.utcMonth, type: SimVarValueType.Number }],
    ['msfsUtcDayOfMonth', { name: SimVarSources.utcDayOfMonth, type: SimVarValueType.Number }],
    ['msfsUtcSeconds', { name: SimVarSources.utcSeconds, type: SimVarValueType.Number }],
    ['msfsPresentPositionLatitude', { name: SimVarSources.presentPositionLatitude, type: SimVarValueType.Number }],
    ['msfsPresentPositionLongitude', { name: SimVarSources.presentPositionLongitude, type: SimVarValueType.Number }],
    ['msfsPresentAltitude', { name: SimVarSources.presentAltitude, type: SimVarValueType.Number }],
    ['msfsPresentHeading', { name: SimVarSources.presentHeading, type: SimVarValueType.Number }],
    ['msfsPresentTrack', { name: SimVarSources.presentTrack, type: SimVarValueType.Number }],
    ['msfsComputedAirspeed', { name: SimVarSources.computedAirspeed, type: SimVarValueType.Number }],
    ['msfsPresentMach', { name: SimVarSources.presentMach, type: SimVarValueType.Number }],
    ['msfsGroundSpeed', { name: SimVarSources.groundSpeed, type: SimVarValueType.Number }],
    ['msfsAutopilotActive', { name: SimVarSources.autopilotActive, type: SimVarValueType.Number }],
    ['msfsAutothrustMode', { name: SimVarSources.autothrustMode, type: SimVarValueType.Number }],
    ['msfsAutothrustSelectedMach', { name: SimVarSources.autothrustSelectedMach, type: SimVarValueType.Number }],
    ['msfsAutothrustSelectedKnots', { name: SimVarSources.autothrustSelectedKnots, type: SimVarValueType.Knots }],
    ['msfsWindDirection', { name: SimVarSources.windDirection, type: SimVarValueType.Number }],
    ['msfsWindSpeed', { name: SimVarSources.windSpeed, type: SimVarValueType.Number }],
    ['msfsStaticAirTemperature', { name: SimVarSources.staticAirTemperature, type: SimVarValueType.Number }],
    ['msfsFlightPhase', { name: SimVarSources.flightPhase, type: SimVarValueType.Number }],
    ['msfsVhf3Powered', { name: SimVarSources.vhf3Powered, type: SimVarValueType.Number }],
    ['msfsVhf3Frequency', { name: SimVarSources.vhf3Frequency, type: SimVarValueType.MHz }],
    ['msfsTransponderCode', { name: SimVarSources.transponderCode, type: SimVarValueType.Number }],
    ['msfsCompanyMessageCount', { name: SimVarSources.companyMessageCount, type: SimVarValueType.Number }],
    ['msfsAtcMessageButtonActive', { name: SimVarSources.atcMessageButtonActive, type: SimVarValueType.Bool }],
    ['msfsAtcMessageButtonPressed', { name: SimVarSources.atcMessageButtonPressed, type: SimVarValueType.Number }],
  ]);

  public constructor(private readonly eventBus: EventBus) {
    super(SimVarHandling.simvars, eventBus);
  }

  private connectedCallback(): void {
    super.subscribe('msfsUtcYear');
    super.subscribe('msfsUtcMonth');
    super.subscribe('msfsUtcDayOfMonth');
    super.subscribe('msfsUtcSeconds');
    super.subscribe('msfsPresentPositionLatitude');
    super.subscribe('msfsPresentPositionLongitude');
    super.subscribe('msfsPresentAltitude');
    super.subscribe('msfsPresentHeading');
    super.subscribe('msfsPresentTrack');
    super.subscribe('msfsComputedAirspeed');
    super.subscribe('msfsPresentMach');
    super.subscribe('msfsGroundSpeed');
    super.subscribe('msfsVerticalSpeed');
    super.subscribe('msfsAutopilotActive');
    super.subscribe('msfsAutothrustMode');
    super.subscribe('msfsAutothrustSelectedMach');
    super.subscribe('msfsAutothrustSelectedKnots');
    super.subscribe('msfsWindDirection');
    super.subscribe('msfsWindSpeed');
    super.subscribe('msfsStaticAirTemperature');
    super.subscribe('msfsFlightPhase');
    super.subscribe('msfsVhf3Powered');
    super.subscribe('msfsVhf3Frequency');
    super.subscribe('msfsTransponderCode');
    super.subscribe('msfsCompanyMessageCount');
    super.subscribe('msfsAtcMessageButtonActive');
    super.subscribe('msfsAtcMessageButtonPressed');
  }

  public initialize(): void {
    this.datalinkPublisher = this.eventBus.getPublisher<
      AtcMessageButtonBusMessages & ClockDataBusTypes & FmgcDataBusTypes & RmpDataBusTypes & FwcDataBusTypes
    >();
    this.subscriber = this.eventBus.getSubscriber<SimVars>();

    this.subscriber
      .on('msfsUtcYear')
      .handle((year: number) => this.datalinkPublisher.pub('utcYear', year, false, false));
    this.subscriber
      .on('msfsUtcMonth')
      .handle((month: number) => this.datalinkPublisher.pub('utcMonth', month, false, false));
    this.subscriber
      .on('msfsUtcDayOfMonth')
      .handle((day: number) => this.datalinkPublisher.pub('utcDayOfMonth', day, false, false));
    this.subscriber.on('msfsUtcSeconds').handle((seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor(seconds / 60) % 60;
      const secondsOfMinute = Math.floor(seconds) - hours * 3600 + minutes * 60;

      this.datalinkPublisher.pub('utcHour', hours, false, false);
      this.datalinkPublisher.pub('utcMinute', minutes, false, false);
      this.datalinkPublisher.pub('utcSecond', secondsOfMinute, false, false);
      this.datalinkPublisher.pub('utcSecondsOfDay', seconds, false, false);
    });
    this.subscriber.on('msfsPresentPositionLatitude').handle((latitude: number) => {
      this.datalinkPublisher.pub('presentPositionLatitude', new Arinc429Word(latitude), false, false);
    });
    this.subscriber.on('msfsPresentPositionLongitude').handle((longitude: number) => {
      this.datalinkPublisher.pub('presentPositionLongitude', new Arinc429Word(longitude), false, false);
    });
    this.subscriber.on('msfsPresentAltitude').handle((altitude: number) => {
      this.datalinkPublisher.pub('presentAltitude', new Arinc429Word(altitude), false, false);
    });
    this.subscriber.on('msfsPresentHeading').handle((heading: number) => {
      this.datalinkPublisher.pub('presentHeading', new Arinc429Word(heading), false, false);
    });
    this.subscriber.on('msfsPresentTrack').handle((track: number) => {
      this.datalinkPublisher.pub('presentTrack', new Arinc429Word(track), false, false);
    });
    this.subscriber.on('msfsComputedAirspeed').handle((cas: number) => {
      this.datalinkPublisher.pub('computedAirspeed', new Arinc429Word(cas), false, false);
    });
    this.subscriber.on('msfsPresentMach').handle((mach: number) => {
      this.datalinkPublisher.pub('presentMach', new Arinc429Word(mach), false, false);
    });
    this.subscriber.on('msfsGroundSpeed').handle((groundSpeed: number) => {
      this.datalinkPublisher.pub('groundSpeed', new Arinc429Word(groundSpeed), false, false);
    });
    this.subscriber.on('msfsVerticalSpeed').handle((verticalSpeed: number) => {
      this.datalinkPublisher.pub('verticalSpeed', new Arinc429Word(verticalSpeed), false, false);
    });
    this.subscriber.on('msfsAutopilotActive').handle((active: boolean) => {
      this.datalinkPublisher.pub('autopilotActive', new Arinc429Word(active === true ? 1 : 0), false, false);
    });
    this.subscriber.on('msfsAutothrustMode').handle((mode: number) => {
      this.datalinkPublisher.pub('autothrustMode', new Arinc429Word(mode), false, false);
    });
    this.subscriber.on('msfsAutothrustSelectedMach').handle((mach: number) => {
      const word = new Arinc429Word(0.0);
      word.ssm = Arinc429SignStatusMatrix.NormalOperation;
      word.value = mach;

      this.datalinkPublisher.pub('autothrustSelectedMach', word, false, false);
    });
    this.subscriber.on('msfsAutothrustSelectedKnots').handle((knots: number) => {
      const word = new Arinc429Word(0.0);
      word.ssm = Arinc429SignStatusMatrix.NormalOperation;
      word.value = knots;

      this.datalinkPublisher.pub('autothrustSelectedKnots', word, false, false);
    });
    this.subscriber.on('msfsWindDirection').handle((direction: number) => {
      this.datalinkPublisher.pub('windDirection', new Arinc429Word(direction), false, false);
    });
    this.subscriber.on('msfsWindSpeed').handle((speed: number) => {
      this.datalinkPublisher.pub('windSpeed', new Arinc429Word(speed), false, false);
    });
    this.subscriber.on('msfsStaticAirTemperature').handle((sat: number) => {
      this.datalinkPublisher.pub('staticAirTemperature', new Arinc429Word(sat), false, false);
    });
    this.subscriber.on('msfsFlightPhase').handle((phase: number) => {
      this.datalinkPublisher.pub('flightPhase', new Arinc429Word(phase), false, false);
    });
    this.subscriber
      .on('msfsVhf3Powered')
      .handle((powered: number) => this.datalinkPublisher.pub('vhf3Powered', powered !== 0, false, false));
    this.subscriber
      .on('msfsVhf3Frequency')
      .handle((frequency: number) => this.datalinkPublisher.pub('vhf3DataMode', frequency === 0, false, false));
    this.subscriber
      .on('msfsTransponderCode')
      .handle((code: number) => this.datalinkPublisher.pub('transponderCode', code, false, false));
    this.subscriber
      .on('msfsCompanyMessageCount')
      .handle((count: number) => this.datalinkPublisher.pub('companyMessageCount', count, false, false));
    this.subscriber
      .on('msfsAtcMessageButtonActive')
      .handle((active: boolean) => this.datalinkPublisher.pub('atcMessageButtonActive', active, false, false));
    this.subscriber
      .on('msfsAtcMessageButtonPressed')
      .handle((pressed: number) => this.datalinkPublisher.pub('atcMessageButtonPressed', pressed !== 0, false, false));

    this.connectedCallback();
  }

  public startPublish(): void {
    super.startPublish();
  }

  public update(): void {
    super.onUpdate();
  }
}
