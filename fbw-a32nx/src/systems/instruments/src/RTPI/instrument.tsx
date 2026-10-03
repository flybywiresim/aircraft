// Copyright (c) 2021-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import './style.scss';

import {
  FsBaseInstrument,
  FSComponent,
  FsInstrument,
  LifecycleComponent,
  MappedSubject,
  RegisteredSimVarUtils,
  SimVarValueType,
  Subject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';

import { Arinc429Register, Arinc429RegisterSubject } from '@flybywiresim/fbw-sdk';

interface RtpiProps {
  readonly isLightTestActive: Subscribable<boolean>;
  readonly isPowered: Subscribable<boolean>;
  readonly trimPosition: Subscribable<Arinc429Register>;
}

class Rtpi extends LifecycleComponent<RtpiProps> {
  private isBlank = MappedSubject.create(
    ([isPowered, trim]) => !isPowered || trim.isFailureWarning(),
    this.props.isPowered,
    this.props.trimPosition,
  ).withLifecycle(this.defaultLifecycle);

  public render(): VNode | null {
    return (
      <svg class={{ 'rtpi-svg': true, hidden: this.isBlank }} viewBox="0 0 338 128">
        <text x="0" y="110" class="direction">
          {MappedSubject.create(
            ([test, trim]) => (test ? 'T' : trim.value >= 0 ? 'L' : 'R'),
            this.props.isLightTestActive,
            this.props.trimPosition,
          ).withLifecycle(this.defaultLifecycle)}
        </text>
        <text x="330" y="110" class="value">
          {MappedSubject.create(
            ([test, trim]) => (test ? '88.8' : Math.abs(trim.value).toFixed(1)),
            this.props.isLightTestActive,
            this.props.trimPosition,
          ).withLifecycle(this.defaultLifecycle)}
        </text>
      </svg>
    );
  }
}

class RtpiFsInstrument implements FsInstrument {
  private static readonly arincCache = Arinc429Register.empty();

  private readonly dc2IsPoweredVar = RegisteredSimVarUtils.createBoolean('L:A32NX_ELEC_DC_2_BUS_IS_POWERED');

  private readonly annLtTestVar = RegisteredSimVarUtils.create('L:A32NX_OVHD_INTLT_ANN', SimVarValueType.Enum);

  private readonly fac2DiscreteWord2Var = RegisteredSimVarUtils.create(
    'L:A32NX_FAC_2_DISCRETE_WORD_2',
    SimVarValueType.Enum,
  );

  private readonly fac1RudderTrimPosVar = RegisteredSimVarUtils.create(
    'L:A32NX_FAC_1_RUDDER_TRIM_POS',
    SimVarValueType.Enum,
  );

  private readonly fac2RudderTrimPosVar = RegisteredSimVarUtils.create(
    'L:A32NX_FAC_2_RUDDER_TRIM_POS',
    SimVarValueType.Enum,
  );

  private readonly isPowered = Subject.create(false);

  private readonly isLightTestActive = Subject.create(false);

  private readonly trimPosition = Arinc429RegisterSubject.createEmpty();

  public constructor(public readonly instrument: BaseInstrument) {
    instrument.innerText = ''; // remove didn't load text
    FSComponent.render(
      <Rtpi isLightTestActive={this.isLightTestActive} isPowered={this.isPowered} trimPosition={this.trimPosition} />,
      instrument,
    );
  }

  public Update(): void {
    this.isPowered.set(this.dc2IsPoweredVar.get());

    this.isLightTestActive.set(this.annLtTestVar.get() === 0);

    const fac2DiscreteWord2 = RtpiFsInstrument.arincCache.set(this.fac2DiscreteWord2Var.get());
    if (fac2DiscreteWord2.bitValueOr(13, false)) {
      this.trimPosition.setWord(this.fac2RudderTrimPosVar.get());
    } else {
      this.trimPosition.setWord(this.fac1RudderTrimPosVar.get());
    }
  }

  public onFlightStart(): void {}

  public onGameStateChanged(): void {}

  public onInteractionEvent(): void {}

  public onSoundEnd(): void {}
}

class RtpiBaseInstrument extends FsBaseInstrument<RtpiFsInstrument> {
  public constructInstrument(): RtpiFsInstrument {
    return new RtpiFsInstrument(this);
  }

  public get templateID(): string {
    return 'A32NX_RTPI';
  }
}

registerInstrument('a32nx-rtpi', RtpiBaseInstrument);
