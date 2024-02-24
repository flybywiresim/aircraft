// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FSComponent, ClockEvents, DisplayComponent, EventBus, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { NXDataStore } from '@flybywiresim/fbw-sdk';
// import { getSupplier } from '@flybywiresim/fbw-sdk';
import { DisplayVars } from './SimVarTypes';

import './common.scss';

export const getDisplayIndex = () => {
  const url = Array.from(document.querySelectorAll('vcockpit-panel > *'))
    .find((it) => it.tagName.toLowerCase() !== 'wasm-instrument')
    .getAttribute('url');

  return url ? parseInt(url.substring(url.length - 1), 10) : 0;
};

type DisplayUnitProps = {
  bus: EventBus;
  normDmc: number;
  failed?: Subscribable<boolean>;
  powered?: Subscribable<boolean>;
  brightness?: Subscribable<number>;
  test?: Subscribable<number>;
};

enum DisplayUnitState {
  On,
  Off,
  Selftest,
  Standby,
  MaintenanceMode,
  EngineeringTest,
}

export class DisplayUnit extends DisplayComponent<DisplayUnitProps> {
  private state: DisplayUnitState = SimVar.GetSimVarValue('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool')
    ? DisplayUnitState.Off
    : DisplayUnitState.Standby;

  private timeOut: number = 0;

  private selfTestRef = FSComponent.createRef<SVGElement>();

  private maintenanceModeRef = FSComponent.createRef<SVGElement>();

  private engineeringTestModeRef = FSComponent.createRef<SVGElement>();

  private pfdRef = FSComponent.createRef<HTMLDivElement>();

  // private supplyingDmc: number = 3;

  private brightness: number = 0;

  private failed = false;

  private powered = false;

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<DisplayVars & ClockEvents>();

    sub
      .on('realTime')
      .atFrequency(1)
      .handle((_t) => {
        // override MSFS menu animations setting for this instrument
        if (!document.documentElement.classList.contains('animationsEnabled')) {
          document.documentElement.classList.add('animationsEnabled');
        }
      });

    this.props.brightness?.sub((f) => {
      this.brightness = f;
      this.updateState();
    }, true);

    this.props.failed?.sub((f) => {
      this.failed = f;
      this.updateState();
    }, true);

    this.props.powered?.sub((f) => {
      this.powered = f;
      this.updateState();
    }, true);
  }

  setTimer(time: number) {
    this.timeOut = window.setTimeout(() => {
      if (this.state === DisplayUnitState.Standby) {
        this.state = DisplayUnitState.Off;
      }
      if (this.state === DisplayUnitState.Selftest) {
        this.state = DisplayUnitState.On;
      }
      this.updateState();
    }, time * 1000);
  }

  // TODO: Fix and reenable
  /*
    checkMaintMode() {
        const dmcKnob = SimVar.GetSimVarValue('L:A32NX_EIS_DMC_SWITCHING_KNOB', 'Enum');
        this.supplyingDmc = getSupplier(this.props.normDmc, dmcKnob);
        const dmcDisplayTestMode = SimVar.GetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${this.supplyingDmc}`, 'Enum');
        switch (dmcDisplayTestMode) {
        case 1:
            this.state = DisplayUnitState.MaintenanceMode;
            break;
        case 2:
            this.state = DisplayUnitState.EngineeringTest;
            break;
        default:
            this.state = DisplayUnitState.On;
        }
    }
    */

  updateState() {
    if (this.state !== DisplayUnitState.Off && this.failed) {
      this.state = DisplayUnitState.Off;
      clearTimeout(this.timeOut);
    } else if (this.state === DisplayUnitState.On && (this.brightness === 0 || !this.powered)) {
      this.state = DisplayUnitState.Standby;
      this.setTimer(10);
    } else if (this.state === DisplayUnitState.Standby && this.brightness !== 0 && this.powered) {
      this.state = DisplayUnitState.On;
      clearTimeout(this.timeOut);
    } else if (this.state === DisplayUnitState.Off && this.brightness !== 0 && this.powered && !this.failed) {
      this.state = DisplayUnitState.Selftest;
      this.setTimer(parseInt(NXDataStore.get('CONFIG_SELF_TEST_TIME', '15')));
    } else if (this.state === DisplayUnitState.Selftest && (this.brightness === 0 || !this.powered)) {
      this.state = DisplayUnitState.Off;
      clearTimeout(this.timeOut);
    }

    if (this.state === DisplayUnitState.Selftest) {
      this.selfTestRef.instance.style.display = 'block';
      this.maintenanceModeRef.instance.style.display = 'none';
      this.engineeringTestModeRef.instance.style.display = 'none';
      this.pfdRef.instance.style.display = 'none';
    } else if (this.state === DisplayUnitState.On) {
      this.selfTestRef.instance.style.display = 'none';
      this.maintenanceModeRef.instance.style.display = 'none';
      this.engineeringTestModeRef.instance.style.display = 'none';
      this.pfdRef.instance.style.display = 'block';
    } else if (this.state === DisplayUnitState.MaintenanceMode) {
      this.selfTestRef.instance.style.display = 'none';
      this.maintenanceModeRef.instance.style.display = 'block';
      this.engineeringTestModeRef.instance.style.display = 'none';
      this.pfdRef.instance.style.display = 'none';
    } else if (this.state === DisplayUnitState.EngineeringTest) {
      this.selfTestRef.instance.style.display = 'none';
      this.maintenanceModeRef.instance.style.display = 'none';
      this.engineeringTestModeRef.instance.style.display = 'block';
      this.pfdRef.instance.style.display = 'none';
    } else {
      this.selfTestRef.instance.style.display = 'none';
      this.maintenanceModeRef.instance.style.display = 'none';
      this.engineeringTestModeRef.instance.style.display = 'none';
      this.pfdRef.instance.style.display = 'none';
    }
  }

  render(): VNode {
    return (
      <>
        <svg style="display:none" ref={this.selfTestRef} class="SelfTest" viewBox="0 0 600 600">
          <rect class="SelfTestBackground" x="0" y="0" width="100%" height="100%" />
          <text class="SelfTestText" x="50%" y="50%">
            SELF TEST IN PROGRESS
          </text>
          <text class="SelfTestText" x="50%" y="56%">
            (MAX 40 SECONDS)
          </text>
        </svg>

        <svg style="display:none" ref={this.maintenanceModeRef} class="MaintenanceMode" viewBox="0 0 600 600">
          <text class="SelfTestText" x="50%" y="50%">
            MAINTENANCE MODE
          </text>
        </svg>

        <svg style="display:none" ref={this.engineeringTestModeRef} class="EngineeringTestMode" viewBox="0 0 600 600">
          <text class="EngineeringTestModeText" x={9} y={250}>
            P/N : C19755BA01
          </text>
          <text class="EngineeringTestModeText" x={10} y={270}>
            S/N : C1975517334
          </text>
          <text class="EngineeringTestModeText" x={10} y={344}>
            EIS SW
          </text>
          <text class="EngineeringTestModeText" x={10} y={366}>
            P/N : C1975517332
          </text>
          <text class="EngineeringTestModeText" text-anchor="end" x="90%" y={250}>
            THALES AVIONICS
          </text>
          <text class="EngineeringTestModeText" text-anchor="end" x="98%" y={366}>
            LCDU 725
          </text>
        </svg>

        <div style="display:none" ref={this.pfdRef}>
          {this.props.children}
        </div>
      </>
    );
  }
}
