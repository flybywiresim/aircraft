// @ts-strict-ignore
// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  FrequencyMode,
  KeyInterceptDefinitions,
  KeyInterceptor,
  MathUtils,
  NotificationType,
  PilotSeat,
  PopUpDialog,
  RadioChannelType,
  RadioUtils,
  RmpState,
  RmpUtils,
} from '@flybywiresim/fbw-sdk';
import { ComRadioIndex, KeyEventData, SimVarValueType } from '@microsoft/msfs-sdk';

import { AircraftPresetsList } from '../common/AircraftPresetsList';

export class A380XKeyInterceptor extends KeyInterceptor {
  private readonly rmp1StateVar = SimVar.GetRegisteredId('L:A380X_RMP_1_STATE', SimVarValueType.Enum, document.title);
  private readonly rmp2StateVar = SimVar.GetRegisteredId('L:A380X_RMP_2_STATE', SimVarValueType.Enum, document.title);
  private readonly rmp3StateVar = SimVar.GetRegisteredId('L:A380X_RMP_3_STATE', SimVarValueType.Enum, document.title);

  protected override getExtraIntercepts(): KeyInterceptDefinitions {
    return [
      // --- ENGINE events ---
      ['ENGINE_AUTO_START', { handler: this.engineAutoStartAction.bind(this), log: true }],
      ['ENGINE_AUTO_SHUTDOWN', { handler: this.engineAutoStopAction.bind(this), log: true }],
      // --- COM RADIO events ---
      ['COM_RADIO', {}], // INOP
      ['COM_RADIO_FRACT_DEC', { handler: this.onComFractIncrement.bind(this, 1, -1, false) }],
      ['COM2_RADIO_FRACT_DEC', { handler: this.onComFractIncrement.bind(this, 2, -1, false) }],
      ['COM3_RADIO_FRACT_DEC', { handler: this.onComFractIncrement.bind(this, 3, -1, false) }],
      ['COM_RADIO_FRACT_DEC_CARRY', { handler: this.onComFractIncrement.bind(this, 1, -1, true) }],
      ['COM2_RADIO_FRACT_DEC_CARRY', { handler: this.onComFractIncrement.bind(this, 2, -1, true) }],
      ['COM3_RADIO_FRACT_DEC_CARRY', { handler: this.onComFractIncrement.bind(this, 3, -1, true) }],
      ['COM_RADIO_FRACT_INC', { handler: this.onComFractIncrement.bind(this, 1, 1, false) }],
      ['COM2_RADIO_FRACT_INC', { handler: this.onComFractIncrement.bind(this, 2, 1, false) }],
      ['COM3_RADIO_FRACT_INC', { handler: this.onComFractIncrement.bind(this, 3, 1, false) }],
      ['COM_RADIO_FRACT_INC_CARRY', { handler: this.onComFractIncrement.bind(this, 1, 1, true) }],
      ['COM2_RADIO_FRACT_INC_CARRY', { handler: this.onComFractIncrement.bind(this, 2, 1, true) }],
      ['COM3_RADIO_FRACT_INC_CARRY', { handler: this.onComFractIncrement.bind(this, 3, 1, true) }],
      ['COM_RADIO_SET', { handler: this.onComActiveSet.bind(this, 1, false) }],
      ['COM2_RADIO_SET', { handler: this.onComActiveSet.bind(this, 2, false) }],
      ['COM3_RADIO_SET', { handler: this.onComActiveSet.bind(this, 3, false) }],
      ['COM_RADIO_SET_HZ', { handler: this.onComActiveSet.bind(this, 1, true) }],
      ['COM2_RADIO_SET_HZ', { handler: this.onComActiveSet.bind(this, 2, true) }],
      ['COM3_RADIO_SET_HZ', { handler: this.onComActiveSet.bind(this, 3, true) }],
      ['COM_STBY_RADIO_SET', { handler: this.onComStandbySet.bind(this, 1, false) }],
      ['COM2_STBY_RADIO_SET', { handler: this.onComStandbySet.bind(this, 2, false) }],
      ['COM3_STBY_RADIO_SET', { handler: this.onComStandbySet.bind(this, 3, false) }],
      ['COM_STBY_RADIO_SET_HZ', { handler: this.onComStandbySet.bind(this, 1, true) }],
      ['COM2_STBY_RADIO_SET_HZ', { handler: this.onComStandbySet.bind(this, 2, true) }],
      ['COM3_STBY_RADIO_SET_HZ', { handler: this.onComStandbySet.bind(this, 3, true) }],
      ['COM_STBY_RADIO_SWAP', { handler: this.onComSwap.bind(this, 1) }],
      ['COM_RADIO_WHOLE_DEC', { handler: this.onComWholeIncrement.bind(this, 1, -1) }],
      ['COM2_RADIO_WHOLE_DEC', { handler: this.onComWholeIncrement.bind(this, 2, -1) }],
      ['COM3_RADIO_WHOLE_DEC', { handler: this.onComWholeIncrement.bind(this, 3, -1) }],
      ['COM_RADIO_WHOLE_INC', { handler: this.onComWholeIncrement.bind(this, 1, 1) }],
      ['COM2_RADIO_WHOLE_INC', { handler: this.onComWholeIncrement.bind(this, 2, 1) }],
      ['COM3_RADIO_WHOLE_INC', { handler: this.onComWholeIncrement.bind(this, 3, 1) }],
      ['COM_RADIO_SWAP', { handler: this.onComSwap.bind(this, 1) }],
      ['COM1_RADIO_SWAP', { handler: this.onComSwap.bind(this, 1) }],
      ['COM2_RADIO_SWAP', { handler: this.onComSwap.bind(this, 2) }],
      ['COM3_RADIO_SWAP', { handler: this.onComSwap.bind(this, 3) }],
      ['COM1_RECEIVE_SELECT', { handler: this.onComRxSelect.bind(this, 1) }],
      ['COM2_RECEIVE_SELECT', { handler: this.onComRxSelect.bind(this, 2) }],
      ['COM3_RECEIVE_SELECT', { handler: this.onComRxSelect.bind(this, 3) }],
      ['COM_1_SPACING_MODE_SWITCH', {}], // INOP
      ['COM_2_SPACING_MODE_SWITCH', {}], // INOP
      ['COM_3_SPACING_MODE_SWITCH', {}], // INOP
      ['COM1_TRANSMIT_SELECT', { handler: this.onComTxSelect.bind(this, { key: 'PILOT_TRANSMITTER_SET', data0: 0 }) }], // deprecated by MS
      ['COM2_TRANSMIT_SELECT', { handler: this.onComTxSelect.bind(this, { key: 'PILOT_TRANSMITTER_SET', data0: 1 }) }], // deprecated by MS
      ['COM1_VOLUME_SET', { handler: this.onComVolumeSet.bind(this, 1) }],
      ['COM2_VOLUME_SET', { handler: this.onComVolumeSet.bind(this, 2) }],
      ['COM3_VOLUME_SET', { handler: this.onComVolumeSet.bind(this, 3) }],
      ['COM1_VOLUME_INC', { handler: this.onComVolumeInc.bind(this, 1, 1) }],
      ['COM2_VOLUME_INC', { handler: this.onComVolumeInc.bind(this, 2, 1) }],
      ['COM3_VOLUME_INC', { handler: this.onComVolumeInc.bind(this, 3, 1) }],
      ['COM1_VOLUME_DEC', { handler: this.onComVolumeInc.bind(this, 1, -1) }],
      ['COM2_VOLUME_DEC', { handler: this.onComVolumeInc.bind(this, 2, -1) }],
      ['COM3_VOLUME_DEC', { handler: this.onComVolumeInc.bind(this, 3, -1) }],
      ['COM_RECEIVE_ALL_SET', { handler: this.onComReceiveAll.bind(this, false) }],
      ['COM_RECEIVE_ALL_TOGGLE', { handler: this.onComReceiveAll.bind(this, true) }],
      ['COPILOT_TRANSMITTER_SET', { handler: this.onComTxSelect.bind(this) }],
      ['PILOT_TRANSMITTER_SET', { handler: this.onComTxSelect.bind(this) }],
    ];
  }

