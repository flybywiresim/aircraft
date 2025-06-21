// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { BasePublisher, EventBus, SimVarDefinition, SimVarValueType } from '@microsoft/msfs-sdk';
import { ArincEventBus, HUDSyntheticRunway, GenericDataListenerSync } from '@flybywiresim/fbw-sdk';

import {
  AdirsSimVarDefinitions,
  AdirsSimVars,
  SwitchingPanelSimVarsDefinitions,
  SwitchingPanelVSimVars,
} from '../../MsfsAvionicsCommon/SimVarTypes';
import { UpdatableSimVarPublisher } from '../../MsfsAvionicsCommon/UpdatableSimVarPublisher';

export type HUDSimvars = AdirsSimVars &
  SwitchingPanelVSimVars & {
    spoilersCommanded: number;
    rev1: number;
    rev2: number;
    eng1State: number;
    eng2State: number;
    baroMode: number;
    targetSpeedManaged: number;
    showSelectedHeading: number;
    athrStatus: number;
    approachCapability: number;
    ap1Active: boolean;
    ap2Active: boolean;
    tcasModeDisarmed: boolean;
    crzAltMode: boolean;
    expediteMode: boolean;
    fmaSpeedProtection: boolean;
    fmaModeReversion: boolean;
    apVsSelected: number;
    selectedFpa: number;
    athrModeMessage: number;
    trkFpaDeselectedTCAS: boolean;
    tcasRaInhibited: boolean;
    machPreselVal: number;
    speedPreselVal: number;
    activeLateralMode: number;
    activeVerticalMode: number;
    fmaVerticalArmed: number;
    fmaLateralArmed: number;
    metricAltToggle: boolean;
    altConstraint: number;
    ls1Button: boolean;
    ls2Button: boolean;
    selectedHeading: number;
    fd1Active: boolean;
    fd2Active: boolean;
    AThrMode: number;
    crosswindModeL: boolean;
    declutterModeL: number;
    crosswindModeR: boolean;
    declutterModeR: number;
    hudPotentiometerCaptain: number;
    hudPotentiometerFo: number;
    trueHeadingRaw: number;
    trueTrackRaw: number;
    fcuAtsFmaDiscreteWordRaw: number;
  };

