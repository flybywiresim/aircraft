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
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';

import './style.scss';
import '../index.scss';
import { Arinc429LocalVarConsumerSubject, FmsData, NXDataStore, NXUnits } from '@flybywiresim/fbw-sdk';
import { SDSimvars } from './SDSimvarPublisher';
import { A380XFcuBusEvents } from '@shared/publishers/A380XFcuBusPublisher';
import { FqmsBusEvents } from '@shared/publishers/FqmsBusPublisher';

export interface PermanentDataProps {
  readonly bus: EventBus;
}

const getValuePrefix = (value: number) => (value >= 0 ? '+' : '');

const getCurrentHHMMSS = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secondsLeft = Math.floor(seconds - hours * 3600 - minutes * 60).toFixed(0);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;
};

export class PermanentData extends DisplayComponent<PermanentDataProps> {
  private readonly subscriptions: Subscription[] = [];

  private readonly sub = this.props.bus.getSubscriber<SDSimvars & ClockEvents & FqmsBusEvents & A380XFcuBusEvents>();

  private readonly sat = Arinc429LocalVarConsumerSubject.create(this.sub.on('sat'));

  private readonly tat = Arinc429LocalVarConsumerSubject.create(this.sub.on('tat'));

  private readonly zp = Arinc429LocalVarConsumerSubject.create(this.sub.on('altitude'));

