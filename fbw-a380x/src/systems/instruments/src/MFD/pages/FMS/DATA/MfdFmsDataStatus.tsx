// Copyright (c) 2024-2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/TopTabNavigator';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { AirlineModifiableInformation } from '@shared/AirlineModifiableInformation';
import { DatabaseIdent } from '@flybywiresim/fbw-sdk';
import { ConfirmationDialog } from '../../../../MsfsAvionicsCommon/UiWidgets/ConfirmationDialog';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';

import './MfdFmsDataStatus.scss';
import { FuelPenaltyPercentFormat } from '../../common/DataEntryFormats';
import { InputField } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';

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
  private readonly selectedPageIndex = Subject.create<number>(0);

  private readonly navDatabase = Subject.create('');

  private readonly activeDatabase = Subject.create('');
  private readonly secondDatabase = Subject.create('');

  private readonly storedWaypoints = Subject.create('00');

  private readonly storedRoutes = Subject.create('00');
  private readonly storedNavaids = Subject.create('00');

  private readonly storedRunways = Subject.create('00');

  private readonly deleteStoredElementsDisabled = Subject.create(true);
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

    const sub = this.props.bus.getSubscriber<ClockEvents>();
    this.subs.push(
      sub
        .on('realTime')
        .atFrequency(1)
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
              <div class="mfd-data-status-airframe-label mfd-value bigger">A380-800&nbsp;/&nbsp;TRENT 972</div>
              <div class="mfd-data-status-performance-row" style="width:655px; margin-bottom: 10px;">
                <span class="mfd-label bigger" style="margin-right: 25px;">
                  IDLE
                </span>
                <span class="mfd-value bigger" style="margin-right: 60px;">
                  {`${AirlineModifiableInformation.EK.idleFactor >= 0 ? '+' : '-'}${AirlineModifiableInformation.EK.idleFactor.toFixed(1)}`}
                </span>
                <span class="mfd-label bigger" style="margin-right: 25px;">
                  PERF
                </span>
                <span class="mfd-value bigger" style="margin-right: 95px;">
                  {`${AirlineModifiableInformation.EK.perfFactor >= 0 ? '+' : '-'}${AirlineModifiableInformation.EK.perfFactor.toFixed(1)}`}
                </span>
                <div style="display: flex; justify-content: center;">
                  <Button
                    label="MODIFY"
                    onClick={() => {}}
                    disabled={Subject.create(true)}
                    buttonStyle="width: 125px;"
                  />
                </div>
              </div>
              <div class="mfd-data-status-performance-row" style="width:380px; margin-bottom: 10px;">
                <span class={'mfd-label bigger'}>FUEL PENALTY&nbsp;</span>
                <InputField<number>
                  dataEntryFormat={new FuelPenaltyPercentFormat()}
                  value={this.props.fmcService.master?.fmgc.data.fuelPenaltyPercentage!}
                  enteredByPilot={this.props.fmcService.master?.fmgc.data.fuelPenaltyActive!}
                  canBeCleared={Subject.create(true)}
                  containerStyle="width: 155px;"
                  alignText="center"
                  errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                  hEventConsumer={this.props.mfd.hEventConsumer}
                  interactionMode={this.props.mfd.interactionMode}
                />
              </div>

              <div class="mfd-data-status-first-section-divider"></div>

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
                <div style="margin-bottom: 15px; margin-left: 10px;">
                  <span class="mfd-label bigger" style="margin-right: 25px; ">
                    NAV DATABASE
                  </span>
                  <span class="mfd-value bigger">{this.navDatabase}</span>
                </div>
                <div style="width: 100%; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
                  <div style="border: 1px solid lightgrey; padding: 15px; display: flex; flex-direction: column;">
                    <div class="mfd-label bigger" style="display: flex; justify-content: center; margin-bottom: 15px;">
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
                    <div class="mfd-label bigger" style="display: flex; justify-content: center; margin-bottom: 15px;">
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
                  <span class="mfd-label bigger" style="margin-left: 15px;">
                    PILOT STORED ELEMENTS
                  </span>
                </div>
                <div style="width: 100%; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
                  <div style="flex: 3; display: grid; grid-template-columns: 52% 22% 40% 10%; margin-right: 200px;">
                    <div class="mfd-label  bigger mfd-data-status-pse-label">WAYPOINTS</div>
                    <div class="mfd-value bigger mfd-data-status-pse-value">{this.storedWaypoints}</div>
                    <div class="mfd-label bigger mfd-data-status-pse-label">ROUTES</div>
                    <div class="mfd-value bigger mfd-data-status-pse-value">{this.storedRoutes}</div>
                    <div class="mfd-label bigger mfd-data-status-pse-label">NAVAIDS</div>
                    <div class="mfd-value bigger mfd-data-status-pse-value">{this.storedNavaids}</div>
                    <div class="mfd-label bigger mfd-data-status-pse-label">RUNWAYS</div>
                    <div class="mfd-value bigger mfd-data-status-pse-value">{this.storedRunways}</div>
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