  private engineAutoStartAction() {
    if (!this.dialogVisible) {
      // If loading already in progress show a notification and return
      if (this.isAlreadyLoading()) return;
      // Show a dialog to ask user to load a preset or cancel
      this.dialogVisible = true;
      const dialog = new PopUpDialog();
      const presetID = 4; // "Ready for Taxi"
      dialog.showPopUp(
        'Ctrl+E Not supported',
        `<div style="font-size: 120%; text-align: left;">
                           Engine Auto Start is not supported by the A380X.<br/>
                           <br/>
                           Do you want to you use the flyPad's Aircraft Presets to set the aircraft to
                           <strong>"${AircraftPresetsList.getPresetName(presetID)}"</strong>?
                         </div>`,
        'small',
        () => this.loadPreset(presetID),
        () => (this.dialogVisible = false),
      );
    }
  }

  private engineAutoStopAction() {
    if (this.isAlreadyLoading()) return;
    // If engines are running show a dialog to ask user to load a preset or cancel
    if (!this.dialogVisible && this.isOneEngineRunning()) {
      this.dialogVisible = true;
      const dialog = new PopUpDialog();
      const presetID = 2;
      dialog.showPopUp(
        'Shift+Ctrl+E Not supported',
        `<div style="font-size: 120%; text-align: left;">
                               Engine Auto Shutdown is not supported by the A380X.<br/>
                               <br/>
                               Do you want to you use the flyPad's Aircraft Presets to set the aircraft to
                               <strong>"${AircraftPresetsList.getPresetName(presetID)}"</strong>?
                             </div>`,
        'small',
        () => this.loadPreset(presetID),
        () => (this.dialogVisible = false),
      );
    }
  }

