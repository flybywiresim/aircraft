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
import { Arinc429LocalVarConsumerSubject, NXDataStore, NXUnits } from '@flybywiresim/fbw-sdk';
import { SDSimvars } from './SDSimvarPublisher';
import { SimplaneValues } from 'instruments/src/MsfsAvionicsCommon/providers/SimplaneValueProvider';

export interface PermanentDataProps {
  readonly bus: EventBus;
}

const getValuePrefix = (value: number) => (value >= 0 ? '+' : '');

const getCurrentHHMMSS = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secondsLeft = (seconds - hours * 3600 - minutes * 60).toFixed(0);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;
};

export class PermanentData extends DisplayComponent<PermanentDataProps> {
  private readonly subscriptions: Subscription[] = [];

  private readonly sub = this.props.bus.getSubscriber<SDSimvars & SimplaneValues & ClockEvents>();

  private readonly sat = Arinc429LocalVarConsumerSubject.create(this.sub.on('sat'));

  private readonly tat = Arinc429LocalVarConsumerSubject.create(this.sub.on('tat'));

  private readonly zp = Arinc429LocalVarConsumerSubject.create(this.sub.on('altitude'));

  private readonly baroMode = ConsumerSubject.create(this.sub.on('baroMode'), 'STD');

  private readonly tatClass = this.tat.map(
    (tat) => `sd-perm-info-area-sub3cell ${tat.isNormalOperation() ? 'Green' : 'Amber'}`,
  );
  private readonly tatText = this.tat.map((tat) =>
    tat.isNormalOperation() ? getValuePrefix(tat.value) + tat.value.toFixed(0) : 'XX',
  );

