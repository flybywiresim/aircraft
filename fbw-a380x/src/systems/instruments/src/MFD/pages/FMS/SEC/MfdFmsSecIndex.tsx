import { AbstractMfdPageProps, MfdDisplayInterface } from 'instruments/src/MFD/MFD';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/TopTabNavigator';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';

import {
  EventBus,
  FSComponent,
  MappedSubject,
  MappedSubscribable,
  Subject,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';

import './MfdFmsSecIndex.scss';
import { FlightPlanChangeNotifier } from '@fmgc/flightplanning/sync/FlightPlanChangeNotifier';
import { Button, ButtonMenuItem } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { FmcInterface } from '../../../FMC/FmcInterface';
import { FmcServiceInterface } from '../../../FMC/FmcServiceInterface';
import { FmsDisplayInterface } from '@fmgc/flightplanning/interface/FmsDisplayInterface';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { ReadonlyFlightPlanElement } from '@fmgc/flightplanning/legs/ReadonlyFlightPlanLeg';
import { IconButton } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/IconButton';

const getCurrentHHMMSS = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secondsLeft = Math.floor(seconds - hours * 3600 - minutes * 60).toFixed(0);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;
};

interface MfdFmsSecIndexProps extends AbstractMfdPageProps {}

class MfdFmsSecIndexDataStore {
  private readonly subscriptions: Subscription[] = [];

  readonly flightPlanChangeNotifier = new FlightPlanChangeNotifier(this.bus);

  readonly secExists = Subject.create(false);

  readonly timeCreated = Subject.create<number | null>(null);

  readonly fromCity = Subject.create<string | null>(null);
  readonly toCity = Subject.create<string | null>(null);

  readonly legs = Subject.create<readonly ReadonlyFlightPlanElement[]>([]);

  // Called from page when new data is available
  onNewData() {
    if (!this.fmc) {
      return;
    }

    if (!this.fmc.flightPlanInterface.hasSecondary(this.secIndex)) {
      this.secExists.set(false);
      this.timeCreated.set(null);
      this.fromCity.set(null);
      this.toCity.set(null);
      this.legs.set([]);
      return;
    }

    this.secExists.set(true);

    const flightPlan = this.fmc.flightPlanInterface.secondary(this.secIndex);
    this.timeCreated.set(flightPlan.timeCreated);
    this.fromCity.set(flightPlan.originAirport?.ident ?? null);
    this.toCity.set(flightPlan.destinationAirport?.ident ?? null);
    this.legs.set(flightPlan.allLegs);
  }

  constructor(
    private readonly secIndex: number, // 1-indexed
    private readonly bus: EventBus,
    private readonly fmc: FmcInterface | null,
  ) {
    this.subscriptions.push(
      this.flightPlanChangeNotifier.flightPlanChanged.sub(() => {
        this.onNewData();
      }, true),
    );
  }

  destroy(): void {
    this.flightPlanChangeNotifier.destroy();
    this.subscriptions.forEach((sub) => sub.destroy());
  }
}

export class MfdFmsSecIndex extends FmsPage<MfdFmsSecIndexProps> {
  private readonly sec1DataStore = new MfdFmsSecIndexDataStore(1, this.props.bus, this.props.fmcService.master);
  private readonly sec2DataStore = new MfdFmsSecIndexDataStore(2, this.props.bus, this.props.fmcService.master);
  private readonly sec3DataStore = new MfdFmsSecIndexDataStore(3, this.props.bus, this.props.fmcService.master);

  private readonly secSelectedPageIndex = Subject.create(0);

