// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  FSComponent,
  DisplayComponent,
  EventBus,
  MappedSubject,
  Subject,
  Subscribable,
  VNode,
  DebounceTimer,
} from '@microsoft/msfs-sdk';
import { Arinc429RegisterSubject, EfisNdMode, NavAidMode } from '@flybywiresim/fbw-sdk';

import { GenericFcuEvents } from '../types/GenericFcuEvents';
import { GenericDisplayManagementEvents } from '../types/GenericDisplayManagementEvents';
import { GenericVorEvents } from '../types/GenericVorEvents';
import { GenericFlightManagementBusEvents } from '../types/GenericFlightManagementBusEvents';

export class RadioNavInfo extends DisplayComponent<{ bus: EventBus; index: 1 | 2; mode: Subscribable<EfisNdMode> }> {
  private readonly isVor = Subject.create(true);

  private readonly isAdf = Subject.create(true);

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<GenericFcuEvents>();

    sub
      .on(`navaidMode${this.props.index}`)
      .whenChanged()
      .handle((value) => {
        if (value === NavAidMode.VOR) {
          this.isVor.set(true);
          this.isAdf.set(false);
        } else if (value === NavAidMode.ADF) {
          this.isVor.set(false);
          this.isAdf.set(true);
        } else {
          this.isVor.set(false);
          this.isAdf.set(false);
        }
      });
  }

  render(): VNode | null {
    return (
      <>
        <VorInfo bus={this.props.bus} index={this.props.index} visible={this.isVor} mode={this.props.mode} />
        <AdfInfo bus={this.props.bus} index={this.props.index} visible={this.isAdf} mode={this.props.mode} />
      </>
    );
  }
}

