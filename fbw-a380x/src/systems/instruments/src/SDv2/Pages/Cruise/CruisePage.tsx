//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0
import { ConsumerSubject, FSComponent, MappedSubject, Subject, VNode } from '@microsoft/msfs-sdk';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';

import { fuelForDisplay } from '../../../Common/FuelFunctions';
import { PageTitle } from '../Generic/PageTitle';
import A380XCruise from './elements/A380Cruise';
import CruisePressure from './elements/CruisePressure';
import CruiseCond from './elements/CruiseCond';
import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { SDSimvars } from '../../SDSimvarPublisher';

import '../../../index.scss';
import { SdPageProps } from '../../SD';

export class CruisePage extends DestroyableComponent<SdPageProps> {
  private readonly sub = this.props.bus.getSubscriber<SDSimvars>();

  private readonly topSvgStyle = this.props.visible.map((v) => `visibility: ${v ? 'visible' : 'hidden'}`);

  private readonly usingMetric = Subject.create(true);
  private readonly weightUnit = this.usingMetric.map((v) => (v ? 'KG' : 'LB'));
  private readonly fuelFlowUnit = this.usingMetric.map((v) => (v ? 'KG/H' : 'LB/H'));

  private readonly metricUnitSubscription = NXDataStore.getAndSubscribeLegacy(
    'CONFIG_USING_METRIC_UNIT',
    (_k, v) => {
      this.usingMetric.set(v === '1');
    },
    '1',
  );

  private readonly enginesFuelUsed = [
    ConsumerSubject.create(this.sub.on('engineFuelUsed_1'), 0),
    ConsumerSubject.create(this.sub.on('engineFuelUsed_2'), 0),
    ConsumerSubject.create(this.sub.on('engineFuelUsed_3'), 0),
    ConsumerSubject.create(this.sub.on('engineFuelUsed_4'), 0),
  ];

  private readonly enginesFuelFlow = [
    ConsumerSubject.create(this.sub.on('engineFuelFlow_1'), 0),
    ConsumerSubject.create(this.sub.on('engineFuelFlow_2'), 0),
    ConsumerSubject.create(this.sub.on('engineFuelFlow_3'), 0),
    ConsumerSubject.create(this.sub.on('engineFuelFlow_4'), 0),
  ];

  private readonly enginesFuelUsedDisplay = this.enginesFuelUsed.map((fu) =>
    fu.map((v) => fuelForDisplay(v, this.usingMetric.get(), 1, 5).toFixed(0)),
  );
  private readonly engineTotalFuelUsedDisplay = MappedSubject.create(
    (fu) => parseInt(fu[0]) + parseInt(fu[1]) + parseInt(fu[2]) + parseInt(fu[3]),
    ...this.enginesFuelUsedDisplay,
  );

  private readonly enginesFuelFlowDisplay = this.enginesFuelFlow.map((fu) =>
    fu.map((v) => fuelForDisplay(v, this.usingMetric.get()).toFixed(0)),
  );

  // TODO Degraded accuracy indication for fuel flow and used

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.topSvgStyle,
      this.engineTotalFuelUsedDisplay,
      ...this.enginesFuelUsed,
      ...this.enginesFuelFlow,
      ...this.enginesFuelUsedDisplay,
      ...this.enginesFuelFlowDisplay,
    );
  }

  destroy(): void {
    this.metricUnitSubscription();

    super.destroy();
  }

  render() {
    return (
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 768 1024"
        style={this.topSvgStyle}
      >
        <PageTitle x={6} y={29}>
          CRUISE
        </PageTitle>
        <A380XCruise />

        {/* Fuel Flow */}
        <text class="F29 Underline White" x={15} y={80} style="text-decoration: underline;">
          FUEL
        </text>
        <path class="White SW3" d="M130,117 l 27,0" />
        <path class="White SW3" d="M285,117 l 27,0" />
        <path class="White SW3" d="M451,117 l 27,0" />
        <path class="White SW3" d="M601,117 l 27,0" />

        <text class="F29 LS1 EndAlign Green" x={112} y={127}>
          {this.enginesFuelFlowDisplay[0]}
        </text>
        <text class="F29 LS1 EndAlign Green" x={263} y={127}>
          {this.enginesFuelFlowDisplay[1]}
        </text>
        <text class="F29 LS1 EndAlign Green" x={578} y={127}>
          {this.enginesFuelFlowDisplay[2]}
        </text>
        <text class="F29 LS1 EndAlign Green" x={730} y={127}>
          {this.enginesFuelFlowDisplay[3]}
        </text>

        <text class="F26 MiddleAlign White" x={383} y={99}>
          FF
        </text>
        <text class="F22 MiddleAlign Cyan" x={383} y={131}>
          {this.fuelFlowUnit}
        </text>

        {/* Fuel Used */}
        <path class="White SW3" d="M134,217 l 27,0" />
        <path class="White SW3" d="M285,217 l 27,0" />
        <path class="White SW3" d="M451,217 l 27,0" />
        <path class="White SW3" d="M601,217 l 27,0" />

        <text class="F29 LS1 EndAlign Green" x={122} y={227}>
          {this.enginesFuelUsedDisplay[0]}
        </text>
        <text class="F29 LS1 EndAlign Green" x={273} y={227}>
          {this.enginesFuelUsedDisplay[1]}
        </text>
        <text class="F29 LS1 EndAlign Green" x={588} y={227}>
          {this.enginesFuelUsedDisplay[2]}
        </text>
        <text class="F29 LS1 EndAlign Green" x={740} y={227}>
          {this.enginesFuelUsedDisplay[3]}
        </text>

        <text class="F26 MiddleAlign White" x={383} y={199}>
          FU
        </text>
        <text class="F26 MiddleAlign White" x={383} y={228}>
          TOTAL
        </text>
        <text class="F29 LS1 EndAlign Green" x={428} y={265}>
          {this.engineTotalFuelUsedDisplay}
        </text>
        <text class="F22 MiddleAlign Cyan" x={383} y={285}>
          {this.weightUnit}
        </text>

        <text class="F29 Underline White" x={18} y={330} style="text-decoration: underline;">
          AIR
        </text>

        <CruisePressure bus={this.props.bus} />
        <CruiseCond bus={this.props.bus} />
      </svg>
    );
  }
}
