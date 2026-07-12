//  Copyright (c) 2026 FlyByWire Simulations
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

import { Arinc429LocalVarConsumerSubject, NXDataStore, NXLogicConfirmNode, NXUnits } from '@flybywiresim/fbw-sdk';
import { SDSimvars } from './SDSimvarPublisher';
import { A32NXFcuBusEvents } from '@shared/publishers/A32NXFcuBusPublisher';
import { A32NXAdrBusEvents } from '@shared/publishers/A32NXAdrBusPublisher';

export interface PermanentDataProps {
  readonly bus: EventBus;
}

const getValuePrefix = (value: number) => (value >= 0 ? '+' : '');

export class PermanentData extends DisplayComponent<PermanentDataProps> {
  private readonly subscriptions: Subscription[] = [];

  private readonly sub = this.props.bus.getSubscriber<
    SDSimvars & ClockEvents & A32NXFcuBusEvents & A32NXAdrBusEvents
  >();

  private readonly sat = Arinc429LocalVarConsumerSubject.create(this.sub.on('a32nx_adr_static_air_temperature_1'));

  private readonly tat = Arinc429LocalVarConsumerSubject.create(this.sub.on('a32nx_adr_total_air_temperature_1'));

  private readonly zp = Arinc429LocalVarConsumerSubject.create(this.sub.on('a32nx_adr_altitude_1'));

