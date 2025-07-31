// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  ConsumerSubject,
  EventBus,
  GameStateProvider,
  Instrument,
  MappedSubject,
  SimVarValueType,
  Subject,
  Wait,
} from '@microsoft/msfs-sdk';
import { GroundSupportEvents, MsfsElectricsEvents, MsfsFlightModelEvents, MsfsMiscEvents } from '@flybywiresim/fbw-sdk';

export class GPUManagement implements Instrument {
  private readonly sub = this.bus.getSubscriber<
    MsfsElectricsEvents & MsfsFlightModelEvents & MsfsMiscEvents & GroundSupportEvents & GPUControlEvents
  >();

  private readonly gpuDoorOpenPercent = ConsumerSubject.create(
    this.sub.on(`msfs_interactive_point_open_${this.gpuDoorIndex}`),
    0,
  );
  private readonly gpuHookedUp = MappedSubject.create(
    ([gpuDoorOpenPercent]) => gpuDoorOpenPercent >= 1,
    this.gpuDoorOpenPercent,
  );

  private readonly groundVelocity = ConsumerSubject.create(this.sub.on('msfs_ground_velocity'), 0);

  private readonly cameraState = Subject.create(-1);

  private readonly msfsExtPowerAvailStates = new Map<number, ConsumerSubject<boolean>>();

  private readonly ExtPowerAvailStates = new Map<number, ConsumerSubject<boolean>>();

  // state 2 is cockpit, state 3 is external
  private readonly isIngame = MappedSubject.create(
    ([gameState, cameraState]) => gameState === GameState.ingame && (cameraState === 2 || cameraState === 3),
    GameStateProvider.get(),
    this.cameraState,
  );

  private initialIngameFrame: boolean;
  constructor(
    private readonly bus: EventBus,
    private readonly gpuDoorIndex: number,
    private readonly numberOfGPUs: number,
  ) {
    for (let index = 1; index <= numberOfGPUs; index++) {
      const element = ConsumerSubject.create(this.sub.on(`msfs_external_power_available_${index}`), false);
      this.msfsExtPowerAvailStates.set(index, element);
    }

    for (let index = 1; index <= numberOfGPUs; index++) {
      const element = ConsumerSubject.create(this.sub.on(`ext_pwr_avail_${index}`), false);
      this.ExtPowerAvailStates.set(index, element);
    }
  }

  public init(): void {
    Wait.awaitSubscribable(this.isIngame, (state) => state, true).then(() => {
      this.sub.on('gpu_toggle').handle(this.toggleGPU.bind(this));
      this.gpuHookedUp.sub((v) => this.setEXTpower(v));
      this.groundVelocity.sub((v) => {
        // disable ext power when aircraft starts moving
        if (v > 0.3 && this.anyGPUAvail()) {
          this.toggleGPU();
        }
      });
      this.initialIngameFrame = true;
    });
  }

  public onUpdate(): void {
    if (this.initialIngameFrame) {
      if (this.anyMSFSGPUAvail()) {
        this.setEXTpower(true);
      }
      this.initialIngameFrame = false;
    } else {
      this.cameraState.set(SimVar.GetSimVarValue('CAMERA STATE', 'enum'));
    }
  }

  private toggleGPU(): void {
    if (!this.anyGPUAvail()) {
      if (this.anyMSFSGPUAvail()) {
        // if msfs ground power is avail we are at a powered stand
        this.setEXTpower(true);
      } else {
        this.toggleMSFSGpu(); // if msfs ground power is not avail we call for gpu cart
      }
    } else {
      if (this.gpuHookedUp.get()) {
        this.toggleMSFSGpu();
      } else {
        this.setEXTpower(false);
      }
    }
  }

  private toggleMSFSGpu(): void {
    SimVar.SetSimVarValue('K:REQUEST_POWER_SUPPLY', 'Bool', true);
  }

  private setEXTpower(connect: boolean): void {
    for (let index = 1; index <= this.numberOfGPUs; index++) {
      SimVar.SetSimVarValue(`L:A32NX_EXT_PWR_AVAIL:${index}`, SimVarValueType.Bool, connect);
      if (!connect) {
        if (this.numberOfGPUs === 1) {
          // provision for the a32nx
          SimVar.SetSimVarValue(`L:A32NX_OVHD_ELEC_EXT_PWR_PB_IS_ON`, SimVarValueType.Bool, false);
        } else {
          SimVar.SetSimVarValue(`L:A32NX_OVHD_ELEC_EXT_PWR_${index}_PB_IS_ON`, SimVarValueType.Bool, false);
        }
      }
    }
  }

  private anyMSFSGPUAvail(): boolean {
    let state = false;
    for (let index = 1; index <= this.numberOfGPUs; index++) {
      state ||= this.msfsExtPowerAvailStates.get(index).get();
    }
    return state;
  }

  private anyGPUAvail(): boolean {
    let state = false;
    for (let index = 1; index <= this.numberOfGPUs; index++) {
      state ||= this.ExtPowerAvailStates.get(index).get();
    }
    return state;
  }
}

export interface GPUControlEvents {
  /** event to toggle the GPU*/
  gpu_toggle: unknown;
}
