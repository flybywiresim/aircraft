// Copyright (c) 2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ClockEvents,
  ComponentProps,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  SubscribableMapFunctions,
  VNode,
} from '@microsoft/msfs-sdk';
import { FailuresConsumer, NXDataStore } from '@flybywiresim/fbw-sdk';
import { AcElectricalBus, DcElectricalBus } from '@shared/electrical';

import './oit-display-unit.scss';
import { OitSimvars } from 'instruments/src/OIT/OitSimvarPublisher';
import { A380Failure } from '@failures';
import { OisOperationMode } from 'instruments/src/OIT/OIT';

export const getDisplayIndex = () => {
  const url = Array.from(document.querySelectorAll('vcockpit-panel > *'))
    ?.find((it) => it.tagName.toLowerCase() !== 'wasm-instrument')
    ?.getAttribute('url');

  return url ? parseInt(url.substring(url.length - 1), 10) : 0;
};

export enum OitDisplayUnitID {
  CaptOit,
  FoOit,
}

const DisplayUnitToDCBus: { [k in OitDisplayUnitID]: (DcElectricalBus | AcElectricalBus)[] } = {
  [OitDisplayUnitID.CaptOit]: [AcElectricalBus.Ac2, DcElectricalBus.Dc2],
  [OitDisplayUnitID.FoOit]: [AcElectricalBus.AcEss, DcElectricalBus.DcEssInFlight, DcElectricalBus.Dc1],
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DisplayUnitToPotentiometer: { [k in OitDisplayUnitID]: number } = {
  [OitDisplayUnitID.CaptOit]: 81,
  [OitDisplayUnitID.FoOit]: 82,
};

interface DisplayUnitProps {
  readonly bus: EventBus;
  readonly displayUnitId: OitDisplayUnitID;
  readonly failuresConsumer: FailuresConsumer;
  readonly nssOrFltOps: Subscribable<OisOperationMode>;
  readonly test?: Subscribable<number>;
}

enum DisplayUnitState {
  On,
  Off,
  Bootup,
  Selftest,
  Standby,
  Failed,
}

export class OitDisplayUnit extends DisplayComponent<DisplayUnitProps & ComponentProps> {
  private readonly sub = this.props.bus.getSubscriber<OitSimvars & ClockEvents>();

  private readonly state = Subject.create<DisplayUnitState>(
    SimVar.GetSimVarValue('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool') ? DisplayUnitState.Off : DisplayUnitState.Standby,
  );

  private readonly failureKey =
    this.props.displayUnitId === OitDisplayUnitID.CaptOit ? A380Failure.CaptainOit : A380Failure.FirstOfficerOit;

  private timeOut: number = 0;

  private selfTestRef = FSComponent.createRef<SVGElement>();

  private thalesBootupRef = FSComponent.createRef<SVGElement>();

  private oitRef = FSComponent.createRef<HTMLDivElement>();

  public readonly powered = Subject.create(false);

  private readonly brightness = ConsumerSubject.create(
    this.sub.on(this.props.displayUnitId === OitDisplayUnitID.CaptOit ? 'potentiometerCaptain' : 'potentiometerFo'),
    75,
  );

  private readonly nssAnsu1Failed = ConsumerSubject.create(this.sub.on('nssAnsu1Healthy'), true).map(
    SubscribableMapFunctions.not(),
  );

  private readonly nssAnsu2Failed = ConsumerSubject.create(this.sub.on('nssAnsu2Healthy'), true).map(
    SubscribableMapFunctions.not(),
  );

  private readonly allNssAnsuFailed = MappedSubject.create(
    SubscribableMapFunctions.and(),
    this.nssAnsu1Failed,
    this.nssAnsu2Failed,
  );

  private readonly fltOpsAnsuFailed = ConsumerSubject.create(this.sub.on('fltOpsAnsu1Healthy'), true).map(
    SubscribableMapFunctions.not(),
  );

  private readonly fltOpsLaptopFailed = ConsumerSubject.create(
    this.sub.on(this.props.displayUnitId === OitDisplayUnitID.CaptOit ? 'laptopCaptHealthy' : 'laptopFoHealthy'),
    true,
  ).map(SubscribableMapFunctions.not());

  private readonly fltOpsFailed = MappedSubject.create(
    SubscribableMapFunctions.or(),
    this.fltOpsAnsuFailed,
    this.fltOpsLaptopFailed,
  );

  public readonly failed = MappedSubject.create(
    ([opMode, state, nssFail, fltOpsFail]) =>
      state === DisplayUnitState.On && ((opMode === 'nss' && nssFail) || (opMode === 'flt-ops' && fltOpsFail)),
    this.props.nssOrFltOps,
    this.state,
    this.allNssAnsuFailed,
    this.fltOpsFailed,
  );

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.failuresConsumer.register(this.failureKey);

    this.sub.on('realTime').handle(() => this.update());
    this.sub
      .on('realTime')
      .atFrequency(1)
      .handle((_t) => {
        // override MSFS menu animations setting for this instrument
        if (!document.documentElement.classList.contains('animationsEnabled')) {
          document.documentElement.classList.add('animationsEnabled');
        }
      });

    MappedSubject.create(
      () => {
        this.updateState();
      },
      this.brightness,
      this.powered,
      this.failed,
    );
  }

  setTimer(time: number) {
    this.timeOut = window.setTimeout(() => {
      if (this.state.get() === DisplayUnitState.Standby) {
        this.state.set(DisplayUnitState.Off);
      }
      if (this.state.get() === DisplayUnitState.Selftest) {
        this.state.set(DisplayUnitState.On);
      }
      this.updateState();
    }, time * 1000);
  }

  public update() {
    const poweredByBus1 = DisplayUnitToDCBus[this.props.displayUnitId][0]
      ? SimVar.GetSimVarValue(`L:A32NX_ELEC_${DisplayUnitToDCBus[this.props.displayUnitId][0]}_BUS_IS_POWERED`, 'Bool')
      : true;
    const poweredByBus2 = DisplayUnitToDCBus[this.props.displayUnitId][1]
      ? SimVar.GetSimVarValue(`L:A32NX_ELEC_${DisplayUnitToDCBus[this.props.displayUnitId][1]}_BUS_IS_POWERED`, 'Bool')
      : true;
    const poweredByBus3 = DisplayUnitToDCBus[this.props.displayUnitId][2]
      ? SimVar.GetSimVarValue(`L:A32NX_ELEC_${DisplayUnitToDCBus[this.props.displayUnitId][2]}_BUS_IS_POWERED`, 'Bool')
      : true;
    this.powered.set(
      (poweredByBus1 || poweredByBus2 || poweredByBus3) && !this.props.failuresConsumer.isActive(this.failureKey),
    );
  }

  updateState() {
    if (this.state.get() === DisplayUnitState.On && (this.brightness.get() === 0 || !this.powered.get())) {
      this.state.set(DisplayUnitState.Standby);
      this.setTimer(10);
    } else if (this.state.get() === DisplayUnitState.Standby && this.brightness.get() !== 0 && this.powered.get()) {
      this.state.set(DisplayUnitState.On);
      clearTimeout(this.timeOut);
    } else if (this.state.get() === DisplayUnitState.Off && this.brightness.get() !== 0 && this.powered.get()) {
      this.state.set(DisplayUnitState.Bootup);
      this.setTimer(0.25 + Math.random() * 0.2);
    } else if (this.state.get() === DisplayUnitState.Bootup && this.brightness.get() !== 0 && this.powered.get()) {
      this.state.set(DisplayUnitState.Selftest);
      this.setTimer(parseInt(NXDataStore.get('CONFIG_SELF_TEST_TIME', '15')));
    } else if (
      (this.state.get() === DisplayUnitState.Selftest || this.state.get() === DisplayUnitState.Bootup) &&
      (this.brightness.get() === 0 || !this.powered.get())
    ) {
      this.state.set(DisplayUnitState.Off);
      clearTimeout(this.timeOut);
    }

    if (this.state.get() === DisplayUnitState.Selftest) {
      this.selfTestRef.instance.style.display = 'block';
      this.thalesBootupRef.instance.style.display = 'none';
      this.oitRef.instance.style.display = 'none';
    } else if (this.state.get() === DisplayUnitState.Bootup) {
      this.selfTestRef.instance.style.display = 'none';
      this.thalesBootupRef.instance.style.display = 'block';
      this.oitRef.instance.style.display = 'none';
    } else if (this.state.get() === DisplayUnitState.On) {
      this.selfTestRef.instance.style.display = 'none';
      this.thalesBootupRef.instance.style.display = 'none';
      this.oitRef.instance.style.display = 'block';
    } else if (this.state.get() === DisplayUnitState.Failed) {
      this.selfTestRef.instance.style.display = 'none';
      this.thalesBootupRef.instance.style.display = 'none';
      this.oitRef.instance.style.display = 'none';
    } else {
      this.selfTestRef.instance.style.display = 'none';
      this.thalesBootupRef.instance.style.display = 'none';
      this.oitRef.instance.style.display = 'none';
    }
  }

  render(): VNode {
    return (
      <>
        <svg style="display:none" ref={this.selfTestRef} class="SelfTest" viewBox="0 0 1333 1000">
          <rect class="SelfTestBackground" x="0" y="0" width="100%" height="100%" />

          <text class="SelfTestText" x="50%" y="50%">
            SAFETY TEST IN PROGRESS
          </text>
          <text class="SelfTestText" x="50%" y="54%">
            (MAX 30 SECONDS)
          </text>
        </svg>

        <svg style="display:none" ref={this.thalesBootupRef} class="SelfTest" viewBox="0 0 1333 1000">
          <rect class="SelfTestBackground" x="0" y="0" width="100%" height="100%" />

          <rect x={84} y={880} width={600} height={70} fill="#ffffff" />
          <rect x={89} y={885} width={35} height={60} fill="#4d4dff" />
        </svg>

        <div style="display:none" ref={this.oitRef}>
          {this.props.children}
        </div>

        <svg
          style={{
            display: this.failed.map((v) => (v ? 'block' : 'none')),
          }}
          class="AnsuFailed"
          viewBox="0 0 1333 1000"
        >
          <text class="AnsuFailedText" x="50%" y="50%">
            Not available.
          </text>
        </svg>
      </>
    );
  }
}