  private readonly fcuLeftEisDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_fcu_eis_discrete_word_2_left'),
  );
  private readonly fcuRightEisDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_fcu_eis_discrete_word_2_right'),
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

  private prevSimTime = 0;

  private readonly normalAcc = Arinc429LocalVarConsumerSubject.create(this.sub.on('ir1NormalAcc'));

  private readonly fwcFlightPhase = ConsumerSubject.create(this.sub.on('fwcFlightPhase'), 0);

  private readonly gLoadConfirm = new NXLogicConfirmNode(2, true);

  private readonly gLoadConfirm2 = new NXLogicConfirmNode(5, false);

  private readonly gLoadExcessive = Subject.create(false);

  private readonly gLoadLabelStyle = this.gLoadExcessive.map((gLoadExcessive) =>
    gLoadExcessive ? 'inherit' : 'hidden',
  );

  private readonly gLoadTextStyle = MappedSubject.create(
    ([normalAcc, gLoadExcessive]) =>
      !(normalAcc.isFailureWarning() || normalAcc.isNoComputedData()) && gLoadExcessive ? 'inherit' : 'hidden',
    this.normalAcc,
    this.gLoadExcessive,
  );

  private readonly gLoadText = this.normalAcc.map((gLoad) => getValuePrefix(gLoad.value) + gLoad.value.toFixed(1));

  private readonly zuluTime = ConsumerSubject.create(this.sub.on('zuluTime'), 0);

  private readonly timeHH = this.zuluTime.map((zulu) => String(Math.floor(Math.floor(zulu) / 3600)).padStart(2, '0'));

  private readonly timeMM = this.zuluTime.map((zulu) => {
    const seconds = Math.floor(zulu);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds - hours * 3600) / 60);
    return String(minutes).padStart(2, '0');
  });

  // This call to NXUnits ensures that metricWeightVal is set early on
  private readonly userWeight = NXDataStore.getSetting('CONFIG_USING_METRIC_UNIT').map((v) => (v ? 'KG' : 'LBS'));

  private readonly fmsGrossWeight = ConsumerSubject.create(this.sub.on('grossWeight'), 0);

  private readonly eng1Running = ConsumerSubject.create(this.sub.on('eng1Running'), false);

  private readonly eng2Running = ConsumerSubject.create(this.sub.on('eng2Running'), false);

  // TODO Should simply come with the FMS data word SSM
  private gwVisible = MappedSubject.create(
    ([gw, eng1Running, eng2Running]) => gw !== 0 && (eng1Running || eng2Running),
    this.fmsGrossWeight,
    this.eng1Running,
    this.eng2Running,
  );

  private readonly gwText = MappedSubject.create(
    ([gw, _uw, gwVisible]) => (gwVisible ? (Math.round(NXUnits.kgToUser(gw * 10)) * 100).toFixed(0) : '--\xa0\xa0'),
    this.fmsGrossWeight,
    this.userWeight,
    this.gwVisible,
  );

  private readonly gwClass = this.gwVisible.map((visible) => (visible ? 'F27 Green EndAlign' : 'F27 Cyan EndAlign'));

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.sub.on('simTime').handle((simTime) => {
        const dt = Math.max(simTime - this.prevSimTime, 1);

        this.gLoadExcessive.set(
          this.gLoadConfirm2.write(
            this.gLoadConfirm.write(
              !(this.normalAcc.get().isFailureWarning() || this.normalAcc.get().isNoComputedData()) &&
                (this.normalAcc.get().value > 1.4 || this.normalAcc.get().value < 0.7) &&
                this.fwcFlightPhase.get() >= 4 &&
                this.fwcFlightPhase.get() <= 8,
              dt,
            ),
            dt,
          ),
        );

        this.prevSimTime = simTime;
      }),
    );

    this.subscriptions.push(
      this.userWeight,
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
      this.fwcFlightPhase,
      this.gLoadLabelStyle,
      this.gLoadTextStyle,
      this.gLoadText,
      this.zuluTime,
      this.timeHH,
      this.timeMM,
      this.fmsGrossWeight,
      this.gwText,
      this.gwClass,
    );
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode | null {
    return (
      <div>
        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 768 768"
          style="position: absolute; top: 0px; left: 0px;"
        >
          <path class="SW4 Grey LineRound" d="M 3,667 l 761,0" />
          <path class="SW4 Grey LineRound" d="M 257,667 l 0,96" />
          <path class="SW4 Grey LineRound" d="M 509,667 l 0,96" />

          {/* Temps */}
          <text x={37} y={698} class="F25 White LS1">
            TAT
          </text>
          <text x={158} y={698} class={this.tatClass}>
            {this.tatText}
          </text>
          <text x={188} y={698} class="F23 Cyan">
            &#176;C
          </text>

          <text x={37} y={728} class="F25 White LS1">
            SAT
          </text>
          <text x={158} y={728} class={this.satClass}>
            {this.satText}
          </text>
          <text x={188} y={728} class="F23 Cyan">
            &#176;C
          </text>

          <g visibility={this.isaVisibility}>
            <text x={37} y={758} class="F25 White LS1">
              ISA
            </text>
            <text x={158} y={758} class={'F25 Green EndAlign'}>
              {this.isaText}
            </text>
            <text x={188} y={758} class="F23 Cyan">
              &#176;C
            </text>
          </g>
        </svg>

        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 768 768"
          style="position: absolute; top: 0px; left: 0px;"
        >
          {/* G Load Indication */}
          <g>
            <text x={296} y={702} class="F27 Amber" visibility={this.gLoadLabelStyle}>
              G LOAD
            </text>
            <text x={410} y={702} class="F27 Amber" visibility={this.gLoadTextStyle}>
              {this.gLoadText}
            </text>
          </g>

          {/* Clock */}
          <text x={327} y={729} class="F29 Green">
            {this.timeHH}
          </text>

          <text x={378} y={728} class="F22 Cyan">
            H
          </text>

          <text x={409} y={729} class="F26 Green">
            {this.timeMM}
          </text>
        </svg>

        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 768 768"
          style="position: absolute; top: 0px; left: 0px;"
        >
          {/* Weights / Fuel */}
          <text x={533} y={697} class="F25 White">
            GW
          </text>

          <text x={698} y={696} class={this.gwClass}>
            {this.gwText}
          </text>

          <text x={706} y={697} class="F22 Cyan">
            {this.userWeight}
          </text>
        </svg>
      </div>
    );
  }
}
