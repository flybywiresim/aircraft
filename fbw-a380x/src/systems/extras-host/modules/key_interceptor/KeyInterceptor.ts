// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, KeyEvents, KeyEventManager, KeyEventData, ComRadioIndex } from '@microsoft/msfs-sdk';
import {
  FrequencyMode,
  InterRmpBusEvents,
  NotificationManager,
  NotificationType,
  PopUpDialog,
  RadioUtils,
} from '@flybywiresim/fbw-sdk';
import { AircraftPresetsList } from '../common/AircraftPresetsList';

/**
 * This class is used to intercept the key events for the engine auto start and engine auto shutdown.
 *
 * Additional key events can be added in the registerIntercepts() method.
 */
export class KeyInterceptor {
  private readonly keys: Record<string, { handler?: (data: KeyEventData) => void; passThrough?: true; log?: true }> = {
    ENGINE_AUTO_START: { handler: this.engineAutoStartAction.bind(this), log: true },
    ENGINE_AUTO_SHUTDOWN: { handler: this.engineAutoStopAction.bind(this), log: true },
    // --- RADIO NAVIGATION COM events ---
    COM_RADIO: {}, // INOP
    COM_RADIO_FRACT_DEC: { handler: this.onComFractIncrement.bind(this, 1, -1, false) },
    COM2_RADIO_FRACT_DEC: { handler: this.onComFractIncrement.bind(this, 2, -1, false) },
    COM3_RADIO_FRACT_DEC: { handler: this.onComFractIncrement.bind(this, 3, -1, false) },
    COM_RADIO_FRACT_DEC_CARRY: { handler: this.onComFractIncrement.bind(this, 1, -1, true) },
    COM2_RADIO_FRACT_DEC_CARRY: { handler: this.onComFractIncrement.bind(this, 2, -1, true) },
    COM3_RADIO_FRACT_DEC_CARRY: { handler: this.onComFractIncrement.bind(this, 3, -1, true) },
    COM_RADIO_FRACT_INC: { handler: this.onComFractIncrement.bind(this, 1, 1, false) },
    COM2_RADIO_FRACT_INC: { handler: this.onComFractIncrement.bind(this, 2, 1, false) },
    COM3_RADIO_FRACT_INC: { handler: this.onComFractIncrement.bind(this, 3, 1, false) },
    COM_RADIO_FRACT_INC_CARRY: { handler: this.onComFractIncrement.bind(this, 1, 1, true) },
    COM2_RADIO_FRACT_INC_CARRY: { handler: this.onComFractIncrement.bind(this, 2, 1, true) },
    COM3_RADIO_FRACT_INC_CARRY: { handler: this.onComFractIncrement.bind(this, 3, 1, true) },
    COM_RADIO_SET: { handler: this.onComActiveSet.bind(this, 1, false) },
    COM2_RADIO_SET: { handler: this.onComActiveSet.bind(this, 2, false) },
    COM3_RADIO_SET: { handler: this.onComActiveSet.bind(this, 3, false) },
    COM_RADIO_SET_HZ: { handler: this.onComActiveSet.bind(this, 1, true) },
    COM2_RADIO_SET_HZ: { handler: this.onComActiveSet.bind(this, 2, true) },
    COM3_RADIO_SET_HZ: { handler: this.onComActiveSet.bind(this, 3, true) },
    COM_STBY_RADIO_SET: { handler: this.onComStandbySet.bind(this, 1, false) },
    COM2_STBY_RADIO_SET: { handler: this.onComStandbySet.bind(this, 2, false) },
    COM3_STBY_RADIO_SET: { handler: this.onComStandbySet.bind(this, 3, false) },
    COM_STBY_RADIO_SET_HZ: { handler: this.onComStandbySet.bind(this, 1, true) },
    COM2_STBY_RADIO_SET_HZ: { handler: this.onComStandbySet.bind(this, 2, true) },
    COM3_STBY_RADIO_SET_HZ: { handler: this.onComStandbySet.bind(this, 3, true) },
    COM_STBY_RADIO_SWAP: { handler: this.onComSwap.bind(this, 1) },
    COM_RADIO_WHOLE_DEC: { handler: this.onComWholeIncrement.bind(this, 1, -1) },
    COM2_RADIO_WHOLE_DEC: { handler: this.onComWholeIncrement.bind(this, 2, -1) },
    COM3_RADIO_WHOLE_DEC: { handler: this.onComWholeIncrement.bind(this, 3, -1) },
    COM_RADIO_WHOLE_INC: { handler: this.onComWholeIncrement.bind(this, 1, 1) },
    COM2_RADIO_WHOLE_INC: { handler: this.onComWholeIncrement.bind(this, 2, 1) },
    COM3_RADIO_WHOLE_INC: { handler: this.onComWholeIncrement.bind(this, 3, 1) },
    COM_RADIO_SWAP: { handler: this.onComSwap.bind(this, 1) },
    COM1_RADIO_SWAP: { handler: this.onComSwap.bind(this, 1) },
    COM2_RADIO_SWAP: { handler: this.onComSwap.bind(this, 2) },
    COM3_RADIO_SWAP: { handler: this.onComSwap.bind(this, 3) },
    COM1_RECEIVE_SELECT: { handler: this.onComRxSelect.bind(this, 1) },
    COM2_RECEIVE_SELECT: { handler: this.onComRxSelect.bind(this, 2) },
    COM3_RECEIVE_SELECT: { handler: this.onComRxSelect.bind(this, 3) },
    COM_1_SPACING_MODE_SWITCH: {}, // INOP
    COM_2_SPACING_MODE_SWITCH: {}, // INOP
    COM_3_SPACING_MODE_SWITCH: {}, // INOP
    COM1_TRANSMIT_SELECT: { handler: this.onComTxSelect.bind(this, { key: 'PILOT_TRANSMITTER_SET', data0: 0 }) }, // deprecated by MS
    COM2_TRANSMIT_SELECT: { handler: this.onComTxSelect.bind(this, { key: 'PILOT_TRANSMITTER_SET', data0: 1 }) }, // deprecated by MS
    COM1_VOLUME_SET: { handler: this.onComVolumeSet.bind(this, 1) },
    COM2_VOLUME_SET: { handler: this.onComVolumeSet.bind(this, 2) },
    COM3_VOLUME_SET: { handler: this.onComVolumeSet.bind(this, 3) },
    COM1_VOLUME_INC: { handler: this.onComVolumeInc.bind(this, 1, 1) },
    COM2_VOLUME_INC: { handler: this.onComVolumeInc.bind(this, 2, 1) },
    COM3_VOLUME_INC: { handler: this.onComVolumeInc.bind(this, 3, 1) },
    COM1_VOLUME_DEC: { handler: this.onComVolumeInc.bind(this, 1, -1) },
    COM2_VOLUME_DEC: { handler: this.onComVolumeInc.bind(this, 2, -1) },
    COM3_VOLUME_DEC: { handler: this.onComVolumeInc.bind(this, 3, -1) },
    COM_RECEIVE_ALL_SET: { handler: this.onComReceiveAll.bind(this, false) },
    COM_RECEIVE_ALL_TOGGLE: { handler: this.onComReceiveAll.bind(this, true) },
    // --- RADIO NAVIGATION MISC events ---
    COPILOT_TRANSMITTER_SET: { handler: this.onComTxSelect.bind(this) },
    PILOT_TRANSMITTER_SET: { handler: this.onComTxSelect.bind(this) },
    // --- EXTERNAL POWER events ---
  };