  private isAlreadyLoading() {
    const loadingInProgress = SimVar.GetSimVarValue('L:A32NX_AIRCRAFT_PRESET_LOAD', 'Number');
    if (loadingInProgress > 0) {
      this.notification.showNotification({
        title: 'Aircraft Presets',
        message: `Loading Preset is already in progress "${AircraftPresetsList.getPresetName(loadingInProgress)}"`,
        type: NotificationType.Message,
        timeout: 1500,
      });
      return true;
    }
    return false;
  }

  private isOneEngineRunning() {
    const engine1N1 = SimVar.GetSimVarValue('L:A32NX_ENGINE_N1:1', 'Number');
    const engine2N1 = SimVar.GetSimVarValue('L:A32NX_ENGINE_N1:2', 'Number');
    return engine1N1 > 0.1 || engine2N1 > 0.1;
  }

  private loadPreset(presetID: number) {
    console.log(`Setting aircraft preset to ${AircraftPresetsList.getPresetName(presetID)}`);
    SimVar.SetSimVarValue('L:A32NX_AIRCRAFT_PRESET_LOAD', 'Number', presetID);
    this.dialogVisible = false;
  }

  private isRmpSyncEnabled(): boolean {
    return SimVar.GetSimVarValue('L:A32NX_FO_SYNC_EFIS_ENABLED', SimVarValueType.Bool) > 0;
  }

  private shouldControlRmp1(): boolean {
    const rmp1State = SimVar.GetSimVarValueFastReg(this.rmp1StateVar);
    const rmp3State = SimVar.GetSimVarValueFastReg(this.rmp3StateVar);
    const rmp1On = rmp1State === RmpState.On || rmp1State === RmpState.OnFailed;
    const rmp3Off = rmp3State === RmpState.OffFailed || rmp3State === RmpState.OffStandby;
    return this.isRmpSyncEnabled() || rmp3Off || (this.pilotSeat.get() === PilotSeat.Left && rmp1On);
  }

  private shouldControlRmp2(): boolean {
    const rmp2State = SimVar.GetSimVarValueFastReg(this.rmp2StateVar);
    const rmp3State = SimVar.GetSimVarValueFastReg(this.rmp3StateVar);
    const rmp2On = rmp2State === RmpState.On || rmp2State === RmpState.OnFailed;
    const rmp3Off = rmp3State === RmpState.OffFailed || rmp3State === RmpState.OffStandby;
    return this.isRmpSyncEnabled() || rmp3Off || (this.pilotSeat.get() === PilotSeat.Right && rmp2On);
  }

  private shouldControlRmp3(): boolean {
    const rmp1State = SimVar.GetSimVarValueFastReg(this.rmp1StateVar);
    const rmp2State = SimVar.GetSimVarValueFastReg(this.rmp2StateVar);
    const rmp1Off = rmp1State === RmpState.OffFailed || rmp1State === RmpState.OffStandby;
    const rmp2Off = rmp2State === RmpState.OffFailed || rmp2State === RmpState.OffStandby;
    return (
      this.isRmpSyncEnabled() ||
      (this.pilotSeat.get() === PilotSeat.Left && rmp1Off) ||
      (this.pilotSeat.get() === PilotSeat.Right && rmp2Off)
    );
  }

  private onComFractIncrement(index: ComRadioIndex, sign: 1 | -1, carry: boolean): void {
    RmpUtils.getStandbyFrequencyLocalVar(index).set(
      RadioUtils.getNextValidChannel(RmpUtils.getStandbyFrequencyLocalVar(index).get(), sign, carry),
    );
    RmpUtils.getStandbyModeLocalVar(index).set(FrequencyMode.Frequency);
  }

