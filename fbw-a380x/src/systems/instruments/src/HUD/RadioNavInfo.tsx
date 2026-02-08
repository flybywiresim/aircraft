// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  FSComponent,
  ComponentProps,
  DisplayComponent,
  EventBus,
  Subject,
  VNode,
  MappedSubject,
  ConsumerSubject,
} from '@microsoft/msfs-sdk';
import { Arinc429RegisterSubject, NavAidMode } from '@flybywiresim/fbw-sdk';

import { GenericVorEvents } from '../../../../../../fbw-common/src/systems/instruments/src/ND/types/GenericVorEvents';
import { GenericFlightManagementBusEvents } from '../../../../../../fbw-common/src/systems/instruments/src/ND/types/GenericFlightManagementBusEvents';
import { Layer } from '../../../../../../fbw-common/src/systems/instruments/src/MsfsAvionicsCommon/Layer';
import { GenericFcuEvents } from '../../../../../../fbw-common/src/systems/instruments/src/ND/types/GenericFcuEvents';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { FmgcFlightPhase } from '@shared/flightphase';
import { VerticalMode } from '@shared/autopilot';
import { HudElems, HudMode } from './HUDUtils';

export class RadioNavInfo extends DisplayComponent<{ bus: EventBus; index: 1 | 2 }> {
  private readonly sub = this.props.bus.getSubscriber<GenericFcuEvents & HUDSimvars & HudElems>();
  private readonly isVor = Subject.create(true);

  private readonly isAdf = Subject.create(true);
  private readonly activeVerticalModeSub = ConsumerSubject.create(this.sub.on('activeVerticalMode'), 0);
  private readonly fmgcFlightPhase = ConsumerSubject.create(this.sub.on('fmgcFlightPhase'), 0);
  private readonly hudMode = ConsumerSubject.create(this.sub.on('hudFlightPhaseMode'), 0);
  private readonly isVisible = MappedSubject.create(
    ([activeVerticalModeSub, fmgcFlightPhase, hudMode]) => {
      if (hudMode === HudMode.NORMAL) {
        return fmgcFlightPhase === FmgcFlightPhase.Approach &&
          (activeVerticalModeSub === VerticalMode.NONE || activeVerticalModeSub === VerticalMode.FPA)
          ? 'block'
          : 'none';
      } else {
        return 'none';
      }
    },
    this.activeVerticalModeSub,
    this.fmgcFlightPhase,
    this.hudMode,
  );
  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    this.sub
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
        <g display={this.isVisible}>
          <VorDmeInfo bus={this.props.bus} index={1} visible={this.isVor} />
          {/* no ADF inplemented yet */}
          {/* <AdfInfo bus={this.props.bus} index={1} visible={this.isAdf} /> */}
        </g>
      </>
    );
  }
}

export interface VorInfoIndicatorProps extends ComponentProps {
  bus: EventBus;
  index: 1 | 2;
  visible: Subject<boolean>;
}

export class VorDmeInfo extends DisplayComponent<VorInfoIndicatorProps> {
  private readonly adf = Subject.create(false);

  private readonly vorIdent = Subject.create('');

  private readonly vorFrequency = Subject.create(-1);

  private readonly vorCourse = Subject.create(-1);

  private readonly fm1Healthy = Subject.create(false);

  private readonly fm2Healthy = Subject.create(false);

  private readonly fm1NavTuningWord = Arinc429RegisterSubject.createEmpty();

  private readonly fm2NavTuningWord = Arinc429RegisterSubject.createEmpty();

  private showDecimal = Subject.create(true);
  private readonly intPartText = Subject.create('');
  private readonly roundedThreshold = 20;
  private readonly decimalPartText = Subject.create('');
  private readonly isVor = Subject.create(true);
  private readonly isAdf = Subject.create(true);
  private readonly xPos = this.props.index === 1 ? 240 : 910;
  private readonly dmeDistanceSub = Subject.create(0);

  private readonly hasDmeSub = Subject.create(false);
  private readonly dashedDme = MappedSubject.create(
    ([hasDme, dmeDistance]) => !hasDme || dmeDistance <= 0,
    this.hasDmeSub,
    this.dmeDistanceSub,
  );
  private readonly isVisible = MappedSubject.create(
    ([isVor, isAdf, dashedDme]) => {
      return (isVor || isAdf) && dashedDme ? 'inherit' : 'hidden';
    },
    this.isVor,
    this.isAdf,
    this.dashedDme,
  );

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    const subs = this.props.bus.getSubscriber<GenericVorEvents & GenericFlightManagementBusEvents & GenericFcuEvents>();

    subs
      .on(`nav${this.props.index}Ident`)
      .whenChanged()
      .handle((value) => {
        this.vorIdent.set(value);
      });

    subs
      .on(`nav${this.props.index}HasDme`)
      .whenChanged()
      .handle((v) => this.hasDmeSub.set(!!v));
    subs
      .on(`nav${this.props.index}DmeDistance`)
      .whenChanged()
      .handle((v) => {
        this.dmeDistanceSub.set(v);
        this.setDmeText();
      });

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

    subs
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

  private setDmeText() {
    this.dmeDistanceSub.sub((value) => {
      if (this.dashedDme.get()) {
        this.intPartText.set('');
        this.decimalPartText.set('');
        return;
      }

      if (this.roundedThreshold && this.dmeDistanceSub.get() >= this.roundedThreshold) {
        this.intPartText.set(this.dmeDistanceSub.get().toFixed(0));
        this.decimalPartText.set('');
        this.showDecimal.set(false);
      } else {
        const [intPart, decimalPart] = value.toFixed(1).split('.', 2);

        this.intPartText.set(intPart);
        this.decimalPartText.set(`.${decimalPart}`);
        this.showDecimal.set(true);
      }
    });
  }

  render(): VNode | null {
    return (
      <g>
        <Layer x={this.xPos} y={820}>
          <text x={0} y={0} class="FontSmallest Green" text-anchor="start">
            VOR
            {this.props.index.toString()}
          </text>

          <text x={0} y={25} class="FontSmallest Green" text-anchor="start">
            {this.vorIdent}
          </text>

          {/* dme */}

          <text x={this.dmeDistanceSub.map((v) => (v > 20 ? 22 : 34))} y={50} text-anchor="end">
            <tspan visibility={this.isVisible} class="FontSmallest Green">
              ---
            </tspan>
            <tspan visibility={this.dashedDme.map((v) => (!v ? 'inherit' : 'hidden'))} class="FontTiny Green">
              {this.intPartText}
            </tspan>
            <tspan
              visibility={this.showDecimal.map((showDecimal) => (showDecimal ? 'inherit' : 'hidden'))}
              class="FontTinyer Green"
            >
              {this.decimalPartText}
            </tspan>
          </text>

          <text x={50} y={50} class="FontTiny Green">
            NM
          </text>
        </Layer>
      </g>
    );
  }
}