  protected onNewData() {
    if (!this.props.fmcService.master) {
      return;
    }

    this.sec1DataStore.onNewData();
    this.sec2DataStore.onNewData();
    this.sec3DataStore.onNewData();
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  public destroy(): void {
    this.sec1DataStore.destroy();
    this.sec2DataStore.destroy();
    this.sec3DataStore.destroy();

    super.destroy();
  }

  render(): VNode {
    return (
      <>
        {super.render()}
        {/* begin page content */}
        <div class="mfd-page-container">
          <TopTabNavigator
            pageTitles={Subject.create(['SEC 1', 'SEC 2', 'SEC 3'])}
            selectedPageIndex={this.secSelectedPageIndex}
            pageChangeCallback={(val) => this.secSelectedPageIndex.set(val)}
            selectedTabTextColor="white"
            tabBarSlantedEdgeAngle={25}
          >
            <TopTabNavigatorPage>
              {/* SEC 1 */}
              <MfdFmsSecIndexTab
                dataStore={this.sec1DataStore}
                bus={this.props.bus}
                mfd={this.props.mfd}
                fmcService={this.props.fmcService}
                flightPlanIndex={FlightPlanIndex.FirstSecondary}
              />
            </TopTabNavigatorPage>
            <TopTabNavigatorPage>
              {/* SEC 2 */}
              <MfdFmsSecIndexTab
                dataStore={this.sec2DataStore}
                bus={this.props.bus}
                mfd={this.props.mfd}
                fmcService={this.props.fmcService}
                flightPlanIndex={FlightPlanIndex.FirstSecondary + 1}
              />
            </TopTabNavigatorPage>
            <TopTabNavigatorPage>
              {/* SEC 3 */}
              <MfdFmsSecIndexTab
                dataStore={this.sec3DataStore}
                bus={this.props.bus}
                mfd={this.props.mfd}
                fmcService={this.props.fmcService}
                flightPlanIndex={FlightPlanIndex.FirstSecondary + 2}
              />
            </TopTabNavigatorPage>
          </TopTabNavigator>
        </div>
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}

interface MfdFmsSecIndexTabProps {
  dataStore: MfdFmsSecIndexDataStore;
  bus: EventBus;
  mfd: FmsDisplayInterface & MfdDisplayInterface;
  fmcService: FmcServiceInterface;
  flightPlanIndex: FlightPlanIndex;
}

export class MfdFmsSecIndexTab extends DestroyableComponent<MfdFmsSecIndexTabProps> {
  private readonly secIndex = this.props.flightPlanIndex - FlightPlanIndex.FirstSecondary + 1;
  private readonly uriPrefix = `fms/sec${this.secIndex}`;

  private readonly secDoesNotExist = this.props.dataStore.secExists.map((it) => !it);

  private readonly swapActiveNotAllowed = MappedSubject.create(([exists]) => {
    return !exists;
  }, this.props.dataStore.secExists);

  private readonly cityPairLabel = MappedSubject.create(
    ([fromCity, toCity]) => {
      if (fromCity && toCity) {
        return `${fromCity} / ${toCity}`;
      }
      return '';
    },
    this.props.dataStore.fromCity,
    this.props.dataStore.toCity,
  );

  private readonly createdLabel = MappedSubject.create(
    ([exists, timeCreated]) => {
      if (exists && timeCreated) {
        return `CREATED ${getCurrentHHMMSS(timeCreated).substring(0, 5)}`;
      }
      return '';
    },
    this.props.dataStore.secExists,
    this.props.dataStore.timeCreated,
  );

  private readonly cpnyFplnButtonLabel = this.props.fmcService.master
    ? this.props.fmcService.master.fmgc.data.cpnyFplnAvailable.map((it) => {
        if (!it) {
          return (
            <span>
              CPNY F-PLN
              <br />
              REQUEST
            </span>
          );
        }
        return (
          <span>
            RECEIVED
            <br />
            CPNY F-PLN
          </span>
        );
      })
    : MappedSubject.create(() => <></>);

  private readonly cpnyFplnButtonMenuItems: MappedSubscribable<ButtonMenuItem[]> = this.props.fmcService.master
    ? this.props.fmcService.master.fmgc.data.cpnyFplnAvailable.map((it) =>
        it
          ? [
              {
                label: 'INSERT*',
                action: () => this.props.fmcService.master?.insertCpnyFpln(this.props.flightPlanIndex),
              },
              {
                label: 'CLEAR*',
                action: () => {
                  this.props.fmcService.master?.flightPlanInterface.uplinkDelete();
                  this.props.fmcService.master?.fmgc.data.cpnyFplnAvailable.set(false);
                },
              },
            ]
          : [],
      )
    : MappedSubject.create(() => []);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.secDoesNotExist,
      this.swapActiveNotAllowed,
      this.cityPairLabel,
      this.createdLabel,
      this.cpnyFplnButtonLabel,
      this.cpnyFplnButtonMenuItems,
    );
  }

  render(): VNode | null {
    return (
      this.props.fmcService.master && (
        <>
          <div class="mfd-sec-index-title-container">
            <span class="mfd-sec-index-title-line1">{this.cityPairLabel}</span>
            <span class="mfd-sec-index-title-line2">{this.createdLabel}</span>
          </div>
          <div class="mfd-sec-index-table upper">
            <div class="mfd-sec-index-table-left route">BLA</div>
            <div class="mfd-sec-index-table-right">
              <Button
                label={'IMPORT'}
                onClick={() => {}}
                buttonStyle="width: 175px;"
                idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_sec${this.props.flightPlanIndex}index_import`}
                menuItems={Subject.create([
                  {
                    label: 'ACTIVE*',
                    action: () => {
                      this.props.fmcService.master?.flightPlanInterface.secondaryCopyFromActive(
                        this.secIndex,
                        !this.props.fmcService.master.enginesWereStarted.get(),
                      );
                    },
                  },
                  {
                    label: this.secIndex === 1 ? 'SEC 2*' : 'SEC 1*',
                    action: () => {
                      this.props.fmcService.master?.flightPlanInterface.secondaryCopyFromSecondary(
                        this.secIndex === 1 ? 2 : 1,
                        this.secIndex,
                        !this.props.fmcService.master.enginesWereStarted.get(),
                      );
                    },
                  },
                  {
                    label: this.secIndex === 3 ? 'SEC 2*' : 'SEC 3*',
                    action: () => {
                      this.props.fmcService.master?.flightPlanInterface.secondaryCopyFromSecondary(
                        this.secIndex === 3 ? 2 : 3,
                        this.secIndex,
                        !this.props.fmcService.master.enginesWereStarted.get(),
                      );
                    },
                  },
                ])}
                showArrow={true}
              />
              <Button
                label={this.cpnyFplnButtonLabel}
                disabled={this.props.fmcService.master.fmgc.data.cpnyFplnUplinkInProgress}
                onClick={() =>
                  this.props.fmcService.master?.fmgc.data.cpnyFplnAvailable.get()
                    ? {}
                    : this.props.fmcService.master?.cpnyFplnRequest(this.props.flightPlanIndex)
                }
                buttonStyle="width: 175px; margin-top: 5px;"
                idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_fplnreq_sec${this.props.flightPlanIndex}`}
                menuItems={this.cpnyFplnButtonMenuItems}
                showArrow={false}
              />
              <div style="flex-grow: 1;" />
              <Button
                label={'F-PLN'}
                onClick={() => this.props.mfd.uiService.navigateTo(`${this.uriPrefix}/f-pln`)}
                buttonStyle="width: 160px; margin-top: 5px;"
                idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_sec${this.props.flightPlanIndex}index_f-pln`}
              />
              <Button
                label={'PERF'}
                disabled={this.secDoesNotExist}
                onClick={() => this.props.mfd.uiService.navigateTo(`${this.uriPrefix}/perf`)}
                buttonStyle="width: 160px; margin-top: 5px;"
                idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_sec${this.props.flightPlanIndex}index_perf`}
              />
              <Button
                label={'WIND'}
                disabled={Subject.create(true)}
                onClick={() => this.props.mfd.uiService.navigateTo(`${this.uriPrefix}/wind`)}
                buttonStyle="width: 160px; margin-top: 5px;"
                idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_sec${this.props.flightPlanIndex}index_wind`}
              />
              <Button
                label={'FUEL&LOAD'}
                disabled={this.secDoesNotExist}
                onClick={() => this.props.mfd.uiService.navigateTo(`${this.uriPrefix}/fuel-load`)}
                buttonStyle="width: 160px; margin-top: 5px;"
                idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_sec${this.props.flightPlanIndex}index_fuel-load`}
              />
              <Button
                label={'INIT'}
                onClick={() => this.props.mfd.uiService.navigateTo(`${this.uriPrefix}/init`)}
                buttonStyle="width: 160px; margin-top: 5px;"
                idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_sec${this.props.flightPlanIndex}index_init`}
              />
              <Button
                label={'WHAT IF'}
                disabled={Subject.create(true)}
                onClick={() => this.props.mfd.uiService.navigateTo(`${this.uriPrefix}/what-if`)}
                buttonStyle="width: 160px; margin-top: 5px;"
                idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_sec${this.props.flightPlanIndex}index_what-if`}
              />
            </div>
          </div>
          <div class="mfd-sec-index-table lower">
            <div class="mfd-sec-index-table-left">
              <div class="mfd-sec-index-table-lower-button-grid">
                <Button
                  label={Subject.create(
                    <div style="display: flex; flex-direction: row; justify-content: space-between;">
                      <span style="text-align: center; vertical-align: center; margin-right: 10px;">DELETE</span>
                      <span style="display: flex; align-items: center; justify-content: center;">*</span>
                    </div>,
                  )}
                  disabled={this.secDoesNotExist}
                  onClick={() => this.props.fmcService.master?.flightPlanInterface.secondaryDelete(this.secIndex)}
                  buttonStyle="padding-right: 2px;width: 160px; height: 60px;"
                  idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_sec${this.props.flightPlanIndex}index_delete`}
                />
                <div style="display: flex; flex-direction: row; justify-content: center; align-items: center;">
                  <IconButton
                    icon="double-down"
                    disabled={Subject.create(true)}
                    onClick={() => {}}
                    containerStyle="width: 60px; height: 60px; margin-right: 5px;"
                  />
                  <IconButton
                    icon="double-up"
                    disabled={Subject.create(true)}
                    onClick={() => {}}
                    containerStyle="width: 60px; height: 60px;"
                  />
                </div>
                <div style="display: flex; justify-content: flex-end; align-items: center;">
                  <Button
                    label={Subject.create(
                      <div style="display: flex; flex-direction: row; justify-content: space-between;">
                        <span style="text-align: center; vertical-align: center; margin-right: 10px;">
                          SWAP
                          <br />
                          ACTIVE
                        </span>
                        <span style="display: flex; align-items: center; justify-content: center;">*</span>
                      </div>,
                    )}
                    disabled={this.swapActiveNotAllowed}
                    onClick={() => this.props.fmcService.master?.swapActiveAndSecondaryPlan(this.secIndex)}
                    buttonStyle="color: #e68000; padding-right: 2px; width: 160px; height: 60px;"
                    idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_sec${this.props.flightPlanIndex}index_swap-active`}
                  />
                </div>
                <div />
                <div />
                <div style="display: flex; justify-content: flex-end; align-items: center;">
                  <Button
                    label={'XFR TO MAILBOX'}
                    disabled={Subject.create(true)}
                    onClick={() => {}}
                    buttonStyle="width: 160px; height: 60px; margin-top: 30px;"
                    idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_sec${this.props.flightPlanIndex}index_xfr-to-mailbox`}
                  />
                </div>
              </div>
            </div>
            <div class="mfd-sec-index-table-right">
              <div style="flex-grow: 1" />
              <div style="justify-content: flex-end; align-self: center; margin-bottom: 15px; margin-top: 75px;">
                <Button
                  label={Subject.create(
                    <div style="display: flex; flex-direction: row; justify-content: space-between;">
                      <span style="text-align: center; vertical-align: center; margin-right: 10px;">PRINT</span>
                      <span style="display: flex; align-items: center; justify-content: center;">*</span>
                    </div>,
                  )}
                  disabled={Subject.create(true)}
                  onClick={() => {}}
                  buttonStyle="padding-right: 2px; width: 160px; height: 60px; margin-top: 30px;"
                  idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_sec${this.props.flightPlanIndex}index_print`}
                />
              </div>
            </div>
          </div>
        </>
      )
    );
  }
}