export enum HUDVars {
  spoilersCommanded = 'L:A32NX_LEFT_SPOILER_1_COMMANDED_POSITION',
  eng1State = 'L:A32NX_ENGINE_STATE:1',
  eng2State = 'L:A32NX_ENGINE_STATE:2',
  rev1 = 'L:A32NX_AUTOTHRUST_REVERSE:1',
  rev2 = 'L:A32NX_AUTOTHRUST_REVERSE:2',
  baroMode = 'L:A32NX_FCU_EFIS_L_DISPLAY_BARO_VALUE_MODE',
  targetSpeedManaged = 'L:A32NX_SPEEDS_MANAGED_PFD',
  showSelectedHeading = 'L:A320_FCU_SHOW_SELECTED_HEADING',
  athrStatus = 'L:A32NX_AUTOTHRUST_STATUS',
  approachCapability = 'L:A32NX_ApproachCapability',
  ap1Active = 'L:A32NX_AUTOPILOT_1_ACTIVE',
  ap2Active = 'L:A32NX_AUTOPILOT_2_ACTIVE',
  crzAltMode = 'L:A32NX_FMA_CRUISE_ALT_MODE',
  tcasModeDisarmed = 'L:A32NX_AUTOPILOT_TCAS_MESSAGE_DISARM',
  expediteMode = 'L:A32NX_FMA_EXPEDITE_MODE',
  fmaSpeedProtection = 'L:A32NX_FMA_SPEED_PROTECTION_MODE',
  fmaModeReversion = 'L:A32NX_FMA_MODE_REVERSION',
  apVsSelected = 'L:A32NX_AUTOPILOT_VS_SELECTED',
  selectedFpa = 'L:A32NX_AUTOPILOT_FPA_SELECTED',
  athrModeMessage = 'L:A32NX_AUTOTHRUST_MODE_MESSAGE',
  trkFpaDeselectedTCAS = 'L:A32NX_AUTOPILOT_TCAS_MESSAGE_TRK_FPA_DESELECTION',
  tcasRaInhibited = 'L:A32NX_AUTOPILOT_TCAS_MESSAGE_RA_INHIBITED',
  machPreselVal = 'L:A32NX_MachPreselVal',
  speedPreselVal = 'L:A32NX_SpeedPreselVal',
  activeLateralMode = 'L:A32NX_FMA_LATERAL_MODE',
  activeVerticalMode = 'L:A32NX_FMA_VERTICAL_MODE',
  fmaVerticalArmed = 'L:A32NX_FMA_VERTICAL_ARMED',
  fmaLateralArmed = 'L:A32NX_FMA_LATERAL_ARMED',
  metricAltToggle = 'L:A32NX_METRIC_ALT_TOGGLE',
  altConstraint = 'L:A32NX_FG_ALTITUDE_CONSTRAINT',
  ls1Button = 'L:BTN_LS_1_FILTER_ACTIVE',
  ls2Button = 'L:BTN_LS_2_FILTER_ACTIVE',
  selectedHeading = 'L:A32NX_FCU_HEADING_SELECTED',
  fd1Active = 'AUTOPILOT FLIGHT DIRECTOR ACTIVE:1',
  fd2Active = 'AUTOPILOT FLIGHT DIRECTOR ACTIVE:2',
  AThrMode = 'L:A32NX_AUTOTHRUST_MODE',
  crosswindModeL = 'L:A32NX_HUD_L_CROSSWIND_MODE',
  declutterModeL = 'L:A32NX_HUD_L_DECLUTTER_MODE',
  crosswindModeR = 'L:A32NX_HUD_R_CROSSWIND_MODE',
  declutterModeR = 'L:A32NX_HUD_R_DECLUTTER_MODE',
  hudPotentiometerCaptain = 'LIGHT POTENTIOMETER:71',
  hudPotentiometerFo = 'LIGHT POTENTIOMETER:72',
  trueHeadingRaw = 'L:A32NX_ADIRS_IR_1_TRUE_HEADING',
  trueTrackRaw = 'L:A32NX_ADIRS_IR_1_TRUE_TRACK',
  fcuAtsFmaDiscreteWordRaw = 'L:A32NX_FCU_ATS_FMA_DISCRETE_WORD',
}

