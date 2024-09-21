// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { PilotSeat, PilotSeatEvents } from '@flybywiresim/fbw-sdk';
import {
  ConsumerValue,
  EventBus,
  Instrument,
  MutableSubscribable,
  SimVarValueType,
  Subject,
  Subscription,
} from '@microsoft/msfs-sdk';

import { AudioManagementUnit, ComIndex } from './AudioManagementUnit';
import { RadioNavSelectedNavaid, RmpAmuBusEvents } from './RmpAmuBusPublisher';

interface NavaidDefinition {
  setVolume: (volume: number, amuIndex: number) => Promise<unknown>;
  setIdent: (on: boolean, amuIndex: number) => Promise<unknown>;
}

interface NavaidState extends NavaidDefinition {
  isIdentOn: MutableSubscribable<boolean>;
  volume: MutableSubscribable<number>;
  subs: Subscription[];
}

interface ComDefinition {
  setVolume: (volume: number) => Promise<unknown>;
  setReceive: (on: boolean) => Promise<unknown>;
  setTransmit: (on: boolean, amuIndex: number) => Promise<unknown>;
}

interface ComState extends ComDefinition {
  isReceiveOn: MutableSubscribable<boolean>;
  isTransmitOn: MutableSubscribable<boolean>;
  volume: MutableSubscribable<number>;
  subs: Subscription[];
}

enum SimTransmitStates {
  Com1 = 0,
  Com2 = 1,
  Com3 = 2,
  None = 4,
}

/**
 * Manages the sim's audio events to match the state of the AMUs.
 */
export class SimAudioManager implements Instrument {
  private static readonly navaidDefinitions: Record<RadioNavSelectedNavaid, NavaidDefinition> = {
    [RadioNavSelectedNavaid.Adf1]: {
      setVolume: (volume) => SimVar.SetSimVarValue('K:ADF_VOLUME_SET', SimVarValueType.Number, volume),
      setIdent: (on) => SimVar.SetSimVarValue('K:RADIO_ADF_IDENT_SET', SimVarValueType.Number, on ? 1 : 0),
    },
    [RadioNavSelectedNavaid.Adf2]: {
      setVolume: (volume) => SimVar.SetSimVarValue('K:ADF2_VOLUME_SET', SimVarValueType.Number, volume),
      setIdent: (on) => SimVar.SetSimVarValue('K:RADIO_ADF2_IDENT_SET', SimVarValueType.Number, on ? 1 : 0),
    },
    [RadioNavSelectedNavaid.Ls]: {
      setVolume: (volume, amuIndex) => {
        return Promise.all([
          SimVar.SetSimVarValue('NAV3_VOLUME_SET_EX1', SimVarValueType.Number, amuIndex === 2 ? 0 : volume),
          SimVar.SetSimVarValue('NAV4_VOLUME_SET_EX1', SimVarValueType.Number, amuIndex === 2 ? volume : 0),
        ]);
      },
      setIdent: (on, amuIndex) => {
        return Promise.all([
          SimVar.SetSimVarValue('RADIO_VOR3_IDENT_SET', SimVarValueType.Number, amuIndex === 2 ? 0 : on ? 1 : 0),
          SimVar.SetSimVarValue('RADIO_VOR4_IDENT_SET', SimVarValueType.Number, amuIndex === 2 ? (on ? 1 : 0) : 0),
        ]);
      },
    },
    [RadioNavSelectedNavaid.Vor1]: {
      setVolume: (volume) => SimVar.SetSimVarValue('K:NAV1_VOLUME_SET_EX1', SimVarValueType.Number, volume),
      setIdent: (on) => SimVar.SetSimVarValue('K:RADIO_VOR1_IDENT_SET', SimVarValueType.Number, on ? 1 : 0),
    },
    [RadioNavSelectedNavaid.Vor2]: {
      setVolume: (volume) => SimVar.SetSimVarValue('K:NAV2_VOLUME_SET_EX1', SimVarValueType.Number, volume),
      setIdent: (on) => SimVar.SetSimVarValue('K:RADIO_VOR2_IDENT_SET', SimVarValueType.Number, on ? 1 : 0),
    },
    [RadioNavSelectedNavaid.Mkr]: {
      setVolume: () => Promise.resolve(),
      setIdent: (on) => {
        const wasOn = SimVar.GetSimVarValue('MARKER SOUND', SimVarValueType.Bool) > 0;
        if (on !== wasOn) {
          return SimVar.SetSimVarValue('K:MARKER_SOUND_TOGGLE', SimVarValueType.Number, 0);
        }
        return Promise.resolve();
      },
    },
  };