class VorInfo extends DisplayComponent<{
  bus: EventBus;
  index: 1 | 2;
  visible: Subscribable<boolean>;
  mode: Subscribable<EfisNdMode>;
}> {
  private readonly VOR_1_NEEDLE = 'M25,675 L25,680 L37,696 L13,696 L25,680 M25,696 L25,719';

  private readonly VOR_2_NEEDLE = 'M749,719 L749,696 L755,696 L743,680 L731,696 L737,696 L737,719 M743,680 L743,675';

  private readonly identSub = Subject.create('');

  private readonly frequencySub = Subject.create(0);

  private readonly hasDmeSub = Subject.create(false);

  private readonly dmeDistanceSub = Subject.create(0);

  private readonly availableSub = Subject.create(false);

  private readonly stationDeclination = Subject.create(0);

  private readonly stationLatitude = Subject.create(0);

  private readonly trueRefActive = Subject.create(false);

  private readonly dashedDme = MappedSubject.create(
    ([hasDme, dmeDistance]) => !hasDme || dmeDistance <= 0,
    this.hasDmeSub,
    this.dmeDistanceSub,
  );

  private readonly identReceived = MappedSubject.create(
    // TODO hasDme added from master ND (KBA is weird)
    ([dmeDist, hasNav, ident, hasDme]) => {
      return (dmeDist > 0 || hasNav || hasDme) && ident;
    },
    this.dmeDistanceSub,
    this.availableSub,
    this.identSub,
    this.hasDmeSub,
  );

  private readonly identVisible = Subject.create(false);

  private readonly identTimer = new DebounceTimer();

  private readonly frequencyVisible = MappedSubject.create(
    ([identVisible, frequency]) => !identVisible && frequency > 1,
    this.identVisible,
    this.frequencySub,
  );

  private readonly stationTrueRef = MappedSubject.create(
    ([latitude, declination]) => Math.abs(latitude) > 75 && declination < Number.EPSILON,
    this.stationLatitude,
    this.stationDeclination,
  );

  private readonly stationCorrected = MappedSubject.create(
    ([trueRef, stationTrueRef, available, mode]) =>
      trueRef !== stationTrueRef && available && mode !== EfisNdMode.ROSE_VOR && mode !== EfisNdMode.ROSE_ILS,
    this.trueRefActive,
    this.stationTrueRef,
    this.availableSub,
    this.props.mode,
  );

  private readonly magWarning = MappedSubject.create(
    ([trueRef, stationTrueRef, available, mode]) =>
      trueRef && !stationTrueRef && available && (mode === EfisNdMode.ROSE_VOR || mode === EfisNdMode.ROSE_ILS),
    this.trueRefActive,
    this.stationTrueRef,
    this.availableSub,
    this.props.mode,
  );

  private readonly trueWarning = MappedSubject.create(
    ([trueRef, stationTrueRef, available, mode]) =>
      !trueRef && stationTrueRef && available && (mode === EfisNdMode.ROSE_VOR || mode === EfisNdMode.ROSE_ILS),
    this.trueRefActive,
    this.stationTrueRef,
    this.availableSub,
    this.props.mode,
  );

  private readonly isVisible = MappedSubject.create(
    ([logicallyVisible, ndMode]) => (logicallyVisible && ndMode !== EfisNdMode.PLAN ? 'inherit' : 'hidden'),
    this.props.visible,
    this.props.mode,
  );

  private readonly x = this.props.index === 1 ? 37 : 668;

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<GenericDisplayManagementEvents & GenericVorEvents>();

    sub
      .on(`nav${this.props.index}Ident`)
      .whenChanged()
      .handle((v) => this.identSub.set(v));
    sub
      .on(`nav${this.props.index}Frequency`)
      .whenChanged()
      .handle((v) => this.frequencySub.set(v));
    sub
      .on(`nav${this.props.index}HasDme`)
      .whenChanged()
      .handle((v) => this.hasDmeSub.set(!!v));
    sub
      .on(`nav${this.props.index}DmeDistance`)
      .whenChanged()
      .handle((v) => this.dmeDistanceSub.set(v));
    sub
      .on(`nav${this.props.index}Available`)
      .whenChanged()
      .handle((v) => this.availableSub.set(!!v));
    sub.on(`nav${this.props.index}StationDeclination`).handle((v) => this.stationDeclination.set(v));
    sub.on(`nav${this.props.index}Location`).handle((v) => this.stationLatitude.set(v.lat));

    sub
      .on('trueRefActive')
      .whenChanged()
      .handle((v) => this.trueRefActive.set(!!v));

    this.identReceived.sub((v) => {
      if (v) {
        // the morse code is sent 3 times in a 30 second period, depending on when you pick up the signal you could be lucky or unlucky
        this.identTimer.schedule(() => this.identVisible.set(true), 5000 + Math.random() * 10000);
      } else {
        this.identTimer.clear();
        this.identVisible.set(false);
      }
    }, true);
  }

  render(): VNode | null {
    return (
      <g visibility={this.isVisible}>
        <path
          d={this.props.index === 1 ? this.VOR_1_NEEDLE : this.VOR_2_NEEDLE}
          stroke-width={2}
          class={this.stationCorrected.map((c) => (c ? 'Magenta' : 'White'))}
          stroke-linejoin="round"
          stroke-linecap="round"
        />

        <text x={this.x} y={692} font-size={24} class="White">
          {`VOR${this.props.index}`}
        </text>

        <text
          x={this.x + (this.props.index === 1 ? 61 : -54)}
          y={692}
          class="FontTiny Magenta"
          visibility={this.stationCorrected.map((c) => (c ? 'inherit' : 'hidden'))}
        >
          CORR
        </text>
        <text
          x={this.x + (this.props.index === 1 ? 73 : -54)}
          y={692}
          class="FontTiny Amber"
          visibility={this.magWarning.map((c) => (c ? 'inherit' : 'hidden'))}
        >
          MAG
        </text>
        <text
          x={this.x + (this.props.index === 1 ? 61 : -54)}
          y={692}
          class="FontTiny Amber"
          visibility={this.trueWarning.map((c) => (c ? 'inherit' : 'hidden'))}
        >
          TRUE
        </text>

        <text
          visibility={this.identVisible.map((v) => (v ? 'inherit' : 'hidden'))}
          x={this.x}
          y={722}
          font-size={24}
          class="White"
        >
          {this.identSub}
        </text>

        <text x={this.props.index === 2 ? this.x - 26 : this.x} y={722} font-size={24} class="White">
          <BigLittle visible={this.frequencyVisible} value={this.frequencySub} digits={2} class="White" />
        </text>

        <g transform={`translate(${this.props.index === 1 ? -16 : 0})`}>
          <text
            x={this.dmeDistanceSub.map((v) => (v > 20 ? this.x + 46 : this.x + 58))}
            y={759}
            font-size={24}
            text-anchor="end"
          >
            <tspan
              visibility={MappedSubject.create(
                ([visible, dashedDme]) => visible && dashedDme,
                this.props.visible,
                this.dashedDme,
              ).map((v) => (v ? 'inherit' : 'hidden'))}
              class="Green"
            >
              ---
            </tspan>
            <BigLittle
              visible={this.dashedDme.map((v) => !v)}
              value={this.dmeDistanceSub}
              digits={1}
              roundedThreshold={20}
              class="Green"
            />
          </text>

          <text x={this.x + 66} y={759} font-size={20} class="Cyan">
            NM
          </text>
        </g>

        <TuningModeIndicator bus={this.props.bus} index={this.props.index} />
      </g>
    );
  }
}