  private onComWholeIncrement(index: ComRadioIndex, sign: 1 | -1): void {
    RmpUtils.getStandbyFrequencyLocalVar(index).set(
      RadioUtils.getClosestValidFrequency(
        RadioUtils.incrementBcd32(RmpUtils.getStandbyFrequencyLocalVar(index).get(), 4, sign),
        RadioChannelType.VhfCom8_33_25,
      ),
    );
    RmpUtils.getStandbyModeLocalVar(index).set(FrequencyMode.Frequency);
  }

  private onComActiveSet(index: ComRadioIndex, isHertz: boolean, data: KeyEventData): void {
    const frequency = isHertz ? RadioUtils.packBcd32(data.value0) : RadioUtils.bcd16ToBcd32(data.value0);
    RmpUtils.getActiveFrequencyLocalVar(index).set(
      RadioUtils.getClosestValidFrequency(frequency, RadioChannelType.VhfCom8_33_25),
    );
    RmpUtils.getActiveModeLocalVar(index).set(FrequencyMode.Frequency);
  }

  private onComStandbySet(index: ComRadioIndex, isHertz: boolean, data: KeyEventData): void {
    const frequency = isHertz ? RadioUtils.packBcd32(data.value0) : RadioUtils.bcd16ToBcd32(data.value0);
    RmpUtils.getStandbyFrequencyLocalVar(index).set(
      RadioUtils.getClosestValidFrequency(frequency, RadioChannelType.VhfCom8_33_25),
    );
    RmpUtils.getStandbyModeLocalVar(index).set(FrequencyMode.Frequency);
  }

  private onComSwap(index: ComRadioIndex): void {
    RmpUtils.swapVhfFrequency(index);
  }

  private onComRxSelect(index: ComRadioIndex, data: KeyEventData): void {
    const rxOn = data.value0 === 1;
    if (this.shouldControlRmp1()) {
      SimVar.SetSimVarValue(`L:A380X_RMP_1_VHF_VOL_RX_SWITCH_${index}`, SimVarValueType.Bool, rxOn);
    }
    if (this.shouldControlRmp2()) {
      SimVar.SetSimVarValue(`L:A380X_RMP_2_VHF_VOL_RX_SWITCH_${index}`, SimVarValueType.Bool, rxOn);
    }
    if (this.shouldControlRmp3()) {
      SimVar.SetSimVarValue(`L:A380X_RMP_3_VHF_VOL_RX_SWITCH_${index}`, SimVarValueType.Bool, rxOn);
    }
  }

  private onComTxSelect(data: KeyEventData): void {
    const vhfIndex = (data.value0 ?? 0) + 1;
    if (this.shouldControlRmp1()) {
      SimVar.SetSimVarValue(`H:RMP_1_VHF_CALL_${vhfIndex}_PRESSED`, SimVarValueType.Bool, 1);
      requestAnimationFrame(() =>
        SimVar.SetSimVarValue(`H:RMP_1_VHF_CALL_${vhfIndex}_RELEASED`, SimVarValueType.Bool, 1),
      );
    }
    if (this.shouldControlRmp2()) {
      SimVar.SetSimVarValue(`H:RMP_2_VHF_CALL_${vhfIndex}_PRESSED`, SimVarValueType.Bool, 1);
      requestAnimationFrame(() =>
        SimVar.SetSimVarValue(`H:RMP_2_VHF_CALL_${vhfIndex}_RELEASED`, SimVarValueType.Bool, 1),
      );
    }
    if (this.shouldControlRmp3()) {
      SimVar.SetSimVarValue(`H:RMP_3_VHF_CALL_${vhfIndex}_PRESSED`, SimVarValueType.Bool, 1);
      requestAnimationFrame(() =>
        SimVar.SetSimVarValue(`H:RMP_3_VHF_CALL_${vhfIndex}_RELEASED`, SimVarValueType.Bool, 1),
      );
    }
  }

  private onComVolumeSet(index: ComRadioIndex, data: KeyEventData): void {
    const volume = MathUtils.clamp(data.value0 ?? 0, 0, 100);
    if (this.shouldControlRmp1()) {
      SimVar.SetSimVarValue(`L:A380X_RMP_1_VHF_VOL_${index}`, SimVarValueType.Number, volume);
    }
    if (this.shouldControlRmp2()) {
      SimVar.SetSimVarValue(`L:A380X_RMP_2_VHF_VOL_${index}`, SimVarValueType.Number, volume);
    }
    if (this.shouldControlRmp3()) {
      SimVar.SetSimVarValue(`L:A380X_RMP_3_VHF_VOL_${index}`, SimVarValueType.Number, volume);
    }
  }