  private readonly fcuLeftEisDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a380x_fcu_eis_discrete_word_2_left'),
  );
  private readonly fcuRightEisDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a380x_fcu_eis_discrete_word_2_right'),
  );

  private readonly tatClass = this.tat.map((tat) => `F25 EndAlign ${tat.isNormalOperation() ? 'Green' : 'Amber'}`);
  private readonly tatText = this.tat.map((tat) =>
    tat.isNormalOperation() ? getValuePrefix(tat.value) + tat.value.toFixed(0) : 'XX',
  );

  private readonly satClass = this.sat.map((sat) => `F25 EndAlign ${sat.isNormalOperation() ? 'Green' : 'Amber'}`);
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
    ([fcuLeft, fcuRight, zp, sat]) =>
      (fcuLeft.bitValueOr(28, false) || fcuRight.bitValueOr(28, false)) &&
      zp.isNormalOperation() &&
      sat.isNormalOperation()
        ? 'inherit'
        : 'hidden',
    this.fcuLeftEisDiscreteWord2,
    this.fcuRightEisDiscreteWord2,
    this.zp,
    this.sat,
  );

  private readonly normalAcc = Arinc429LocalVarConsumerSubject.create(this.sub.on('normalAccRaw'));

  private readonly gLoadStyle = this.normalAcc.map(
    (gLoad) => (gLoad.isNormalOperation() && (gLoad.value < 0.7 || gLoad.value > 1.4) ? 'inherit' : 'hidden'), // FIXME
  );

  private readonly gLoadText = this.normalAcc.map((gLoad) => getValuePrefix(gLoad.value) + gLoad.value.toFixed(1));

  private readonly zuluTime = ConsumerSubject.create(this.sub.on('zuluTime'), 0);

  private readonly timeHHMM = this.zuluTime.map((seconds) => getCurrentHHMMSS(seconds).substring(0, 6));
  private readonly timeSS = this.zuluTime.map((seconds) => getCurrentHHMMSS(seconds).substring(6));

  // This call to NXUnits ensures that metricWeightVal is set early on
  private readonly userWeight = Subject.create<'KG' | 'LBS'>(NXUnits.userWeightUnit());

  private readonly configMetricUnitsSub = NXDataStore.getAndSubscribeLegacy(
    'CONFIG_USING_METRIC_UNIT',
    (_, value) => {
      this.userWeight.set(value === '1' ? 'KG' : 'LBS');
    },
    '1',
  );

  private readonly fqmsFuelQuantity = Arinc429LocalVarConsumerSubject.create(this.sub.on('fqms_total_fuel_on_board'));
  private readonly fuelWeightText = MappedSubject.create(
    ([fq, _uw]) =>
      fq.isNormalOperation() ? (Math.round(NXUnits.kgToUser(fq.value) / 100) * 100).toFixed(0) : 'XX\xa0\xa0',
    this.fqmsFuelQuantity,
    this.userWeight,
  );
  private readonly fuelWeightClass = this.fqmsFuelQuantity.map((fq) =>
    fq.isNormalOperation() ? 'F27 Green EndAlign' : 'F27 Amber EndAlign',
  );

  private readonly fqmsGrossWeight = Arinc429LocalVarConsumerSubject.create(this.sub.on('fqms_gross_weight'));
  private readonly fqmsGrossWeightCg = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('fqms_center_of_gravity_mac'),
  );

  private readonly gwText = MappedSubject.create(
    ([gw, _uw]) =>
      gw.isNormalOperation()
        ? (Math.round(NXUnits.kgToUser(gw.value) / 100) * 100).toFixed(0)
        : gw.isNoComputedData()
          ? '--\xa0\xa0'
          : 'XX\xa0\xa0',
    this.fqmsGrossWeight,
    this.userWeight,
  );

  private readonly gwClass = this.fqmsGrossWeight.map((gw) =>
    gw.isNormalOperation() ? 'F27 Green EndAlign' : gw.isNoComputedData() ? 'F27 Cyan EndAlign' : 'F27 Amber EndAlign',
  );

  private readonly grossWeightCgText = MappedSubject.create(
    ([cg]) => (cg.isNormalOperation() ? cg.value.toFixed(1) : cg.isNoComputedData() ? '--\xa0\xa0' : 'XX\xa0\xa0'),
    this.fqmsGrossWeightCg,
  );

  private readonly gwCgClass = this.fqmsGrossWeightCg.map((cg) =>
    cg.isNormalOperation() ? 'F27 Green EndAlign' : cg.isNoComputedData() ? 'F27 Cyan EndAlign' : 'F27 Amber EndAlign',
  );

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.sat,
      this.tat,
      this.zp,
      this.fcuLeftEisDiscreteWord2,
      this.tatClass,
      this.tatText,
      this.satClass,
      this.satText,
      this.isa,
      this.isaText,
      this.isaVisibility,
      this.normalAcc,
      this.gLoadStyle,
      this.gLoadText,
      this.zuluTime,
      this.timeHHMM,
      this.timeSS,
      this.fqmsFuelQuantity,
      this.fqmsGrossWeight,
      this.fqmsGrossWeightCg,
      this.fuelWeightText,
      this.fuelWeightClass,
      this.gwText,
      this.gwClass,
      this.grossWeightCgText,
      this.gwCgClass,
    );
  }

  destroy(): void {
    this.configMetricUnitsSub();

    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode | null {
    return (
      <>
        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 768 1024"
          style="position: absolute; top: 0px; left: 0px;"
        >
          <path class="SW4 White StrokeRound" d="M 7,667 l 754,0" />
          <path class="SW4 White" d="M 0,765 l 768,0" />
          <path class="SW4 White StrokeRound" d="M 257,667 l 0,92" />
          <path class="SW4 White StrokeRound" d="M 512,667 l 0,92" />

          {/* <path class='ecam-thicc-line LineRound' d='m 518 690 v 90' /> */}

          {/* Temps */}
          <text x={34} y={696} class="F26 White LS1">
            TAT
          </text>
          <text x={158} y={696} class={this.tatClass}>
            {this.tatText}
          </text>
          <text x={185} y={696} class="F26 Cyan">
            &#176;C
          </text>

          <text x={34} y={725} class="F26 White LS1">
            SAT
          </text>
          <text x={158} y={725} class={this.satClass}>
            {this.satText}
          </text>
          <text x={185} y={725} class="F26 Cyan">
            &#176;C
          </text>

          <g visibility={this.isaVisibility}>
            <text x={34} y={754} class="F26 White LS1">
              ISA
            </text>
            <text x={158} y={754} class={'F25 Green EndAlign'}>
              {this.isaText}
            </text>
            <text x={185} y={754} class="F26 Cyan">
              &#176;C
            </text>
          </g>
        </svg>

        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 768 1024"
          style="position: absolute; top: 0px; left: 0px;"
        >
          {/* G Load Indication */}
          <g visibility={this.gLoadStyle}>
            <text x={296} y={702} class="F27 Amber">
              G LOAD
            </text>
            <text x={410} y={702} class="F27 Amber">
              {this.gLoadText}
            </text>
          </g>

          {/* Clock */}
          <text x={296} y={730} class="F29 Green LS-1">
            {this.timeHHMM}
          </text>
          <text x={394} y={730} class="F26 Green">
            {this.timeSS}
          </text>
          <text x={434} y={729} class="F22 Green">
            GPS
          </text>
        </svg>

        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 768 1024"
          style="position: absolute; top: 0px; left: 0px;"
        >
          {/* Weights / Fuel */}
          <text x={529} y={696} class="F25 White">
            GW
          </text>
          <text x={529} y={724} class="F25 White">
            GWCG
          </text>
          <text x={529} y={752} class="F25 White">
            FOB
          </text>

          <text x={705} y={696} class={this.gwClass}>
            {this.gwText}
          </text>
          <text x={705} y={724} class={this.gwCgClass}>
            {this.grossWeightCgText}
          </text>
          <text x={705} y={752} class={this.fuelWeightClass}>
            {this.fuelWeightText}
          </text>

          <text x={711} y={696} class="F22 Cyan">
            {this.userWeight}
          </text>
          <text x={711} y={724} class="F22 Cyan">
            %
          </text>
          <text x={711} y={752} class="F22 Cyan">
            {this.userWeight}
          </text>
        </svg>
      </>
    );
  }
}
