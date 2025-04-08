//  Copyright (c) 2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  ClockEvents,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  UnitType,
  VNode,
} from '@microsoft/msfs-sdk';

import './style.scss';
import { Arinc429LocalVarConsumerSubject, NXDataStore, NXUnits } from '@flybywiresim/fbw-sdk';
import { SDSimvars } from './SDSimvarPublisher';
import { SimplaneValues } from 'instruments/src/MsfsAvionicsCommon/providers/SimplaneValueProvider';

export interface StatusAreaProps {
  readonly bus: EventBus;
}

const getValuePrefix = (value: number) => (value >= 0 ? '+' : '');

const getCurrentHHMMSS = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secondsLeft = (seconds - hours * 3600 - minutes * 60).toFixed(0);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;
};

export class StatusArea extends DisplayComponent<StatusAreaProps> {
  private readonly topRef = FSComponent.createRef<HTMLDivElement>();

  private readonly sub = this.props.bus.getSubscriber<SDSimvars & SimplaneValues & ClockEvents>();

  private readonly sat = Arinc429LocalVarConsumerSubject.create(this.sub.on('sat'));

  private readonly tat = Arinc429LocalVarConsumerSubject.create(this.sub.on('tat'));

  private readonly zp = Arinc429LocalVarConsumerSubject.create(this.sub.on('altitude'));

  private readonly baroMode = ConsumerSubject.create(this.sub.on('baroMode'), 'STD');

  private readonly tatClass = this.tat.map((tat) => `F25 ${tat.isNormalOperation() ? 'Green' : 'Amber'} EndAlign`);
  private readonly tatText = this.tat.map((tat) =>
    tat.isNormalOperation() ? getValuePrefix(tat.value) + tat.value.toFixed(0) : 'XX',
  );

  private readonly satClass = this.sat.map((sat) => `F25 ${sat.isNormalOperation() ? 'Green' : 'Amber'} EndAlign`);
  private readonly satText = this.sat.map((sat) =>
    sat.isNormalOperation() ? getValuePrefix(sat.value) + sat.value.toFixed(0) : 'XX',
  );

  private readonly isa = MappedSubject.create(
    ([sat, zp]) => sat.valueOr(0) + Math.min(36089, zp.valueOr(0)) / 500 - 15,
    this.sat,
    this.zp,
  );

  private readonly isaText = this.isa.map((isa) => getValuePrefix(isa) + isa.toFixed(0));

  private readonly isaVisibility = MappedSubject.create(
    ([baroMode, zp, sat]) =>
      baroMode === 'STD' && zp.isNormalOperation() && sat.isNormalOperation() ? 'visible' : 'hidden',
    this.baroMode,
    this.zp,
    this.sat,
  );

  private readonly normalAcc = Arinc429LocalVarConsumerSubject.create(this.sub.on('normalAccRaw'));

  private readonly gLoadVisibility = this.normalAcc.map((gLoad) =>
    gLoad.isNormalOperation() && (gLoad.value < 0.7 || gLoad.value > 1.4) ? 'visible' : 'hidden',
  );

  private readonly gLoadText = this.normalAcc.map((gLoad) => getValuePrefix(gLoad.value) + gLoad.value.toFixed(1));

  private readonly zuluTime = ConsumerSubject.create(this.sub.on('zuluTime'), 0);

  private readonly timeHHMM = this.zuluTime.map((seconds) => getCurrentHHMMSS(seconds).substring(0, 6));
  private readonly timeSS = this.zuluTime.map((seconds) => getCurrentHHMMSS(seconds).substring(6));

  private readonly userWeight = Subject.create<'KG' | 'LBS'>('KG');

  private readonly configMetricUnitsSub = NXDataStore.getAndSubscribe(
    'CONFIG_USING_METRIC_UNIT',
    (_, value) => {
      this.userWeight.set(value === '1' ? 'KG' : 'LBS');
    },
    '1',
  );

  private readonly fmGrossWeight = ConsumerSubject.create(this.sub.on('fmGrossWeight'), 0);
  private readonly gwText = this.fmGrossWeight.map((gw) =>
    gw === 0 ? '--' : (Math.round(NXUnits.kgToUser(gw) / 100) * 100).toFixed(0),
  );
  private readonly gwClass = this.fmGrossWeight.map((gw) => (gw === 0 ? 'F27 Cyan EndAlign' : 'F27 Green EndAlign'));

