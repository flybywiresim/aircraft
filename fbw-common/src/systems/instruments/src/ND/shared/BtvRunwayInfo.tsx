// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  FSComponent,
  DisplayComponent,
  VNode,
  MappedSubject,
  ConsumerSubject,
  Subscribable,
  Unit,
  UnitFamily,
  UnitType,
} from '@microsoft/msfs-sdk';

import { Arinc429LocalVarConsumerSubject, ArincEventBus, BtvData, FmsOansData, FmsData } from '@flybywiresim/fbw-sdk';
import { Layer } from '../../MsfsAvionicsCommon/Layer';

export class BtvRunwayInfo extends DisplayComponent<{
  bus: ArincEventBus;
  lengthUnit: Subscribable<Unit<UnitFamily.Distance>>;
}> {
  private readonly sub = this.props.bus.getArincSubscriber<FmsOansData & FmsData & BtvData>();

  private readonly fmsRwyIdent = ConsumerSubject.create(this.sub.on('fmsLandingRunway'), null);

  private readonly runwayIdent = ConsumerSubject.create(this.sub.on('oansSelectedLandingRunway'), null);

  private readonly runwayLength = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('oansSelectedLandingRunwayLength'),
  );

  private readonly exitIdent = ConsumerSubject.create(this.sub.on('oansSelectedExit'), null);

  private readonly exitDistance = Arinc429LocalVarConsumerSubject.create(this.sub.on('oansRequestedStoppingDistance'));

  private readonly runwayInfoString = MappedSubject.create(
    ([ident, length]) =>
      ident && length.isNormalOperation()
        ? `${ident.substring(4).padStart(5, '\xa0')}${this.props.lengthUnit.get().convertFrom(length.value, UnitType.METER).toFixed(0).padStart(6, '\xa0')}`
        : '',
    this.runwayIdent,
    this.runwayLength,
  );

  private readonly runwayBearing = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('oansSelectedLandingRunwayBearing'),
  );

  private readonly btvFmsDisagree = MappedSubject.create(
    ([btv, fms, exit]) => fms && btv && !exit && btv !== fms,
    this.runwayIdent,
    this.fmsRwyIdent,
    this.exitIdent,
  );

  private readonly exitInfoString = MappedSubject.create(
    ([ident, dist]) =>
      ident && dist.isNormalOperation()
        ? `${ident.padStart(4, '\xa0')}${this.props.lengthUnit.get().convertFrom(dist.value, UnitType.METER).toFixed(0).padStart(6, '\xa0')}`
        : '',
    this.exitIdent,
    this.exitDistance,
  );

  private btvRot = Arinc429LocalVarConsumerSubject.create(this.sub.on('btvRot'));

  private readonly rot = this.btvRot.map((rot) =>
    rot.isNormalOperation() ? rot.value.toFixed(0).padStart(4, '\xa0') : '',
  );

  private readonly turnaroundMaxRev = Arinc429LocalVarConsumerSubject.create(this.sub.on('btvTurnAroundMaxReverse'));

  private readonly turnaroundIdleRev = Arinc429LocalVarConsumerSubject.create(this.sub.on('btvTurnAroundIdleReverse'));

  private distanceUnitFormatter(unit: Unit<UnitFamily.Distance>) {
    return unit === UnitType.METER ? 'M' : 'FT';
  }

  onAfterRender(node: VNode) {
    super.onAfterRender(node);
  }

  render(): VNode | null {
    return (
      <>
        <g visibility={this.runwayIdent.map((it) => (it ? 'visible' : 'hidden'))}>
          <Layer x={2} y={54}>
            <text x={0} y={0} class="White FontSmallest">
              RWY
            </text>
            <text x={50} y={0} class="Green FontSmallest">
              {this.runwayInfoString}
            </text>
            <text x={205} y={0} class="Cyan FontSmallest">
              {this.props.lengthUnit.map((v) => this.distanceUnitFormatter(v))}
            </text>
            <text x={225} y={0} class="White FontSmallest">
              -
            </text>
            <text x={245} y={0} class="Green FontSmallest">
              {this.runwayBearing.map((it) => (it.isNormalOperation() ? it.value.toFixed(0).padStart(3, '0') : ''))}
            </text>
            <text x={283} y={0} class="Cyan FontSmallest">
              °
            </text>
          </Layer>
        </g>
        <g visibility={this.btvFmsDisagree.map((it) => (it ? 'visible' : 'hidden'))}>
          <Layer x={2} y={82}>
            <rect x={0} y={-20} width={280} height={21} />
            <text x={0} y={0} class="Amber FontSmallest">
              BTV/FMS RWY DISAGREE
            </text>
          </Layer>
        </g>
        <g
          visibility={MappedSubject.create(
            ([rwy, exit]) => (rwy !== null && !exit ? 'visible' : 'hidden'),
            this.runwayIdent,
            this.exitIdent,
          )}
        >
          <Layer x={this.btvFmsDisagree.map(() => 2)} y={this.btvFmsDisagree.map((it) => (it ? 111 : 82))}>
            <rect x={0} y={-20} width={266} height={21} />
            <text x={0} y={0} class="White FontSmallest">
              FOR BTV:SELECT EXIT
            </text>
          </Layer>
        </g>
        <g visibility={this.exitInfoString.map((it) => (it ? 'visible' : 'hidden'))}>
          <Layer x={2} y={82}>
            <rect x={0} y={-20} width={64} height={21} />
            <text x={0} y={0} class="White FontSmallest">
              EXIT
            </text>
            <rect x={64} y={-20} width={154} height={21} />
            <text x={64} y={0} class="Green FontSmallest">
              {this.exitInfoString}
            </text>
            <text x={205} y={0} class="Cyan FontSmallest">
              {this.props.lengthUnit.map((v) => this.distanceUnitFormatter(v))}
            </text>
          </Layer>
        </g>
        <g
          visibility={MappedSubject.create(
            ([exit, rot]) => (exit && rot ? 'visible' : 'hidden'),
            this.exitIdent,
            this.rot,
          )}
        >
          <Layer x={2} y={111}>
            <rect x={0} y={-20} width={121} height={21} />
            <text x={0} y={0} class="White FontSmallest">
              ROT
            </text>
            <text x={50} y={0} class="Green FontSmallest">
              {this.rot}
            </text>
            <text x={107} y={0} class="Cyan FontSmallest">
              "
            </text>
          </Layer>
        </g>
        <g
          visibility={MappedSubject.create(
            ([exit, idle, max]) => (exit && idle.isNormalOperation() && max.isNormalOperation() ? 'visible' : 'hidden'),
            this.exitIdent,
            this.turnaroundIdleRev,
            this.turnaroundMaxRev,
          )}
        >
          <Layer x={2} y={140}>
            <rect x={0} y={-20} width={276} height={21} />
            <text x={0} y={0} class="White FontSmallest">
              TURNAROUND
            </text>
            <text x={150} y={0} class="Green FontSmallest">
              {this.turnaroundMaxRev.map((t) => t.value.toFixed(0).padStart(3, '\xa0'))}
            </text>
            <text x={192} y={0} class="Cyan FontSmallest">
              '
            </text>
            <text x={202} y={0} class="White FontSmallest">
              /
            </text>
            <text x={218} y={0} class="Green FontSmallest">
              {this.turnaroundIdleRev.map((t) => t.value.toFixed(0).padStart(3, '\xa0'))}
            </text>
            <text x={260} y={0} class="Cyan FontSmallest">
              '
            </text>
          </Layer>
        </g>
      </>
    );
  }
}
