import { AbstractMfdPageProps, MfdDisplayInterface } from 'instruments/src/MFD/MFD';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/TopTabNavigator';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';

import { EventBus, FSComponent, MappedSubject, MappedSubscribable, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdFmsSecIndex.scss';
import { FlightPlanChangeNotifier } from '@fmgc/flightplanning/sync/FlightPlanChangeNotifier';
import { Button, ButtonMenuItem } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { FmsDisplayInterface } from '@fmgc/flightplanning/interface/FmsDisplayInterface';
import { FmcServiceInterface } from '../../../FMC/FmcServiceInterface';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';

interface MfdFmsSecIndexProps extends AbstractMfdPageProps {}

export class MfdFmsSecIndex extends FmsPage<MfdFmsSecIndexProps> {
  private readonly secSelectedPageIndex = Subject.create(0);

  private readonly flightPlanChangeNotifier = new FlightPlanChangeNotifier(this.props.bus);

  protected onNewData() {
    if (!this.props.fmcService.master) {
      return;
    }
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
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
                bus={this.props.bus}
                mfd={this.props.mfd}
                fmcService={this.props.fmcService}
                flightPlanIndex={FlightPlanIndex.FirstSecondary}
              />
            </TopTabNavigatorPage>
            <TopTabNavigatorPage>
              {/* SEC 2 */}
              <MfdFmsSecIndexTab
                bus={this.props.bus}
                mfd={this.props.mfd}
                fmcService={this.props.fmcService}
                flightPlanIndex={FlightPlanIndex.FirstSecondary + 1}
              />
            </TopTabNavigatorPage>
            <TopTabNavigatorPage>
              {/* SEC 3 */}
              <MfdFmsSecIndexTab
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
  bus: EventBus;
  mfd: FmsDisplayInterface & MfdDisplayInterface;
  fmcService: FmcServiceInterface;
  flightPlanIndex: FlightPlanIndex;
}

export class MfdFmsSecIndexTab extends DestroyableComponent<MfdFmsSecIndexTabProps> {
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

    this.subscriptions.push(this.cpnyFplnButtonLabel, this.cpnyFplnButtonMenuItems);
  }

  render(): VNode | null {
    return (
      this.props.fmcService.master && (
        <>
          <div class="mfd-sec-index-title-container">
            <span class="mfd-sec-index-title-line1">LFBO / WSSS</span>
            <span class="mfd-sec-index-title-line2">CREATED 09:52 (IMPORT ACTIVE)</span>
          </div>
          <div class="mfd-sec-index-table">
            <div class="mfd-sec-index-table-left">BLA</div>
            <div class="mfd-sec-index-table-right">
              <Button
                label={this.cpnyFplnButtonLabel}
                disabled={this.props.fmcService.master.fmgc.data.cpnyFplnUplinkInProgress}
                onClick={() =>
                  this.props.fmcService.master?.fmgc.data.cpnyFplnAvailable.get()
                    ? {}
                    : this.props.fmcService.master?.cpnyFplnRequest(this.props.flightPlanIndex)
                }
                buttonStyle="width: 175px;"
                idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_fplnreq_sec${this.props.flightPlanIndex}`}
                menuItems={this.cpnyFplnButtonMenuItems}
                showArrow={false}
              />
            </div>
          </div>
        </>
      )
    );
  }
}
