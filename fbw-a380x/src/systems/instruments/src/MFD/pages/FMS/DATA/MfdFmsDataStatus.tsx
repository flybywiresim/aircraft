// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdFmsDataStatus.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MFD/pages/common/TopTabNavigator';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { AirlineModifiableInformation } from '@shared/AirlineModifiableInformation';
import { NavigationDatabaseService } from '@fmgc/index';

interface MfdFmsDataStatusProps extends AbstractMfdPageProps {}

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export class MfdFmsDataStatus extends FmsPage<MfdFmsDataStatusProps> {
  private selectedPageIndex = Subject.create<number>(0);

  private navDatabase = Subject.create('FBW2301001');

  private activeDatabase = Subject.create('30DEC-27JAN');

  private secondDatabase = Subject.create('27JAN-24FEB');

  private storedWaypoints = Subject.create('00');

  private storedRoutes = Subject.create('00');

  private storedNavaids = Subject.create('00');

  private storedRunways = Subject.create('00');

  private deleteStoredElementsDisabled = Subject.create(true);

  protected onNewData() {
    NavigationDatabaseService.activeDatabase.getDatabaseIdent().then((db) => {
      const from = new Date(db.effectiveFrom);
      const to = new Date(db.effectiveTo);
      this.activeDatabase.set(`${from.getDay()}${months[from.getMonth()]}-${to.getDay()}${months[to.getMonth()]}`);
    });

    const date = this.props.fmcService.master?.fmgc.getNavDataDateRange();
    if (date) {
      this.secondDatabase.set(this.calculateSecDate(date));
    }

    const storedElements = this.props.fmcService.master?.getDataManager()?.numberOfStoredElements();
    if (storedElements) {
      this.storedWaypoints.set(storedElements.waypoints.toFixed(0).padStart(2, '0'));
      this.storedRoutes.set(storedElements.routes.toFixed(0).padStart(2, '0'));
      this.storedNavaids.set(storedElements.navaids.toFixed(0).padStart(2, '0'));
      this.storedRunways.set(storedElements.runways.toFixed(0).padStart(2, '0'));
      this.deleteStoredElementsDisabled.set(storedElements.total === 0);
    }
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subs.push(
      this.props.mfd.uiService.activeUri.sub((val) => {
        if (val.extra === 'acft-status') {
          this.selectedPageIndex.set(0);
        } else if (val.extra === 'fms-pn') {
          this.selectedPageIndex.set(1);
        }
      }, true),
    );

    const sub = this.props.bus.getSubscriber<ClockEvents & MfdSimvars>();
    this.subs.push(
      sub
        .on('realTime')
        .atFrequency(0.5)
        .handle((_t) => {
          this.onNewData();
        }),
    );
  }

  private findNewMonthIndex(index: number) {
    if (index === 0) {
      return 11;
    }
    return index - 1;
  }

  private lessThan10(num: number) {
    if (num < 10) {
      return `0${num}`;
    }
    return num;
  }

  private calculateActiveDate(date: string): string {
    if (date.length === 13) {
      const startMonth = date.slice(0, 3);
      const startDay = date.slice(3, 5);

      const endMonth = date.slice(5, 8);
      const endDay = date.slice(8, 10);

      return `${startDay}${startMonth}-${endDay}${endMonth}`;
    }
    return date;
  }

  private calculateSecDate(date: string): string {
    if (date.length === 13) {
      const primStartMonth = date.slice(0, 3);
      const primStartDay = Number(date.slice(3, 5));

      const primStartMonthIndex = months.findIndex((item) => item === primStartMonth);

      if (primStartMonthIndex === -1) {
        return 'ERR';
      }

      let newEndMonth = primStartMonth;
      let newEndDay = primStartDay - 1;

      let newStartDay = newEndDay - 27;
      let newStartMonth = primStartMonth;

      if (newEndDay === 0) {
        newEndMonth = months[this.findNewMonthIndex(primStartMonthIndex)];
        newEndDay = monthLength[this.findNewMonthIndex(primStartMonthIndex)];
      }

      if (newStartDay <= 0) {
        newStartMonth = months[this.findNewMonthIndex(primStartMonthIndex)];
        newStartDay = monthLength[this.findNewMonthIndex(primStartMonthIndex)] + newStartDay;
      }

      return `${this.lessThan10(newStartDay)}${newStartMonth}-${this.lessThan10(newEndDay)}${newEndMonth}`;
    }
    return 'ERR';
  }

  render(): VNode {
    return (
      <>
        {super.render()}
        {/* begin page content */}
        <div class="mfd-page-container">
          <TopTabNavigator
            pageTitles={Subject.create(['ACFT STATUS', 'FMS P/N'])}
            selectedPageIndex={this.selectedPageIndex}
            pageChangeCallback={(val) => this.selectedPageIndex.set(val)}
            selectedTabTextColor="white"
            tabBarSlantedEdgeAngle={25}
          >
            <TopTabNavigatorPage>
              {/* ACFT STATUS */}
              <div class="mfd-data-status-airframe-label mfd-value bigger">A380-800</div>
              <div class="mfd-data-status-first-section">
                <div>
                  <span class="mfd-label" style="margin-right: 50px;">
                    ENGINE
                  </span>
                  <span class="mfd-value bigger">TRENT 972</span>
                </div>
                <div>
                  <div style="border: 1px solid lightgrey; padding: 10px; display: flex; flex-direction: column;">
                    <div style="margin-bottom: 10px;">
                      <span class="mfd-label" style="margin-right: 10px;">
                        IDLE
                      </span>
                      <span class="mfd-value bigger">
                        {`${AirlineModifiableInformation.EK.idleFactor >= 0 ? '+' : '-'}${AirlineModifiableInformation.EK.idleFactor.toFixed(1)}`}
                      </span>
                    </div>
                    <div>
                      <span class="mfd-label" style="margin-right: 10px;">
                        PERF
                      </span>
                      <span class="mfd-value bigger">
                        {`${AirlineModifiableInformation.EK.perfFactor >= 0 ? '+' : '-'}${AirlineModifiableInformation.EK.perfFactor.toFixed(1)}`}
                      </span>
                    </div>
                  </div>
                  <div style="margin-top: 10px; display: flex; justify-content: center;">
                    <Button
                      label="MODIFY"
                      onClick={() => {}}
                      disabled={Subject.create(true)}
                      buttonStyle="width: 125px;"
                    />
                  </div>
                </div>
              </div>
              <div class="mfd-data-status-second-section">
                <div style="margin-bottom: 15px;">
                  <span class="mfd-label" style="margin-right: 25px;">
                    NAV DATABASE
                  </span>
                  <span class="mfd-value bigger">{this.navDatabase}</span>
                </div>
                <div style="width: 100%; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
                  <div style="border: 1px solid lightgrey; padding: 15px; display: flex; flex-direction: column;">
                    <div class="mfd-label" style="display: flex; justify-content: center; margin-bottom: 15px;">
                      ACTIVE
                    </div>
                    <div>
                      <span class="mfd-value bigger">{this.activeDatabase}</span>
                    </div>
                  </div>
                  <div>
                    <Button
                      label={Subject.create(
                        <div style="display: flex; flex-direction: row; justify-content: space-between; width: 100px; height: 40px;">
                          <span style="display: flex; align-items: center; justify-content: center; margin-left: 10px;">
                            SWAP
                          </span>
                          <span style="display: flex; align-items: center; justify-content: center;">*</span>
                        </div>,
                      )}
                      onClick={() => {}}
                      disabled={Subject.create(true)}
                    />
                  </div>
                  <div style="padding: 15px; display: flex; flex-direction: column;">
                    <div class="mfd-label" style="display: flex; justify-content: center; margin-bottom: 15px;">
                      SECOND
                    </div>
                    <div>
                      <span class="mfd-value">{this.secondDatabase}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="mfd-data-status-third-section">
                <div style="margin-bottom: 35px;">
                  <span class="mfd-label" style="margin-right: 25px;">
                    PILOT STORED ELEMENTS
                  </span>
                </div>
                <div style="width: 100%; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
                  <div style="flex: 3; display: grid; grid-template-columns: 40% 10% 40% 10%; margin-right: 200px;">
                    <div class="mfd-label mfd-data-status-pse-label">WAYPOINTS</div>
                    <div class="mfd-value mfd-data-status-pse-value">{this.storedWaypoints}</div>
                    <div class="mfd-label mfd-data-status-pse-label">ROUTES</div>
                    <div class="mfd-value mfd-data-status-pse-value">{this.storedRoutes}</div>
                    <div class="mfd-label mfd-data-status-pse-label">NAVAIDS</div>
                    <div class="mfd-value mfd-data-status-pse-value">{this.storedNavaids}</div>
                    <div class="mfd-label mfd-data-status-pse-label">RUNWAYS</div>
                    <div class="mfd-value mfd-data-status-pse-value">{this.storedRunways}</div>
                  </div>
                  <div style="flex: 1;">
                    <Button
                      label={Subject.create(
                        <div style="display: flex; flex-direction: row; justify-content: space-between; width: 175px; height: 40px;">
                          <span style="display: flex; align-items: center; justify-content: center;">DELETE ALL</span>
                          <span style="display: flex; align-items: center; justify-content: center;">*</span>
                        </div>,
                      )}
                      onClick={() => this.props.fmcService.master?.getDataManager()?.deleteAllStoredWaypoints()}
                      disabled={this.deleteStoredElementsDisabled}
                    />
                  </div>
                </div>
              </div>
            </TopTabNavigatorPage>
            <TopTabNavigatorPage>{/* FMS P/N */}</TopTabNavigatorPage>
          </TopTabNavigator>
          <div style="flex-grow: 1;" />
          {/* fill space vertically */}
        </div>
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