class AdfInfo extends DisplayComponent<{
  bus: EventBus;
  index: 1 | 2;
  visible: Subscribable<boolean>;
  mode: Subscribable<EfisNdMode>;
}> {
  private readonly x = this.props.index === 1 ? 37 : 668;

  private readonly path =
    this.props.index === 1
      ? 'M31,686 L25,680 L19,686 M25,680 L25,719'
      : 'M749,719 L749,696 L743,690 L737,696 L737,719 M743,690 L743,675';

  private readonly adfIdent = Subject.create('');

  private readonly adfFrequency = Subject.create(-1);

  private readonly adfAvailable = Subject.create(false);

  private readonly identVisibility = this.adfAvailable.map((it) => (it ? 'inherit' : 'hidden'));

  private readonly frequencyVisibility = MappedSubject.create(
    ([adfAvailable, adfFrequency]) => (!adfAvailable && adfFrequency > 0 ? 'inherit' : 'hidden'),
    this.adfAvailable,
    this.adfFrequency,
  );

  private readonly isVisible = MappedSubject.create(
    ([logicallyVisible, ndMode]) => (logicallyVisible && ndMode !== EfisNdMode.PLAN ? 'inherit' : 'hidden'),
    this.props.visible,
    this.props.mode,
  );

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    const subs = this.props.bus.getSubscriber<GenericVorEvents>();

    subs
      .on(`adf${this.props.index}Ident`)
      .whenChanged()
      .handle((value) => this.adfIdent.set(value));
    subs
      .on(`adf${this.props.index}ActiveFrequency`)
      .whenChanged()
      .handle((value) => this.adfFrequency.set(value));
    subs
      .on(`adf${this.props.index}SignalStrength`)
      .whenChangedBy(1)
      .handle((value) => this.adfAvailable.set(value > 0));
  }

  render(): VNode | null {
    return (
      <g visibility={this.isVisible}>
        <path d={this.path} strokw-width={2} class="Green" stroke-linejoin="round" stroke-linecap="round" />
        <text x={this.x} y={692} font-size={24} class="Green">
          {`ADF${this.props.index}`}
        </text>

        <text visibility={this.identVisibility} x={this.x} y={722} font-size={24} class="Green">
          {this.adfIdent}
        </text>

        <text visibility={this.frequencyVisibility} x={this.x} y={722} font-size={24} class="Green">
          {this.adfFrequency.map((it) => Math.floor(it).toFixed(0))}
        </text>

        <TuningModeIndicator bus={this.props.bus} index={this.props.index} adf />
      </g>
    );
  }
}

