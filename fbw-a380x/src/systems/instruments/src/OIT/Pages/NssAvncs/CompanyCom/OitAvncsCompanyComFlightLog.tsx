//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { ClockEvents, FSComponent, MappedSubject, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractOitAvncsPageProps } from '../../../OIT';
import { RadioButtonGroup } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/RadioButtonGroup';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import { FmsData, NXDataStore, NXUnits } from '@flybywiresim/fbw-sdk';
import { OitSimvars } from '../../../OitSimvarPublisher';
import { AnsuOps } from '../../../System/AnsuOps';

interface OitAvncsCompanyComFlightLogProps extends AbstractOitAvncsPageProps {}

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

  private readonly outBlockTimeText = this.props.container.ansu.outBlockTime.map((t) => AnsuOps.formatDateTime(t));
  private readonly offBlockTimeText = this.props.container.ansu.offBlockTime.map((t) => AnsuOps.formatDateTime(t));
  private readonly onBlockTimeText = this.props.container.ansu.onBlockTime.map((t) => AnsuOps.formatDateTime(t));
  private readonly inBlockTimeText = this.props.container.ansu.inBlockTime.map((t) => AnsuOps.formatDateTime(t));

  private readonly userWeight = Subject.create<'KG' | 'LBS'>(NXUnits.userWeightUnit());

  private readonly configMetricUnitsSub = NXDataStore.getAndSubscribeLegacy(
    'CONFIG_USING_METRIC_UNIT',
    (_, value) => {
      this.userWeight.set(value === '1' ? 'KG' : 'LBS');
    },
    '1',
  );

  private readonly outBlockFobText = MappedSubject.create(
    ([weight, unit]) =>
      weight !== null
        ? `${(NXUnits.kgToUser(weight) / 1_000).toFixed(1).padStart(5, '\xa0')} ${unit === 'KG' ? 'T' : 'KLB'}`
        : '----- -',
    this.props.container.ansu.outBlockFob,
    this.userWeight,
  );
  private readonly offBlockFobText = MappedSubject.create(
    ([weight, unit]) =>
      weight !== null
        ? `${(NXUnits.kgToUser(weight) / 1_000).toFixed(1).padStart(5, '\xa0')} ${unit === 'KG' ? 'T' : 'KLB'}`
        : '----- -',
    this.props.container.ansu.offBlockFob,
    this.userWeight,
  );
  private readonly onBlockFobText = MappedSubject.create(
    ([weight, unit]) =>
      weight !== null
        ? `${(NXUnits.kgToUser(weight) / 1_000).toFixed(1).padStart(5, '\xa0')} ${unit === 'KG' ? 'T' : 'KLB'}`
        : '----- -',
    this.props.container.ansu.onBlockFob,
    this.userWeight,
  );
  private readonly inBlockFobText = MappedSubject.create(
    ([weight, unit]) =>
      weight !== null
        ? `${(NXUnits.kgToUser(weight) / 1_000).toFixed(1).padStart(5, '\xa0')} ${unit === 'KG' ? 'T' : 'KLB'}`
        : '----- -',
    this.props.container.ansu.inBlockFob,
    this.userWeight,
  );

  private readonly currentStateText = MappedSubject.create(
    ([out, off, on, inb]) => {
      if (out === null) {
        return 'INITIAL';
      } else if (off === null) {
        return 'PRE-FLIGHT';
      } else if (on === null) {
        return 'IN-FLIGHT';
      } else if (inb === null) {
        return 'POST-FLIGHT';
      }
      return 'IN';
    },
    this.props.container.ansu.outBlockTime,
    this.props.container.ansu.offBlockTime,
    this.props.container.ansu.onBlockTime,
    this.props.container.ansu.inBlockTime,
  );

  private readonly flightTimeText = this.props.container.ansu.flightTime.map((t) => {
    if (t === null) {
      return '--:--:--';
    }

    const duration = new Date(t);
    return `${String(duration.getUTCDate() * duration.getUTCHours()).padStart(2, '0')}:${String(duration.getUTCMinutes()).padStart(2, '0')}:${String(duration.getUTCSeconds()).padStart(2, '0')}`;
  });

  private readonly blockTimeText = this.props.container.ansu.blockTime.map((t) => {
    if (t === null) {
      return '--:--:--';
    }

    const duration = new Date(t);
    return `${String(duration.getUTCDate() * duration.getUTCHours()).padStart(2, '0')}:${String(duration.getUTCMinutes()).padStart(2, '0')}:${String(duration.getUTCSeconds()).padStart(2, '0')}`;
  });

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
      this.outBlockFobText,
      this.offBlockFobText,
      this.onBlockFobText,
      this.inBlockFobText,
      this.currentStateText,
      this.flightTimeText,
      this.blockTimeText,
    );
    this.subscriptions.push(
      this.sub
        .on('simTime')
        .atFrequency(1)
        .handle((time) => {
          const date = new Date(time);
          this.scheduledDateText.set(
            `${String(date.getUTCDate()).padStart(2, '0')}-${AnsuOps.months[date.getUTCMonth()]}-${String(date.getUTCFullYear()).substring(2)}`,
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
          <div style="display: flex; flex-direction: row; justify-content: flex-start; break-before: always;">
            <RadioButtonGroup
              values={['Current FLT']}
              selectedIndex={this.flightSelectionSelectedIndex}
              idPrefix="oit-flight-log-flight"
            />
          </div>
        </div>
        <div class="oit-labeled-box-container">
          <div class="oit-ccom-flight-log-grid">
            <div class="oit-align-right-sp25">From</div>
            <div>{this.fltOriginText}</div>
            <div class="oit-align-right-sp25">To</div>
            <div>{this.fltDestinationText}</div>
            <div class="oit-align-right-sp25 mt20">Flight Identifier</div>
            <div class="oit-green-text mt20">{this.fltNumberText}</div>
            <div class="oit-align-right-sp25 mt20">Scheduled Date</div>
            <div class="oit-green-text mt20">{this.scheduledDateText}</div>
          </div>
        </div>
        <div class="oit-ccom-flight-log-bottom-structure">
          <div class="oit-ccom-flight-log-bottom-structure-left">
            <div class="oit-ccom-flight-log-oooi-table">
              <div class="oit-ccom-flight-log-oooi-table-header oit-table-ib">State</div>
              <div class="oit-ccom-flight-log-oooi-table-header oit-table-ib">Time (UTC)</div>
              <div class="oit-ccom-flight-log-oooi-table-header oit-table-ib">FOB</div>
              <div class="oit-table-ib">OUT</div>
              <div class="oit-green-text oit-table-ib">{this.outBlockTimeText}</div>
              <div class="oit-green-text oit-table-ib">{this.outBlockFobText}</div>
              <div class="oit-table-ib">OFF</div>
              <div class="oit-green-text oit-table-ib">{this.offBlockTimeText}</div>
              <div class="oit-green-text oit-table-ib">{this.offBlockFobText}</div>
              <div class="oit-table-ib">ON</div>
              <div class="oit-green-text oit-table-ib">{this.onBlockTimeText}</div>
              <div class="oit-green-text oit-table-ib">{this.onBlockFobText}</div>
              <div class="oit-table-ib">IN</div>
              <div class="oit-green-text oit-table-ib">{this.inBlockTimeText}</div>
              <div class="oit-green-text oit-table-ib">{this.inBlockFobText}</div>
            </div>
          </div>
          <div class="oit-ccom-flight-log-bottom-structure-right">
            <div class="oit-ccom-flight-log-bottom-structure-right1">
              <div class="mr15">Current State</div>
              <div class="oit-green-text">{this.currentStateText}</div>
            </div>
            <div class="oit-ccom-flight-log-bottom-structure-right2">
              <div class="mr15">Flight Time</div>
              <div>Block Time</div>
              <div class="oit-green-text mr15 tc">{this.flightTimeText}</div>
              <div class="oit-green-text tc">{this.blockTimeText}</div>
            </div>
          </div>
        </div>
        <div style="flex-grow: 1" />
      </>
    );
  }
}
