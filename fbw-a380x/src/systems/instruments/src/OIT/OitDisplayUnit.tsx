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
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import { FailuresConsumer, NXDataStore } from '@flybywiresim/fbw-sdk';
import { AcElectricalBus, DcElectricalBus } from '@shared/electrical';

import './oit-display-unit.scss';
import { OitSimvars } from './OitSimvarPublisher';
import { A380Failure } from '@failures';
import { OisOperationMode } from './OIT';

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
  [OitDisplayUnitID.CaptOit]: 78,
  [OitDisplayUnitID.FoOit]: 79,
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
  private readonly subs: Subscription[] = [];

  private readonly sub = this.props.bus.getSubscriber<OitSimvars & ClockEvents>();

  private readonly state = Subject.create<DisplayUnitState>(
    SimVar.GetSimVarValue('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool') ? DisplayUnitState.Off : DisplayUnitState.Standby,
  );

  private readonly failureKey =
    this.props.displayUnitId === OitDisplayUnitID.CaptOit ? A380Failure.CaptainOit : A380Failure.FirstOfficerOit;

  private timeOut: number = 0;

  private readonly selfTestRef = FSComponent.createRef<HTMLDivElement>();

  private oitRef = FSComponent.createRef<HTMLDivElement>();

  public readonly powered = Subject.create(false);

  /** in seconds */
  private readonly remainingStartupTime = Subject.create(24);
  private readonly totalStartupTime = Subject.create(24);

  private readonly progressBarFillWidth = MappedSubject.create(
    ([remaining, total]) => (1 - remaining / total) * 40,
    this.remainingStartupTime,
    this.totalStartupTime,
  ).map((t) => `${t}%`);

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

  private readonly failedDisplay = this.failed.map((v) => (v ? 'block' : 'none'));

  private readonly bus1Simvar = `L:A32NX_ELEC_${DisplayUnitToDCBus[this.props.displayUnitId][0]}_BUS_IS_POWERED`;
  private readonly bus2Simvar = `L:A32NX_ELEC_${DisplayUnitToDCBus[this.props.displayUnitId][1]}_BUS_IS_POWERED`;
  private readonly bus3Simvar = `L:A32NX_ELEC_${DisplayUnitToDCBus[this.props.displayUnitId][2]}_BUS_IS_POWERED`;

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.failuresConsumer.register(this.failureKey);

    this.subs.push(this.sub.on('realTime').handle(() => this.update()));
    this.subs.push(
      this.sub
        .on('realTime')
        .atFrequency(4)
        .handle(() => {
          // override MSFS menu animations setting for this instrument
          if (!document.documentElement.classList.contains('animationsEnabled')) {
            document.documentElement.classList.add('animationsEnabled');
          }

          // Update loading progress bar
          if (this.powered.get()) {
            this.remainingStartupTime.set(Math.max(0, this.remainingStartupTime.get() - 0.25));
          }
        }),
    );

    this.subs.push(
      MappedSubject.create(
        () => {
          this.updateState();
        },
        this.brightness,
        this.powered,
        this.failed,
      ),
    );

    this.subs.push(
      this.progressBarFillWidth,
      this.brightness,
      this.nssAnsu1Failed,
      this.nssAnsu2Failed,
      this.allNssAnsuFailed,
      this.fltOpsAnsuFailed,
      this.fltOpsLaptopFailed,
      this.fltOpsFailed,
      this.failed,
      this.failedDisplay,
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
      ? SimVar.GetSimVarValue(this.bus1Simvar, 'Bool')
      : true;
    const poweredByBus2 = DisplayUnitToDCBus[this.props.displayUnitId][1]
      ? SimVar.GetSimVarValue(this.bus2Simvar, 'Bool')
      : true;
    const poweredByBus3 = DisplayUnitToDCBus[this.props.displayUnitId][2]
      ? SimVar.GetSimVarValue(this.bus3Simvar, 'Bool')
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
      this.totalStartupTime.set(parseInt(NXDataStore.get('CONFIG_SELF_TEST_TIME', '12')) * 2);
      this.remainingStartupTime.set(this.totalStartupTime.get());
      this.setTimer(this.remainingStartupTime.get());
    } else if (
      (this.state.get() === DisplayUnitState.Selftest || this.state.get() === DisplayUnitState.Bootup) &&
      (this.brightness.get() === 0 || !this.powered.get())
    ) {
      this.state.set(DisplayUnitState.Off);
      clearTimeout(this.timeOut);
    }

    if (this.state.get() === DisplayUnitState.Selftest) {
      this.selfTestRef.instance.style.display = 'block';
      this.oitRef.instance.style.display = 'none';
    } else if (this.state.get() === DisplayUnitState.Bootup) {
      this.selfTestRef.instance.style.display = 'block';
      this.oitRef.instance.style.display = 'none';
    } else if (this.state.get() === DisplayUnitState.On) {
      this.selfTestRef.instance.style.display = 'none';
      this.oitRef.instance.style.display = 'block';
    } else if (this.state.get() === DisplayUnitState.Failed) {
      this.selfTestRef.instance.style.display = 'none';
      this.oitRef.instance.style.display = 'none';
    } else {
      this.selfTestRef.instance.style.display = 'none';
      this.oitRef.instance.style.display = 'none';
    }
  }

  destroy(): void {
    for (const s of this.subs) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <>
        <div class="SelfTest" ref={this.selfTestRef}>
          <div class="FbwTail" />
          <div class="LoadingProgressBarBackground" />
          <div
            class="LoadingProgressBarFill"
            style={{
              width: this.progressBarFillWidth,
            }}
          />
        </div>

        <div style="display:none" ref={this.oitRef}>
          {this.props.children}
        </div>

        <svg
          style={{
            display: this.failedDisplay,
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