export interface BigLittleProps {
  visible: Subscribable<boolean>;
  value: Subscribable<number>;
  digits: number;
  roundedThreshold?: number;
  class: string;
}

export class BigLittle extends DisplayComponent<BigLittleProps> {
  private readonly intPartText = Subject.create('');

  private readonly decimalPartText = Subject.create('');

  private showDecimal = Subject.create(true);

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    this.props.value.sub((value) => {
      if (!this.props.visible.get()) {
        return;
      }

      if (this.props.roundedThreshold && value >= this.props.roundedThreshold) {
        this.intPartText.set(value.toFixed(0));
        this.decimalPartText.set('');
        this.showDecimal.set(false);
      } else {
        const [intPart, decimalPart] = value.toFixed(this.props.digits).split('.', 2);

        this.intPartText.set(intPart);
        this.decimalPartText.set(`.${decimalPart}`);
        this.showDecimal.set(true);
      }
    });

    this.props.visible.sub((visible) => {
      if (!visible) {
        this.intPartText.set('');
        this.decimalPartText.set('');
      }
    });
  }

  render(): VNode | null {
    return (
      <>
        <tspan visibility={this.props.visible.map((v) => (v ? 'inherit' : 'hidden'))} class={this.props.class}>
          {this.intPartText}
        </tspan>
        <tspan
          font-size={20}
          visibility={this.showDecimal.map((showDecimal) => (showDecimal ? 'inherit' : 'hidden'))}
          class={this.props.class}
        >
          {this.decimalPartText}
        </tspan>
      </>
    );
  }
}

interface TuningModeIndicatorProps {
  bus: EventBus;
  index: number;
  adf?: boolean;
}

class TuningModeIndicator extends DisplayComponent<TuningModeIndicatorProps> {
  private readonly fm1Healthy = Subject.create(false);

  private readonly fm2Healthy = Subject.create(false);

  private readonly fm1NavTuningWord = Arinc429RegisterSubject.createEmpty();

  private readonly fm2NavTuningWord = Arinc429RegisterSubject.createEmpty();

  private readonly tuningMode = MappedSubject.create(
    ([fm1Healthy, fm2Healthy, fm1NavTuningWord, fm2NavTuningWord]) => {
      const bitIndex = 10 + this.props.index + (this.props.adf ? 2 : 0);

      if (
        (!fm1Healthy && !fm2Healthy) ||
        (!fm1NavTuningWord.isNormalOperation() && !fm2NavTuningWord.isNormalOperation())
      ) {
        return 'R';
      }

      if (fm1NavTuningWord.bitValueOr(bitIndex, false) || fm2NavTuningWord.bitValueOr(bitIndex, false)) {
        return 'M';
      }

      return '';
    },
    this.fm1Healthy,
    this.fm2Healthy,
    this.fm1NavTuningWord,
    this.fm2NavTuningWord,
  );

  private readonly x = this.props.index === 1 ? 138 : 616;

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    const subs = this.props.bus.getSubscriber<GenericFlightManagementBusEvents>();

    subs
      .on('fm.1.healthy_discrete')
      .whenChanged()
      .handle((healthy) => this.fm1Healthy.set(healthy));

    subs
      .on('fm.2.healthy_discrete')
      .whenChanged()
      .handle((healthy) => this.fm2Healthy.set(healthy));

    subs
      .on('fm.1.tuning_discrete_word')
      .whenChanged()
      .handle((word) => this.fm1NavTuningWord.setWord(word));

    subs
      .on('fm.2.tuning_discrete_word')
      .whenChanged()
      .handle((word) => this.fm2NavTuningWord.setWord(word));
  }

  render(): VNode | null {
    return (
      <text x={this.x} y={720} font-size={20} text-decoration="underline" fill="#ffffff">
        {this.tuningMode}
      </text>
    );
  }
}
