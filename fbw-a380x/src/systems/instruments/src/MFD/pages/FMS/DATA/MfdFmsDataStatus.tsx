// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MFD/pages/common/TopTabNavigator';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { AirlineModifiableInformation } from '@shared/AirlineModifiableInformation';
import { NavigationDatabaseService } from '@fmgc/index';
import { DatabaseIdent } from '@flybywiresim/fbw-sdk';
import { ConfirmationDialog } from '../../common/ConfirmationDialog';

import './MfdFmsDataStatus.scss';

interface MfdFmsDataStatusProps extends AbstractMfdPageProps {}

const DB_MONTHS: Record<string, string> = {
  '01': 'JAN',
  '02': 'FEB',
  '03': 'MAR',
  '04': 'APR',
  '05': 'MAY',
  '06': 'JUN',
  '07': 'JUL',
  '08': 'AUG',
  '09': 'SEP',
  '10': 'OCT',
  '11': 'NOV',
  '12': 'DEC',
};

export class MfdFmsDataStatus extends FmsPage<MfdFmsDataStatusProps> {
  private selectedPageIndex = Subject.create<number>(0);

  private navDatabase = Subject.create('');

  private activeDatabase = Subject.create('');

  private secondDatabase = Subject.create('');

  private storedWaypoints = Subject.create('00');

  private storedRoutes = Subject.create('00');

  private storedNavaids = Subject.create('00');

  private storedRunways = Subject.create('00');

  private deleteStoredElementsDisabled = Subject.create(true);

  private readonly isSwapConfirmVisible = Subject.create(false);

  protected onNewData() {
    NavigationDatabaseService.activeDatabase.getDatabaseIdent().then((dbCycle) => {
      const navCycleDates = dbCycle === null ? '' : MfdFmsDataStatus.calculateActiveDate(dbCycle);
      const navSerial =
        dbCycle === null ? '' : `${dbCycle.provider.substring(0, 2).toUpperCase()}${dbCycle.airacCycle}0001`;

      this.activeDatabase.set(navCycleDates);
      this.secondDatabase.set(navCycleDates);
      this.navDatabase.set(navSerial);
    });

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

  private static calculateActiveDate(dbIdent: DatabaseIdent): string {
    const effDay = dbIdent.effectiveFrom.substring(8);
    const effMonth = dbIdent.effectiveFrom.substring(5, 7);
    const expDay = dbIdent.effectiveTo.substring(8);
    const expMonth = dbIdent.effectiveTo.substring(5, 7);

    return `${effDay}${DB_MONTHS[effMonth]}-${expDay}${DB_MONTHS[expMonth]}`;
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
            pageChangeCallback={(val) => {
              this.selectedPageIndex.set(val);
              this.isSwapConfirmVisible.set(false);
            }}
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
                <div style="position: relative; display: flex; justify-content: center; width: 100%;">
                  <ConfirmationDialog
                    visible={this.isSwapConfirmVisible}
                    cancelAction={() => {
                      this.isSwapConfirmVisible.set(false);
                    }}
                    confirmAction={() => {
                      this.props.fmcService.master?.swapNavDatabase();
                      this.isSwapConfirmVisible.set(false);
                    }}
                    contentContainerStyle="width: 325px; height: 165px; transform: translateX(-50%);"
                  >
                    SWAP&nbsp;?
                  </ConfirmationDialog>
                </div>
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
                      onClick={() => this.isSwapConfirmVisible.set(true)}
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
