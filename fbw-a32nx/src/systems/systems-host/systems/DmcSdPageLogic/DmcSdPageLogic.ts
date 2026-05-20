// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, EventBus, Subscription } from '@microsoft/msfs-sdk';
import { A32NXFcdcBusEvents } from '../../../shared/src/publishers/A32NXFcdcBusPublisher';
import {
  Arinc429LocalVarConsumerSubject,
  Arinc429Register,
  NXLogicConfirmNode,
  NXLogicPulseNode,
  NXLogicTriggeredMonostableNode,
} from '@flybywiresim/fbw-sdk';
import { SdPages } from '../../../shared/src/SdPages';
import { A32NXEcpBusEvents } from '@shared/publishers/A32NXEcpBusPublisher';

enum SdMode {
  Manual,
  Warning,
  Advisory,
  FlightPhase,
}

/** An A32NX ECAM Control Panel, excluding the DU brightness pots. */
export class DmcSdPageLogic {
  private readonly sub = this.bus.getSubscriber<A32NXFcdcBusEvents & A32NXEcpBusEvents & ClockEvents>();

  private readonly apuNWord = Arinc429Register.empty();

  private readonly altitudeWord = Arinc429Register.empty();

  private readonly ecpSystemSwitchWord = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_ecp_system_switch_word'),
  );

  private readonly ecpWarningSwitchWord = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_ecp_warning_switch_word'),
  );

  private readonly allPageConfirm = new NXLogicConfirmNode(3, true);

  private readonly allPagePulse = new NXLogicPulseNode(true);

  private readonly apuAbove95PercentConfirmNode = new NXLogicConfirmNode(10, true);

  private readonly engineStartConfirmNode = new NXLogicConfirmNode(10, false);

  private readonly controlsMovedMtrig = new NXLogicTriggeredMonostableNode(20, true, true);

  private readonly cruiseConditionConfirmNode = new NXLogicConfirmNode(60, true);

  private readonly stsPageNormalMtrig = new NXLogicTriggeredMonostableNode(3, true, true);

  private readonly stsPageNormalPulse = new NXLogicPulseNode(false);

  private flightPhaseModePage = SdPages.NONE;

  private prevFwcRequestedSdPage = SdPages.NONE;

  private readonly sdWarningOverridePulseNode = new NXLogicPulseNode(true);

  private readonly sdManualSelectionPulseNode = new NXLogicPulseNode(true);

  private selectedPage = SdPages.NONE;

  private sdMode = SdMode.FlightPhase;

  private activePage = SdPages.NONE;

  private readonly subs: Subscription[] = [];

  constructor(private readonly bus: EventBus) {}

  public init(): void {
    for (const sub of this.subs) {
      sub.resume(true);
    }
  }

  public updateFlightPhasePage(dt: number) {
    const fwcFlightPhase = SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', 'Enum');

    const sidestickPosX = SimVar.GetSimVarValue('L:A32NX_SIDESTICK_POSITION_X', 'Number');
    const sidestickPosY = SimVar.GetSimVarValue('L:A32NX_SIDESTICK_POSITION_Y', 'Number');
    const rudderPos = SimVar.GetSimVarValue('RUDDER PEDAL POSITION', 'Position');
    const controlsMoved = Math.abs(sidestickPosX) > 0.05 || Math.abs(sidestickPosY) > 0.05 || Math.abs(rudderPos) > 0.2;
    this.controlsMovedMtrig.write(controlsMoved, dt);

    const engModeSel = SimVar.GetSimVarValue('L:XMLVAR_ENG_MODE_SEL', 'number');
    const eng1State = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:1', 'number');
    const eng2State = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:2', 'number');
    const oneEngOff = eng1State !== 1 || eng2State !== 1;

    this.engineStartConfirmNode.write(engModeSel === 0 || (oneEngOff && engModeSel === 2), dt);

    this.apuNWord.setFromSimVar('L:A32NX_APU_N');
    const currentAPUMasterState = SimVar.GetSimVarValue('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'Bool');
    this.apuAbove95PercentConfirmNode.write(this.apuNWord.valueOr(0) > 95, dt);

    const toPowerSet =
      Math.max(
        SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:1', 'number'),
        SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:2', 'number'),
      ) >= 35 &&
      SimVar.GetSimVarValue('ENG N1 RPM:1', 'Percent') > 15 &&
      SimVar.GetSimVarValue('ENG N1 RPM:2', 'Percent') > 15;
    const flapsDeployed = SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'number') !== 0;

    this.cruiseConditionConfirmNode.write(fwcFlightPhase === 6 && (toPowerSet || flapsDeployed), dt);
    const cruiseCondition =
      this.cruiseConditionConfirmNode.read() || (fwcFlightPhase === 6 && !flapsDeployed && !toPowerSet);

    this.altitudeWord.setFromSimVar('L:A32NX_ADIRS_ADR_1_BARO_CORRECTED_ALTITUDE_1');
    const isGearExtended = SimVar.GetSimVarValue('GEAR TOTAL PCT EXTENDED', 'percent') > 0.95;

    const wheelCondition = isGearExtended && this.altitudeWord.value < 15500 && !this.altitudeWord.isFailureWarning();

    if (this.engineStartConfirmNode.read()) {
      this.flightPhaseModePage = SdPages.ENG;
    } else if (currentAPUMasterState && !this.apuAbove95PercentConfirmNode.read()) {
      this.flightPhaseModePage = SdPages.APU;
    } else if (fwcFlightPhase === 1 || fwcFlightPhase === 10) {
      this.flightPhaseModePage = SdPages.DOOR;
    } else if (fwcFlightPhase === 2 && this.controlsMovedMtrig.read()) {
      this.flightPhaseModePage = SdPages.FCTL;
    } else if (fwcFlightPhase === 2 && !this.controlsMovedMtrig.read()) {
      this.flightPhaseModePage = SdPages.WHEEL;
    } else if (
      fwcFlightPhase === 3 ||
      fwcFlightPhase === 4 ||
      fwcFlightPhase === 5 ||
      (fwcFlightPhase === 6 && !cruiseCondition)
    ) {
      this.flightPhaseModePage = SdPages.ENG;
    } else if (
      (fwcFlightPhase === 6 && wheelCondition) ||
      fwcFlightPhase === 7 ||
      fwcFlightPhase === 8 ||
      fwcFlightPhase === 9
    ) {
      this.flightPhaseModePage = SdPages.WHEEL;
    } else {
      this.flightPhaseModePage = SdPages.CRZ;
    }
  }

  computeEcpButtonPressedFromWord(): SdPages {
    if (this.ecpSystemSwitchWord.get().bitValueOr(11, false)) {
      return SdPages.ENG;
    } else if (this.ecpSystemSwitchWord.get().bitValueOr(12, false)) {
      return SdPages.BLEED;
    } else if (this.ecpSystemSwitchWord.get().bitValueOr(13, false)) {
      return SdPages.APU;
    } else if (this.ecpSystemSwitchWord.get().bitValueOr(14, false)) {
      return SdPages.HYD;
    } else if (this.ecpSystemSwitchWord.get().bitValueOr(15, false)) {
      return SdPages.ELEC;
    } else if (this.ecpSystemSwitchWord.get().bitValueOr(17, false)) {
      return SdPages.COND;
    } else if (this.ecpSystemSwitchWord.get().bitValueOr(18, false)) {
      return SdPages.PRESS;
    } else if (this.ecpSystemSwitchWord.get().bitValueOr(19, false)) {
      return SdPages.FUEL;
    } else if (this.ecpSystemSwitchWord.get().bitValueOr(20, false)) {
      return SdPages.FCTL;
    } else if (this.ecpSystemSwitchWord.get().bitValueOr(21, false)) {
      return SdPages.DOOR;
    } else if (this.ecpSystemSwitchWord.get().bitValueOr(22, false)) {
      return SdPages.WHEEL;
    } else if (this.ecpWarningSwitchWord.get().bitValueOr(13, false)) {
      return SdPages.STS;
    } else {
      return SdPages.NONE;
    }
  }

  updateSdSelection(dt: number) {
    const fwcSdPageRequest = SimVar.GetSimVarValue('L:A32NX_ECAM_SFAIL', 'number') as SdPages;

    const allButtonPressed = this.ecpSystemSwitchWord.get().bitValueOr(23, false); // TODO should also have a hardwired discrete
    this.allPageConfirm.write(allButtonPressed && !this.allPagePulse.read(), dt);
    this.allPagePulse.write(this.allPageConfirm.read());

    const systemPageButtonPressed = this.computeEcpButtonPressedFromWord();
    this.sdManualSelectionPulseNode.write(systemPageButtonPressed !== SdPages.NONE);

    this.sdWarningOverridePulseNode.write(fwcSdPageRequest !== this.prevFwcRequestedSdPage);

    this.stsPageNormalMtrig.write(systemPageButtonPressed === SdPages.STS, dt);
    this.stsPageNormalPulse.write(this.stsPageNormalMtrig.read());

    if (this.sdManualSelectionPulseNode.read() && this.selectedPage !== systemPageButtonPressed) {
      this.selectedPage = systemPageButtonPressed;
      this.sdMode = SdMode.Manual;
    } else if (this.allPagePulse.read()) {
      this.selectedPage = this.selectedPage === SdPages.NONE ? SdPages.ENG : (this.selectedPage + 1) % 11;
      this.sdMode = SdMode.Manual;
    } else if (this.sdWarningOverridePulseNode.read() && fwcSdPageRequest !== SdPages.NONE) {
      this.selectedPage = fwcSdPageRequest;
      this.sdMode = SdMode.Warning;
    } else if (
      (this.sdWarningOverridePulseNode.read() && fwcSdPageRequest === SdPages.NONE && this.sdMode === SdMode.Warning) ||
      (this.sdManualSelectionPulseNode.read() &&
        this.sdMode === SdMode.Manual &&
        this.selectedPage === systemPageButtonPressed) ||
      (this.stsPageNormalPulse.read() && this.selectedPage === SdPages.STS)
    ) {
      this.selectedPage = SdPages.NONE;
      this.sdMode = SdMode.FlightPhase;
    }
    this.prevFwcRequestedSdPage = fwcSdPageRequest;
  }

  public update(dt: number): void {
    this.updateFlightPhasePage(dt);
    this.updateSdSelection(dt);

    if (this.sdMode === SdMode.Manual || this.sdMode === SdMode.Warning) {
      this.activePage = this.selectedPage;
    } else {
      this.activePage = this.flightPhaseModePage;
    }

    SimVar.SetSimVarValue('L:A32NX_ECAM_SD_CURRENT_PAGE_INDEX', 'number', this.selectedPage);
    SimVar.SetSimVarValue('L:A32NX_ECAM_SD_PAGE_TO_DISPLAY', 'number', this.activePage);
  }
}