/** A publisher to poll and publish nav/com simvars. */
export class HUDSimvarPublisher extends UpdatableSimVarPublisher<HUDSimvars> {
  private static simvars = new Map<keyof HUDSimvars, SimVarDefinition>([
    ...AdirsSimVarDefinitions,
    ...SwitchingPanelSimVarsDefinitions,
    ['spoilersCommanded', { name: HUDVars.spoilersCommanded, type: SimVarValueType.Number }],
    ['eng1State', { name: HUDVars.eng1State, type: SimVarValueType.Number }],
    ['eng2State', { name: HUDVars.eng2State, type: SimVarValueType.Number }],
    ['rev1', { name: HUDVars.rev1, type: SimVarValueType.Number }],
    ['rev2', { name: HUDVars.rev2, type: SimVarValueType.Number }],
    ['baroMode', { name: HUDVars.baroMode, type: SimVarValueType.Knots }],
    ['targetSpeedManaged', { name: HUDVars.targetSpeedManaged, type: SimVarValueType.Knots }],
    ['showSelectedHeading', { name: HUDVars.showSelectedHeading, type: SimVarValueType.Number }],
    ['athrStatus', { name: HUDVars.athrStatus, type: SimVarValueType.Number }],
    ['approachCapability', { name: HUDVars.approachCapability, type: SimVarValueType.Number }],
    ['ap1Active', { name: HUDVars.ap1Active, type: SimVarValueType.Bool }],
    ['ap2Active', { name: HUDVars.ap2Active, type: SimVarValueType.Bool }],
    ['crzAltMode', { name: HUDVars.crzAltMode, type: SimVarValueType.Bool }],
    ['tcasModeDisarmed', { name: HUDVars.tcasModeDisarmed, type: SimVarValueType.Bool }],
    ['expediteMode', { name: HUDVars.expediteMode, type: SimVarValueType.Bool }],
    ['fmaSpeedProtection', { name: HUDVars.fmaSpeedProtection, type: SimVarValueType.Bool }],
    ['fmaModeReversion', { name: HUDVars.fmaModeReversion, type: SimVarValueType.Bool }],
    ['apVsSelected', { name: HUDVars.apVsSelected, type: SimVarValueType.FPM }],
    ['selectedFpa', { name: HUDVars.selectedFpa, type: SimVarValueType.Degree }],
    ['athrModeMessage', { name: HUDVars.athrModeMessage, type: SimVarValueType.Number }],
    ['trkFpaDeselectedTCAS', { name: HUDVars.trkFpaDeselectedTCAS, type: SimVarValueType.Bool }],
    ['tcasRaInhibited', { name: HUDVars.tcasRaInhibited, type: SimVarValueType.Bool }],
    ['machPreselVal', { name: HUDVars.machPreselVal, type: SimVarValueType.Number }],
    ['speedPreselVal', { name: HUDVars.speedPreselVal, type: SimVarValueType.Knots }],
    ['activeLateralMode', { name: HUDVars.activeLateralMode, type: SimVarValueType.Number }],
    ['activeVerticalMode', { name: HUDVars.activeVerticalMode, type: SimVarValueType.Number }],
    ['fmaVerticalArmed', { name: HUDVars.fmaVerticalArmed, type: SimVarValueType.Number }],
    ['fmaLateralArmed', { name: HUDVars.fmaLateralArmed, type: SimVarValueType.Number }],
    ['metricAltToggle', { name: HUDVars.metricAltToggle, type: SimVarValueType.Bool }],
    ['altConstraint', { name: HUDVars.altConstraint, type: SimVarValueType.Feet }],
    ['ls1Button', { name: HUDVars.ls1Button, type: SimVarValueType.Bool }],
    ['ls2Button', { name: HUDVars.ls2Button, type: SimVarValueType.Bool }],
    ['selectedHeading', { name: HUDVars.selectedHeading, type: SimVarValueType.Degree }],
    ['fd1Active', { name: HUDVars.fd1Active, type: SimVarValueType.Bool }],
    ['fd2Active', { name: HUDVars.fd2Active, type: SimVarValueType.Bool }],
    ['AThrMode', { name: HUDVars.AThrMode, type: SimVarValueType.Number }],
    ['crosswindModeL', { name: HUDVars.crosswindModeL, type: SimVarValueType.Bool }],
    ['declutterModeL', { name: HUDVars.declutterModeL, type: SimVarValueType.Number }],
    ['crosswindModeR', { name: HUDVars.crosswindModeR, type: SimVarValueType.Bool }],
    ['declutterModeR', { name: HUDVars.declutterModeR, type: SimVarValueType.Number }],
    ['hudPotentiometerCaptain', { name: HUDVars.hudPotentiometerCaptain, type: SimVarValueType.Number }],
    ['hudPotentiometerFo', { name: HUDVars.hudPotentiometerFo, type: SimVarValueType.Number }],
    ['trueHeadingRaw', { name: HUDVars.trueHeadingRaw, type: SimVarValueType.Number }],
    ['trueTrackRaw', { name: HUDVars.trueTrackRaw, type: SimVarValueType.Number }],
    ['fcuAtsFmaDiscreteWordRaw', { name: HUDVars.fcuAtsFmaDiscreteWordRaw, type: SimVarValueType.Number }],
  ]);

  public constructor(bus: ArincEventBus) {
    super(HUDSimvarPublisher.simvars, bus);
  }
}

export interface HUDSymbolData {
  symbol: HUDSyntheticRunway;
}

export class HUDSymbolsPublisher extends BasePublisher<HUDSymbolData> {
  private readonly events: GenericDataListenerSync[] = [];

  constructor(bus: EventBus) {
    super(bus);

    this.events.push(
      new GenericDataListenerSync((ev, data) => {
        this.publish('symbol', data);
      }, 'A32NX_EFIS_HUD_SYMBOLS'),
    );
  }
}
