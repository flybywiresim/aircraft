//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { ClockEvents, FSComponent, MappedSubject, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractOitAvncsPageProps } from '../../../OIT';
import { RadioButtonGroup } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/RadioButtonGroup';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import { FmsData, NXDataStore, NXUnits } from '@flybywiresim/fbw-sdk';
import { OitSimvars } from '../../../OitSimvarPublisher';

interface OitAvncsCompanyComFlightLogProps extends AbstractOitAvncsPageProps {}

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export abstract class OitAvncsCompanyComFlightLog extends DestroyableComponent<OitAvncsCompanyComFlightLogProps> {
  private readonly sci = this.props.container.ansu.sci;

  private readonly sub = this.props.bus.getSubscriber<FmsData & ClockEvents & OitSimvars>();

  private readonly flightSelectionSelectedIndex = Subject.create<number | null>(0);

  // FIXME maybe this should come from the ATC/ATSU when it's integrated
  private readonly fltNumberText = this.sci.fltNumber.map((number) => (number ? number : '----------'));

  private readonly fltOriginText = this.sci.fltOrigin.map((origin) => (origin ? origin : '----'));

  private readonly fltDestinationText = this.sci.fltDestination.map((destination) =>
    destination ? destination : '----',
  );

  private readonly scheduledDateText = Subject.create('----');

  formatDateTime(t: number | null): string {
    if (t === null) {
      return '------ --:--';
    }

    const date = new Date(t);
    return `${String(date.getDay()).padStart(2, '0')}-${months[date.getMonth()]} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private readonly outBlockTimeText = this.props.container.ansu.outBlockTime.map((t) => this.formatDateTime(t));
  private readonly offBlockTimeText = this.props.container.ansu.offBlockTime.map((t) => this.formatDateTime(t));
  private readonly onBlockTimeText = this.props.container.ansu.onBlockTime.map((t) => this.formatDateTime(t));
  private readonly inBlockTimeText = this.props.container.ansu.inBlockTime.map((t) => this.formatDateTime(t));

  private readonly userWeight = Subject.create<'KG' | 'LBS'>(NXUnits.userWeightUnit());

  private readonly configMetricUnitsSub = NXDataStore.getAndSubscribe(
    'CONFIG_USING_METRIC_UNIT',
    (_, value) => {
      this.userWeight.set(value === '1' ? 'KG' : 'LBS');
    },
    '1',
  );

  private readonly outBlockFobText = MappedSubject.create(
    ([weight, unit]) =>
      weight !== null ? `${NXUnits.kgToUser(weight).toFixed(0).padStart(6, ' ')} ${unit}` : '----- ---',
    this.props.container.ansu.outBlockFob,
    this.userWeight,
  );
  private readonly offBlockFobText = MappedSubject.create(
    ([weight, unit]) =>
      weight !== null ? `${NXUnits.kgToUser(weight).toFixed(0).padStart(6, ' ')} ${unit}` : '----- ---',
    this.props.container.ansu.offBlockFob,
    this.userWeight,
  );
  private readonly onBlockFobText = MappedSubject.create(
    ([weight, unit]) =>
      weight !== null ? `${NXUnits.kgToUser(weight).toFixed(0).padStart(6, ' ')} ${unit}` : '----- ---',
    this.props.container.ansu.onBlockFob,
    this.userWeight,
  );
  private readonly inBlockFobText = MappedSubject.create(
    ([weight, unit]) =>
      weight !== null ? `${NXUnits.kgToUser(weight).toFixed(0).padStart(6, ' ')} ${unit}` : '----- ---',
    this.props.container.ansu.inBlockFob,
    this.userWeight,
  );

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.fltNumberText,
      this.fltOriginText,
      this.fltDestinationText,
      this.outBlockTimeText,
      this.offBlockTimeText,
      this.onBlockTimeText,
      this.inBlockTimeText,
    );
    this.subscriptions.push(
      this.sub
        .on('realTime')
        .atFrequency(1)
        .handle((time) => {
          const date = new Date(time);
          this.scheduledDateText.set(
            `${String(date.getDay()).padStart(2, '0')}-${months[date.getMonth()]}-${String(date.getFullYear()).substring(-2)}`,
          );
        }),
    );
  }

  destroy(): void {
    this.configMetricUnitsSub();

    super.destroy();
  }

  render(): VNode {
    return (
      <>
        <div class="oit-ccom-headline">Flight Log</div>
        <div class="oit-labeled-box-container">
          <span class="oit-labeled-box-label">Flight</span>
          <RadioButtonGroup
            values={['Current FLT', 'FLT n-1', 'FLT n-2']}
            selectedIndex={this.flightSelectionSelectedIndex}
            idPrefix="oit-flight-log-flight"
          />
        </div>
        <div class="oit-labeled-box-container">
          <div class="oit-ccom-flight-log-grid">
            <div>From</div>
            <div>{this.fltOriginText}</div>
            <div>To</div>
            <div>{this.fltDestinationText}</div>
            <div>Flight Identifier</div>
            <div class="oit-green-text">{this.fltNumberText}</div>
            <div>Scheduled Date</div>
            <div class="oit-green-text">{this.scheduledDateText}</div>
          </div>
        </div>
        <div style="display: flex; flex-direction: row;">
          <div style="flex: 1; display: flex; justify-content: center; align-items: center;">
            <div class="oit-ccom-flight-log-oooi-table">
              <div>State</div>
              <div>Time (UTC)</div>
              <div>FOB</div>
              <div>OUT</div>
              <div>{this.outBlockTimeText}</div>
              <div>{this.outBlockFobText}</div>
              <div>OFF</div>
              <div>{this.offBlockTimeText}</div>
              <div>{this.offBlockFobText}</div>
              <div>ON</div>
              <div>{this.onBlockTimeText}</div>
              <div>{this.onBlockFobText}</div>
              <div>IN</div>
              <div>{this.inBlockTimeText}</div>
              <div>{this.inBlockFobText}</div>
            </div>
          </div>
        </div>
      </>
    );
  }
}