  private onComVolumeInc(index: ComRadioIndex, sign: 1 | -1): void {
    const increment = 2 * sign;
    if (this.shouldControlRmp1()) {
      const localVar = `L:A380X_RMP_1_VHF_VOL_${index}`;
      SimVar.SetSimVarValue(
        localVar,
        SimVarValueType.Number,
        MathUtils.clamp(SimVar.GetSimVarValue(localVar, SimVarValueType.Number) + increment, 0, 100),
      );
    }
    if (this.shouldControlRmp2()) {
      const localVar = `L:A380X_RMP_2_VHF_VOL_${index}`;
      SimVar.SetSimVarValue(
        localVar,
        SimVarValueType.Number,
        MathUtils.clamp(SimVar.GetSimVarValue(localVar, SimVarValueType.Number) + increment, 0, 100),
      );
    }
    if (this.shouldControlRmp3()) {
      const localVar = `L:A380X_RMP_3_VHF_VOL_${index}`;
      SimVar.SetSimVarValue(
        localVar,
        SimVarValueType.Number,
        MathUtils.clamp(SimVar.GetSimVarValue(localVar, SimVarValueType.Number) + increment, 0, 100),
      );
    }
  }

  private onComReceiveAll(toggle: boolean, data: KeyEventData): void {
    if (this.shouldControlRmp1()) {
      const rx1On = toggle
        ? !SimVar.GetSimVarValue('L:A380X_RMP_1_VHF_VOL_RX_SWITCH_1', SimVarValueType.Bool)
        : data.value0 > 0;
      SimVar.SetSimVarValue('L:A380X_RMP_1_VHF_VOL_RX_SWITCH_1', SimVarValueType.Bool, rx1On);
      const rx2On = toggle
        ? !SimVar.GetSimVarValue('L:A380X_RMP_1_VHF_VOL_RX_SWITCH_2', SimVarValueType.Bool)
        : data.value0 > 0;
      SimVar.SetSimVarValue('L:A380X_RMP_1_VHF_VOL_RX_SWITCH_2', SimVarValueType.Bool, rx2On);
      const rx3On = toggle
        ? !SimVar.GetSimVarValue('L:A380X_RMP_1_VHF_VOL_RX_SWITCH_3', SimVarValueType.Bool)
        : data.value0 > 0;
      SimVar.SetSimVarValue('L:A380X_RMP_1_VHF_VOL_RX_SWITCH_3', SimVarValueType.Bool, rx3On);
    }
    if (this.shouldControlRmp2()) {
      const rx1On = toggle
        ? !SimVar.GetSimVarValue('L:A380X_RMP_2_VHF_VOL_RX_SWITCH_1', SimVarValueType.Bool)
        : data.value0 > 0;
      SimVar.SetSimVarValue('L:A380X_RMP_2_VHF_VOL_RX_SWITCH_1', SimVarValueType.Bool, rx1On);
      const rx2On = toggle
        ? !SimVar.GetSimVarValue('L:A380X_RMP_2_VHF_VOL_RX_SWITCH_2', SimVarValueType.Bool)
        : data.value0 > 0;
      SimVar.SetSimVarValue('L:A380X_RMP_2_VHF_VOL_RX_SWITCH_2', SimVarValueType.Bool, rx2On);
      const rx3On = toggle
        ? !SimVar.GetSimVarValue('L:A380X_RMP_2_VHF_VOL_RX_SWITCH_3', SimVarValueType.Bool)
        : data.value0 > 0;
      SimVar.SetSimVarValue('L:A380X_RMP_2_VHF_VOL_RX_SWITCH_3', SimVarValueType.Bool, rx3On);
    }
    if (this.shouldControlRmp3()) {
      const rx1On = toggle
        ? !SimVar.GetSimVarValue('L:A380X_RMP_3_VHF_VOL_RX_SWITCH_1', SimVarValueType.Bool)
        : data.value0 > 0;
      SimVar.SetSimVarValue('L:A380X_RMP_3_VHF_VOL_RX_SWITCH_1', SimVarValueType.Bool, rx1On);
      const rx2On = toggle
        ? !SimVar.GetSimVarValue('L:A380X_RMP_3_VHF_VOL_RX_SWITCH_2', SimVarValueType.Bool)
        : data.value0 > 0;
      SimVar.SetSimVarValue('L:A380X_RMP_3_VHF_VOL_RX_SWITCH_2', SimVarValueType.Bool, rx2On);
      const rx3On = toggle
        ? !SimVar.GetSimVarValue('L:A380X_RMP_3_VHF_VOL_RX_SWITCH_3', SimVarValueType.Bool)
        : data.value0 > 0;
      SimVar.SetSimVarValue('L:A380X_RMP_3_VHF_VOL_RX_SWITCH_3', SimVarValueType.Bool, rx3On);
    }
  }
}
