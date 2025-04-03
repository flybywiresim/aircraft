import { ArraySubject, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { WaypointFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { InputField } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/TopTabNavigator';

import './MfdFmsDataWaypoint.scss';
import { ConditionalComponent } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/ConditionalComponent';
import { coordinateToString } from '@flybywiresim/fbw-sdk';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { DropdownMenu } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/DropdownMenu';
import { IconButton } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/IconButton';
import { PilotWaypoint } from '@fmgc/flightplanning/DataManager';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';

interface MfdFmsDataWaypointProps extends AbstractMfdPageProps {}

export class MfdFmsDataWaypoint extends FmsPage<MfdFmsDataWaypointProps> {
  private readonly selectedPageIndex = Subject.create<number>(0);
  private readonly pilotStoredWaypointsIndex = Subject.create<number | null>(0);

  private readonly waypointIdent = Subject.create<string | null>(null);

  private readonly waypointCoords = Subject.create('');

  private readonly pilotStoredWaypointsList = ArraySubject.create<PilotWaypoint>([]);
  private readonly pilotStoredWaypointNames = ArraySubject.create<string>([]);

  private readonly disabledScrollLeft = Subject.create(true);
  private readonly disabledScrollRight = Subject.create(false);

  private readonly db = NavigationDatabaseService.activeDatabase;

  private readonly isWaypointDataVisible = Subject.create<boolean>(false);
  private readonly anyPilotStoredWaypoints = Subject.create<boolean>(false);

  protected onNewData(): void {
    const pilotStoredWaypoints = this.props.fmcService.master?.getDataManager()?.getAllStoredWaypoints() ?? [];

    this.anyPilotStoredWaypoints.set(pilotStoredWaypoints.length > 0);
    this.pilotStoredWaypointsList.set(pilotStoredWaypoints);
  }

  private async loadWaypoint(ident: string | null) {
    if (ident) {
      const waypoint = await this.db.searchWaypoint(ident);
      const selectedWaypoint = await this.props.mfd.deduplicateFacilities(waypoint);

      if (selectedWaypoint) {
        const waypointCoords = coordinateToString(selectedWaypoint.location.lat, selectedWaypoint.location.long, false);
        this.waypointCoords.set(waypointCoords);
      }
    }
  }

  private scrollStoredWaypointButtons(direction: 'left' | 'right'): void {
    const currentIndex = this.pilotStoredWaypointsIndex.get() ?? 0;

    this.pilotStoredWaypointsIndex.set(currentIndex + (direction === 'left' ? -1 : 1));
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.waypointIdent.sub((ident: string | null) => {
      if (ident) {
        this.loadWaypoint(ident);
        this.isWaypointDataVisible.set(true);
      } else {
        this.isWaypointDataVisible.set(false);
      }
    });

    this.subs.push(
      this.props.mfd.uiService.activeUri.sub((val) => {
        if (val.extra === 'database') {
          this.selectedPageIndex.set(0);
        } else if (val.extra === 'pilot-stored') {
          this.selectedPageIndex.set(1);
        }
      }, true),
    );
  }

  public render(): VNode {
    return (
      <>
        {super.render()}
        <div class="mfd-page-container">
          <TopTabNavigator
            pageTitles={Subject.create(['DATABASE WPTs', 'PILOT STORED WPTs'])}
            selectedPageIndex={this.selectedPageIndex}
            pageChangeCallback={(val) => {
              this.selectedPageIndex.set(val);
            }}
            selectedTabTextColor="white"
            tabBarSlantedEdgeAngle={25}
          >
            <TopTabNavigatorPage containerStyle="height: 680px;">
              <div class="mfd-data-waypoint-input-container">
                <div class="mfd-label" style="position: relative; right: 65px">
                  WPT IDENT
                </div>
                <InputField<string>
                  dataEntryFormat={new WaypointFormat()}
                  dataHandlerDuringValidation={async (v) => this.waypointIdent.set(v)}
                  mandatory={Subject.create(true)}
                  canBeCleared={Subject.create(false)}
                  value={this.waypointIdent}
                  alignText="center"
                  errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                  hEventConsumer={this.props.mfd.hEventConsumer}
                  interactionMode={this.props.mfd.interactionMode}
                  containerStyle="position: relative; right: 60px;"
                />
              </div>

              <div class="mfd-data-waypoint-info-container">
                <ConditionalComponent
                  condition={this.isWaypointDataVisible}
                  componentIfTrue={
                    <div class="mfd-data-waypoint-info">
                      <div class="mfd-data-latlong-text">
                        <div class="mfd-label" style="position: relative; right: 75px;">
                          LAT
                        </div>
                        <div class="mfd-label" style="position: relative; left: 75px;">
                          LONG
                        </div>
                      </div>
                      <div class="mfd-value bigger mfd-data-airport-coords">{this.waypointCoords}</div>
                    </div>
                  }
                  componentIfFalse={<></>}
                />
              </div>
            </TopTabNavigatorPage>
            <TopTabNavigatorPage containerStyle="height: 680px;">
              <ConditionalComponent
                condition={this.anyPilotStoredWaypoints}
                componentIfTrue={
                  <div class="mfd-data-waypoint-list-container">
                    <div class="mfd-label" style="align-self:center; position: relative; top: 45px;">
                      WPT IDENT
                    </div>
                    <DropdownMenu
                      values={this.pilotStoredWaypointNames}
                      selectedIndex={this.pilotStoredWaypointsIndex}
                      freeTextAllowed={false}
                      idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_dataWaypointListDropdown`}
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                    />
                    <div class="mfd-data-waypoint-stored-list-scroll-buttons">
                      <IconButton
                        icon="double-left"
                        onClick={() => this.scrollStoredWaypointButtons('left')}
                        disabled={this.disabledScrollLeft}
                        containerStyle="width: 50px; height: 50px; margin-right: 5px"
                      />
                      <IconButton
                        icon="double-right"
                        onClick={() => this.scrollStoredWaypointButtons('right')}
                        disabled={this.disabledScrollRight}
                        containerStyle="width: 50px; height: 50px;"
                      />
                    </div>
                    <div class="mfd-label">{this.pilotStoredWaypointsList.length.toString().padStart(2, '0')}</div>
                    <div class="mfd-data-waypoint-stored-ll-display">
                      <div class="mfd-lable">LAT</div>
                      <div class="mfd-lable">LAT</div>
                    </div>
                  </div>
                }
                componentIfFalse={
                  <div class="mfd-data-waypoint-stored-container">
                    <div class="mfd-data-waypoint-stored-ident-row">
                      <div class="mfd-label" style="position: relative;">
                        NO PILOT STORED WPT
                      </div>
                    </div>
                  </div>
                }
              ></ConditionalComponent>
            </TopTabNavigatorPage>
          </TopTabNavigator>
          <div style="flex-grow: 1;" />
          {/* fill space vertically */}
        </div>
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
