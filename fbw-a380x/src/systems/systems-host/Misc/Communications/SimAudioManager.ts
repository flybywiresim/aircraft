// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { PilotSeat, PilotSeatEvents } from '@flybywiresim/fbw-sdk';
import {
  ConsumerValue,
  EventBus,
  Instrument,
  KeyEventManager,
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
  private readonly navaidDefinitions: Record<RadioNavSelectedNavaid, NavaidDefinition> = {
    [RadioNavSelectedNavaid.Adf1]: {
      setVolume: (volume) => this.keyEventManager?.triggerKey('ADF_VOLUME_SET', true, volume),
      setIdent: (on) => this.keyEventManager?.triggerKey('RADIO_ADF_IDENT_SET', true, on ? 1 : 0),
    },
    [RadioNavSelectedNavaid.Adf2]: {
      setVolume: (volume) => this.keyEventManager?.triggerKey('ADF2_VOLUME_SET', true, volume),
      setIdent: (on) => this.keyEventManager?.triggerKey('RADIO_ADF2_IDENT_SET', true, on ? 1 : 0),
    },
    [RadioNavSelectedNavaid.Ls]: {
      setVolume: (volume, amuIndex) => {
        return Promise.all([
          this.keyEventManager?.triggerKey('NAV3_VOLUME_SET_EX1', true, amuIndex === 2 ? 0 : volume),
          this.keyEventManager?.triggerKey('NAV4_VOLUME_SET_EX1', true, amuIndex === 2 ? volume : 0),
        ]);
      },
      setIdent: (on, amuIndex) => {
        return Promise.all([
          this.keyEventManager?.triggerKey('RADIO_VOR3_IDENT_SET', true, amuIndex === 2 ? 0 : on ? 1 : 0),
          this.keyEventManager?.triggerKey('RADIO_VOR4_IDENT_SET', true, amuIndex === 2 ? (on ? 1 : 0) : 0),
        ]);
      },
    },
    [RadioNavSelectedNavaid.Vor1]: {
      setVolume: (volume) => this.keyEventManager?.triggerKey('NAV1_VOLUME_SET_EX1', true, volume),
      setIdent: (on) => this.keyEventManager?.triggerKey('RADIO_VOR1_IDENT_SET', true, on ? 1 : 0),
    },
    [RadioNavSelectedNavaid.Vor2]: {
      setVolume: (volume) => this.keyEventManager?.triggerKey('NAV2_VOLUME_SET_EX1', true, volume),
      setIdent: (on) => this.keyEventManager?.triggerKey('RADIO_VOR2_IDENT_SET', true, on ? 1 : 0),
    },
    [RadioNavSelectedNavaid.Mkr]: {
      setVolume: () => Promise.resolve(),
      setIdent: (on) => {
        const wasOn = SimVar.GetSimVarValue('MARKER SOUND', SimVarValueType.Bool) > 0;
        if (on !== wasOn) {
          return this.keyEventManager?.triggerKey('MARKER_SOUND_TOGGLE', true);
        }
        return Promise.resolve();
      },
    },
  };

  private readonly comDefinitions: Record<ComIndex, ComDefinition> = {
    [ComIndex.Vhf1]: {
      setVolume: (volume) => this.keyEventManager?.triggerKey('COM1_VOLUME_SET', true, volume),
      setReceive: (on) => this.keyEventManager?.triggerKey('COM1_RECEIVE_SELECT', true, on ? 1 : 0),
      setTransmit: (on, amuIndex) => {
        return Promise.all([
          this.keyEventManager?.triggerKey(
            amuIndex === 2 ? 'COPILOT_TRANSMITTER_SET' : 'PILOT_TRANSMITTER_SET',
            true,
            on ? SimTransmitStates.Com1 : SimTransmitStates.None,
          ),
          this.keyEventManager?.triggerKey(
            amuIndex === 2 ? 'PILOT_TRANSMITTER_SET' : 'COPILOT_TRANSMITTER_SET',
            true,
            SimTransmitStates.None,
          ),
        ]);
      },
    },
    [ComIndex.Vhf2]: {
      setVolume: (volume) => this.keyEventManager?.triggerKey('COM2_VOLUME_SET', true, volume),
      setReceive: (on) => this.keyEventManager?.triggerKey('COM2_RECEIVE_SELECT', true, on ? 1 : 0),
      setTransmit: (on, amuIndex) => {
        return Promise.all([
          this.keyEventManager?.triggerKey(
            amuIndex === 2 ? 'COPILOT_TRANSMITTER_SET' : 'PILOT_TRANSMITTER_SET',
            true,
            on ? SimTransmitStates.Com2 : SimTransmitStates.None,
          ),
          this.keyEventManager?.triggerKey(
            amuIndex === 2 ? 'PILOT_TRANSMITTER_SET' : 'COPILOT_TRANSMITTER_SET',
            true,
            SimTransmitStates.None,
          ),
        ]);
      },
    },
    [ComIndex.Vhf3]: {
      setVolume: (volume) => this.keyEventManager?.triggerKey('COM3_VOLUME_SET', true, volume),
      setReceive: (on) => this.keyEventManager?.triggerKey('COM3_RECEIVE_SELECT', true, on ? 1 : 0),
      setTransmit: (on, amuIndex) => {
        return Promise.all([
          this.keyEventManager?.triggerKey(
            amuIndex === 2 ? 'COPILOT_TRANSMITTER_SET' : 'PILOT_TRANSMITTER_SET',
            true,
            on ? SimTransmitStates.Com3 : SimTransmitStates.None,
          ),
          this.keyEventManager?.triggerKey(
            amuIndex === 2 ? 'PILOT_TRANSMITTER_SET' : 'COPILOT_TRANSMITTER_SET',
            true,
            SimTransmitStates.None,
          ),
        ]);
      },
    },
  };

  private readonly sub = this.bus.getSubscriber<PilotSeatEvents & RmpAmuBusEvents>();

  private activeAmuIndex = 1;

  private readonly navaidStates: Map<RadioNavSelectedNavaid, NavaidState> = new Map(
    Object.entries(this.navaidDefinitions).map(([key, def]) => {
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
    Object.entries(this.comDefinitions).map(([key, def]) => {
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

  private keyEventManager?: KeyEventManager;

  private isInit = false;

  constructor(
    private readonly bus: EventBus,
    private readonly amu1: AudioManagementUnit,
    private readonly amu2: AudioManagementUnit,
  ) {
    KeyEventManager.getManager(bus).then((manager) => {
      this.keyEventManager = manager;
      if (this.isInit) {
        this.resume();
      }
    });
  }

  init(): void {
    if (this.keyEventManager) {
      this.resume();
    }
    this.isInit = true;
  }

  private resume(): void {
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
      if (!isAmuHealthy || !activeAmu.isComReceiveOn(index)) {
        state.isReceiveOn.set(false);
      }
      if (!isAmuHealthy || activeAmu.getSelectedComTransmitter() !== index) {
        state.isTransmitOn.set(false);
      }
      state.volume.set(isAmuHealthy ? activeAmu.getComVolume(index) : 0);
    }

    // need to set on states after to ensure correct event ordering
    if (isAmuHealthy) {
      for (const [index, state] of this.comStates.entries()) {
        if (activeAmu.isComReceiveOn(index)) {
          state.isReceiveOn.set(true);
        }
        if (activeAmu.getSelectedComTransmitter() === index) {
          state.isTransmitOn.set(true);
        }
      }
    }
  }
}
