import { FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { WaypointFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MFD/pages/common/TopTabNavigator';

import './MfdFmsDataWaypoint.scss';
import { ConditionalComponent } from 'instruments/src/MFD/pages/common/ConditionalComponent';
import { coordinateToString } from '@flybywiresim/fbw-sdk';
import { NavigationDatabaseService } from '@fmgc/index';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

interface MfdFmsDataWaypointProps extends AbstractMfdPageProps {}

export class MfdFmsDataWaypoint extends FmsPage<MfdFmsDataWaypointProps> {
  private readonly selectedPageIndex = Subject.create<number>(0);

  private readonly waypointIdent = Subject.create<string | null>(null);

  private readonly waypointCoords = Subject.create('');

  private readonly db = NavigationDatabaseService.activeDatabase;

  private isWaypointDataVisible = Subject.create<boolean>(false);

  protected onNewData(): void {}

  private async loadWaypoint(ident: string | null) {
    if (ident) {
      const waypoint = await this.db.searchWaypoint(ident);
      const selectedWaypoint = await this.props.mfd.deduplicateFacilities(waypoint);

      if (selectedWaypoint) {
        const waypointCoords = coordinateToString(selectedWaypoint.location.lat, selectedWaypoint.location.long, false);

        if (selectedWaypoint.location) {
          this.waypointCoords.set(waypointCoords);
        }
      }
    }
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
                  dataHandlerDuringValidation={async (v) => {
                    this.waypointIdent.set(v);
                  }}
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
            <TopTabNavigatorPage></TopTabNavigatorPage>
          </TopTabNavigator>
          <div style="flex-grow: 1;" />
          {/* fill space vertically */}
        </div>
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