  private readonly satClass = this.sat.map(
    (sat) => `sd-perm-info-area-sub3cell ${sat.isNormalOperation() ? 'Green' : 'Amber'}`,
  );
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
      `visibility: ${baroMode === 'STD' && zp.isNormalOperation() && sat.isNormalOperation() ? 'inherit' : 'hidden'}`,
    this.baroMode,
    this.zp,
    this.sat,
  );

  private readonly normalAcc = Arinc429LocalVarConsumerSubject.create(this.sub.on('normalAccRaw'));

  private readonly gLoadStyle = this.normalAcc.map(
    (gLoad) =>
      `visibility: ${gLoad.isNormalOperation() && (gLoad.value < 0.7 || gLoad.value > 1.4) ? 'inherit' : 'hidden'}`, // FIXME
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

  private readonly fm1ZeroFuelWeight = Arinc429LocalVarConsumerSubject.create(this.sub.on('fmZeroFuelWeight_1'));
  private readonly fm2ZeroFuelWeight = Arinc429LocalVarConsumerSubject.create(this.sub.on('fmZeroFuelWeight_2'));

  private readonly fuelQuantity = ConsumerSubject.create(this.sub.on('fuelTotalQuantity'), 0);
  private readonly fuelWeightPerGallon = ConsumerSubject.create(this.sub.on('fuelWeightPerGallon'), 0);
  private readonly fuelWeight = MappedSubject.create(
    ([qt, weightPerGallon]) => NXUnits.kgToUser(qt * weightPerGallon),
    this.fuelQuantity,
    this.fuelWeightPerGallon,
    this.userWeight,
  );
  private readonly fuelWeightText = this.fuelWeight.map((fw) =>
    (Math.round(NXUnits.kgToUser(fw) / 100) * 100).toFixed(0),
  );

  // FIXME replace with FQMS implementation
  private readonly grossWeight = MappedSubject.create(
    ([fm1Zfw, fm2Zfw, fuelWeight]) =>
      !fm1Zfw.isNormalOperation() && !fm2Zfw.isNormalOperation()
        ? null
        : (fm1Zfw.isNormalOperation() ? fm1Zfw.value : fm2Zfw.value) + fuelWeight,
    this.fm1ZeroFuelWeight,
    this.fm2ZeroFuelWeight,
    this.fuelWeight,
  );

  private readonly gwText = this.grossWeight.map((gw) =>
    gw === 0 || gw === null ? '--\xA0' : (Math.round(NXUnits.kgToUser(gw) / 100) * 100).toFixed(0),
  );
  private readonly gwClass = this.grossWeight.map((gw) =>
    gw === 0 || gw === null
      ? 'sd-perm-info-area-sub3cell F27 Cyan EndAlign'
      : 'sd-perm-info-area-sub3cell F27 Green EndAlign',
  );

  private readonly grossWeightCg = ConsumerSubject.create(this.sub.on('grossWeightCg'), 0);
  private readonly grossWeightCgText = MappedSubject.create(
    ([cg, gw]) => (gw === 0 ? '--\xA0' : (Math.round(cg * 10) / 10).toFixed(1)),
    this.grossWeightCg,
    this.grossWeight,
  );

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.sat,
      this.tat,
      this.zp,
      this.baroMode,
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
      this.fm1ZeroFuelWeight,
      this.fm2ZeroFuelWeight,
      this.fuelQuantity,
      this.fuelWeightPerGallon,
      this.fuelWeight,
      this.fuelWeightText,
      this.grossWeight,
      this.gwText,
      this.gwClass,
      this.grossWeightCg,
      this.grossWeightCgText,
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
      <div class="sd-perm-info-area-layout">
        <div class="sd-perm-info-area-col BR">
          <div class="sd-perm-info-area-cell">
            <div class="sd-perm-info-area-sub3cell White">TAT</div>
            <div class={this.tatClass}>{this.tatText}</div>
            <div class="sd-perm-info-area-sub3cell F26 Cyan">&#176;C</div>
          </div>

          <div class="sd-perm-info-area-cell">
            <div class="sd-perm-info-area-sub3cell White">SAT</div>
            <div class={this.satClass}>{this.satText}</div>
            <div class="sd-perm-info-area-sub3cell F26 Cyan">&#176;C</div>
          </div>

          <div class="sd-perm-info-area-cell" style={this.isaVisibility}>
            <div class="sd-perm-info-area-sub3cell White">ISA</div>
            <div class="sd-perm-info-area-sub3cell F25 Green">{this.isaText}</div>
            <div class="sd-perm-info-area-sub3cell F26 Cyan">&#176;C</div>
          </div>
        </div>

        <div class="sd-perm-info-area-col BR">
          <div class="sd-perm-info-area-cell" style={this.gLoadStyle}>
            <span class="sd-perm-info-area-sub3cell F27 Amber" style="padding-right: 20px; flex: none;">
              G LOAD
            </span>
            <span class="sd-perm-info-area-sub3cell F27 Amber" style="flex: none;">
              {this.gLoadText}
            </span>
          </div>

          <div class="sd-perm-info-area-cell">
            <span class="F29 Green">{this.timeHHMM}</span>
            <span class="F26 Green" style="padding-right: 10px;">
              {this.timeSS}
            </span>
            <span class="F22 Green">GPS</span>
          </div>

          <div class="sd-perm-info-area-cell">{'\xA0'}</div>
        </div>

        <div class="sd-perm-info-area-col">
          <div class="sd-perm-info-area-weightcol">
            <div class="sd-perm-info-area-sub3cell White StartAlign">GW</div>
            <div class={this.gwClass}>{this.gwText}</div>
            <div class="sd-perm-info-area-sub3cell F22 Cyan">{this.userWeight}</div>

            <div class="sd-perm-info-area-sub3cell White StartAlign">GWCG</div>
            <div class={this.gwClass}>{this.grossWeightCgText}</div>
            <div class="sd-perm-info-area-sub3cell F22 Cyan">%</div>

            <div class="sd-perm-info-area-sub3cell White StartAlign">FOB</div>
            <div class="sd-perm-info-area-sub3cell F27 Green EndAlign">{this.fuelWeightText}</div>
            <div class="sd-perm-info-area-sub3cell F22 Cyan">{this.userWeight}</div>
          </div>
        </div>
      </div>
    );
  }
}