  private readonly grossWeightCg = ConsumerSubject.create(this.sub.on('grossWeightCg'), 0);
  private readonly grossWeightCgText = MappedSubject.create(
    (cg, gw) => (gw === 0 ? '--' : (Math.round(NXUnits.kgToUser(cg) * 10) / 10).toFixed(1)),
    this.grossWeightCg,
    this.fmGrossWeight,
    this.userWeight,
  );

  private readonly fuelQuantity = ConsumerSubject.create(this.sub.on('fuelTotalQuantity'), 0);
  private readonly fuelWeightPerGallonInLb = ConsumerSubject.create(this.sub.on('fuelWeightPerGallon'), 0);
  private readonly fuelWeight = MappedSubject.create(
    ([qt, weightPerGallonInLb]) =>
      NXUnits.kgToUser(UnitType.POUND.convertTo(qt * weightPerGallonInLb, UnitType.KILOGRAM)),
    this.fuelQuantity,
    this.fuelWeightPerGallonInLb,
    this.userWeight,
  );
  private readonly fuelWeightText = this.fuelWeight.map((fw) =>
    (Math.round(NXUnits.kgToUser(fw) / 100) * 100).toFixed(0),
  );

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  destroy(): void {
    this.configMetricUnitsSub();

    super.destroy();
  }

  render(): VNode | null {
    return (
      <div ref={this.topRef} class="sd-perm-info-area-layout">
        <svg width="768px" height="103px" version="1.1" viewBox="0 0 768 103" xmlns="http://www.w3.org/2000/svg">
          {/* Frame */}
          <path class="SW4 White StrokeRound" d="M 7,2 l 754,0" />
          <path class="SW4 White" d="M 0,100 l 768,0" />
          <path class="SW4 White StrokeRound" d="M 257,1 l 0,100" />
          <path class="SW4 White StrokeRound" d="M 512,1 l 0,100" />

          {/* Temps */}
          <text x={34} y={30} class="F26 White LS1">
            TAT
          </text>
          <text x={158} y={30} class={this.tatClass}>
            {this.tatText}
          </text>
          <text x={185} y={30} class="F26 Cyan">
            &#176;C
          </text>

          <text x={34} y={58} class="F26 White LS1">
            SAT
          </text>
          <text x={158} y={58} class={this.satClass}>
            {this.satText}
          </text>
          <text x={185} y={58} class="F26 Cyan">
            &#176;C
          </text>

          <g visibility={this.isaVisibility}>
            <text x={34} y={68} class="F26 White LS1">
              ISA
            </text>
            <text x={158} y={68} class={'F25 Green EndAlign'}>
              {this.isaText}
            </text>
            <text x={185} y={68} class="F26 Cyan">
              &#176;C
            </text>
          </g>

          {/* G Load Indication */}
          <g visibility={this.gLoadVisibility}>
            <text x={296} y={36} class="F27 Amber">
              G LOAD
            </text>
            <text x={410} y={36} class="F27 Amber">
              {this.gLoadText}
            </text>
          </g>

          {/* Clock */}
          <text x={296} y={64} class="F29 Green LS-1">
            {this.timeHHMM}
          </text>
          <text x={394} y={64} class="F26 Green">
            {this.timeSS}
          </text>
          <text x={434} y={63} class="F22 Green">
            GPS
          </text>

          {/* Weights / Fuel */}
          <text x={529} y={30} class="F25 White">
            GW
          </text>
          <text x={529} y={58} class="F25 White">
            GWCG
          </text>
          <text x={529} y={86} class="F25 White">
            FOB
          </text>

          <text x={705} y={30} class={this.gwClass}>
            {this.gwText}
          </text>
          <text x={705} y={58} class={this.gwClass}>
            {this.grossWeightCgText}
          </text>
          <text x={705} y={86} class="F27 Green EndAlign">
            {this.fuelWeightText}
          </text>

          <text x={711} y={30} class="F22 Cyan">
            {this.userWeight}
          </text>
          <text x={711} y={58} class="F22 Cyan">
            %
          </text>
          <text x={711} y={86} class="F22 Cyan">
            {this.userWeight}
          </text>
        </svg>
      </div>
    );
  }
}