  private static readonly comDefinitions: Record<ComIndex, ComDefinition> = {
    [ComIndex.Vhf1]: {
      setVolume: (volume) => SimVar.SetSimVarValue('K:COM1_VOLUME_SET', SimVarValueType.Number, volume),
      setReceive: (on) => SimVar.SetSimVarValue('K:COM1_RECEIVE_SELECT', SimVarValueType.Number, on ? 1 : 0),
      setTransmit: (on, amuIndex) => {
        return Promise.all([
          SimVar.SetSimVarValue(
            amuIndex === 2 ? 'K:COPILOT_TRANSMITTER_SET' : 'K:PILOT_TRANSMITTER_SET',
            SimVarValueType.Enum,
            on ? SimTransmitStates.Com1 : SimTransmitStates.None,
          ),
          SimVar.SetSimVarValue(
            amuIndex === 2 ? 'K:PILOT_TRANSMITTER_SET' : 'K:COPILOT_TRANSMITTER_SET',
            SimVarValueType.Enum,
            SimTransmitStates.None,
          ),
        ]);
      },
    },
    [ComIndex.Vhf2]: {
      setVolume: (volume) => SimVar.SetSimVarValue('K:COM2_VOLUME_SET', SimVarValueType.Number, volume),
      setReceive: (on) => SimVar.SetSimVarValue('K:COM2_RECEIVE_SELECT', SimVarValueType.Number, on ? 1 : 0),
      setTransmit: (on, amuIndex) => {
        return Promise.all([
          SimVar.SetSimVarValue(
            amuIndex === 2 ? 'K:COPILOT_TRANSMITTER_SET' : 'K:PILOT_TRANSMITTER_SET',
            SimVarValueType.Enum,
            on ? SimTransmitStates.Com2 : SimTransmitStates.None,
          ),
          SimVar.SetSimVarValue(
            amuIndex === 2 ? 'K:PILOT_TRANSMITTER_SET' : 'K:COPILOT_TRANSMITTER_SET',
            SimVarValueType.Enum,
            SimTransmitStates.None,
          ),
        ]);
      },
    },
    [ComIndex.Vhf3]: {
      setVolume: (volume) => SimVar.SetSimVarValue('K:COM3_VOLUME_SET', SimVarValueType.Number, volume),
      setReceive: (on) => SimVar.SetSimVarValue('K:COM3_RECEIVE_SELECT', SimVarValueType.Number, on ? 1 : 0),
      setTransmit: (on, amuIndex) => {
        return Promise.all([
          SimVar.SetSimVarValue(
            amuIndex === 2 ? 'K:COPILOT_TRANSMITTER_SET' : 'K:PILOT_TRANSMITTER_SET',
            SimVarValueType.Enum,
            on ? SimTransmitStates.Com3 : SimTransmitStates.None,
          ),
          SimVar.SetSimVarValue(
            amuIndex === 2 ? 'K:PILOT_TRANSMITTER_SET' : 'K:COPILOT_TRANSMITTER_SET',
            SimVarValueType.Enum,
            SimTransmitStates.None,
          ),
        ]);
      },
    },
  };

  private readonly sub = this.bus.getSubscriber<PilotSeatEvents & RmpAmuBusEvents>();

  private activeAmuIndex = 1;

  private readonly navaidStates: Map<RadioNavSelectedNavaid, NavaidState> = new Map(
    Object.entries(SimAudioManager.navaidDefinitions).map(([key, def]) => {
      const isIdentOn = Subject.create<boolean>(false);
      const volume = Subject.create<number>(0);

      const subs = [
        isIdentOn.sub((v) => def.setIdent(v === true, this.activeAmuIndex), true, true),
        volume.sub((v) => def.setVolume(v, this.activeAmuIndex), true, true),
      ];

      return [parseInt(key), { ...def, isIdentOn, volume, subs }];
    }),
  );

  private readonly comStates: Map<ComIndex, ComState> = new Map(
    Object.entries(SimAudioManager.comDefinitions).map(([key, def]) => {
      const isReceiveOn = Subject.create<boolean>(false);
      const isTransmitOn = Subject.create<boolean>(false);
      const volume = Subject.create<number>(0);

      const subs = [
        isReceiveOn.sub((v) => def.setReceive(v === true), true, true),
        isTransmitOn.sub((v) => def.setTransmit(v === true, this.activeAmuIndex), true, true),
        volume.sub((v) => def.setVolume(v), true, true),
      ];

      return [parseInt(key), { ...def, isReceiveOn, isTransmitOn, volume, subs }];
    }),
  );

  private readonly pilotSeat = ConsumerValue.create(this.sub.on('pilot_seat'), PilotSeat.Left);

  constructor(
    private readonly bus: EventBus,
    private readonly amu1: AudioManagementUnit,
    private readonly amu2: AudioManagementUnit,
  ) {}

  init(): void {
    for (const navaid of this.navaidStates.values()) {
      for (const sub of navaid.subs) {
        sub.resume(true);
      }
    }

    for (const com of this.comStates.values()) {
      for (const sub of com.subs) {
        sub.resume(true);
      }
    }
  }
  onUpdate(): void {
    this.activeAmuIndex = !this.amu1.isHealthy.get() || this.pilotSeat.get() === PilotSeat.Right ? 2 : 1;
    const activeAmu = this.activeAmuIndex === 2 ? this.amu2 : this.amu1;
    const isAmuHealthy = activeAmu.isHealthy.get();

    const activeNavOutput = isAmuHealthy ? activeAmu.getActiveNavAudio() : null;

    for (const [navaid, state] of this.navaidStates.entries()) {
      if (navaid === activeNavOutput) {
        state.isIdentOn.set(activeAmu.isNavOutputOn() && !activeAmu.isNavVoiceFiltered());
        state.volume.set(activeAmu.getNavVolume());
      } else {
        state.isIdentOn.set(false);
        state.volume.set(0);
      }
    }

    for (const [index, state] of this.comStates.entries()) {
      state.isReceiveOn.set(isAmuHealthy && activeAmu.isComReceiveOn(index));
      state.isTransmitOn.set(isAmuHealthy && activeAmu.getSelectedComTransmitter() === index);
      state.volume.set(isAmuHealthy ? activeAmu.getComVolume(index) : 0);
    }
  }
}