  private publisher = this.bus.getPublisher<InterRmpBusEvents>();

  private keyInterceptManager: KeyEventManager;

  private dialogVisible = false;

  constructor(
    private readonly bus: EventBus,
    private readonly notification: NotificationManager,
  ) {
    KeyEventManager.getManager(this.bus).then((manager) => {
      this.keyInterceptManager = manager;
      this.registerIntercepts();
    });
    console.log('KeyInterceptor: Created');
  }

  public startPublish(): void {
    console.log('KeyInterceptor: startPublish()');
  }

  private registerIntercepts() {
    for (const [key, config] of Object.entries(this.keys)) {
      this.keyInterceptManager.interceptKey(key, !!config.passThrough);
    }

    const subscriber = this.bus.getSubscriber<KeyEvents>();
    subscriber.on('key_intercept').handle(this.onKeyIntercepted.bind(this));
  }

  private onKeyIntercepted(data: KeyEventData): void {
    const config = this.keys[data.key];
    if (!config) {
      return;
    }

    if (config.log) {
      console.log(`KeyInterceptor: ${data.key}`);
    }

    config.handler?.(data);
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

  private onComFractIncrement(_index: ComRadioIndex, _sign: 1 | -1, _carry: boolean): void {
    // FIXME implement, inop for now
  }

  private onComWholeIncrement(_index: ComRadioIndex, _sign: 1 | -1): void {
    // FIXME implement, inop for now
  }

  private onComActiveSet(index: ComRadioIndex, isHertz: boolean, data: KeyEventData): void {
    const frequencyEvent: keyof InterRmpBusEvents = `inter_rmp_set_vhf_active_${index}`;
    const modeEvent: keyof InterRmpBusEvents = `inter_rmp_set_vhf_active_mode_${index}`;
    const frequency = isHertz ? RadioUtils.packBcd32(data.value0) : RadioUtils.bcd16ToBcd32(data.value0);
    this.publisher.pub(frequencyEvent, frequency, true);
    this.publisher.pub(modeEvent, FrequencyMode.Frequency, true);
  }

  private onComStandbySet(index: ComRadioIndex, isHertz: boolean, data: KeyEventData): void {
    const frequencyEvent: keyof InterRmpBusEvents = `inter_rmp_set_vhf_standby_${index}`;
    const modeEvent: keyof InterRmpBusEvents = `inter_rmp_set_vhf_standby_mode_${index}`;
    const frequency = isHertz ? RadioUtils.packBcd32(data.value0) : RadioUtils.bcd16ToBcd32(data.value0);
    this.publisher.pub(frequencyEvent, frequency, true);
    this.publisher.pub(modeEvent, FrequencyMode.Frequency, true);
  }

  private onComSwap(_index: ComRadioIndex): void {
    // FIXME implement, inop for now
  }

  private onComRxSelect(_index: ComRadioIndex, _data: KeyEventData): void {
    // FIXME implement, inop for now
  }

  private onComTxSelect(_data: KeyEventData): void {
    // FIXME implement, inop for now
  }

  private onComVolumeSet(_index: ComRadioIndex, _data: KeyEventData): void {
    // FIXME implement, inop for now
  }

  private onComVolumeInc(_index: ComRadioIndex, _sign: 1 | -1, _data: KeyEventData): void {
    // FIXME implement, inop for now
  }

  private onComReceiveAll(_toggle: boolean): void {
    // FIXME implement, inop for now
  }
}
