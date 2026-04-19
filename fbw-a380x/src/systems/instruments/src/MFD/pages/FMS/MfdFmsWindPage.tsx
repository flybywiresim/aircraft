// Copyright (c) 2024-2026 FlyByWire Simulations
//
import { ComponentProps, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from '../../MFD';
import { FmsPage } from '../common/FmsPage';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/TopTabNavigator';
import { Footer } from '../common/Footer';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { showReturnButtonUriExtra } from '../../shared/utils';
import { FmgcFlightPhase } from '@shared/flightphase';
import { isLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';
import './MfdFmsWindPage.scss';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';

// SPDX-License-Identifier: GPL-3.0
interface MfdFmsWindProps extends AbstractMfdPageProps {}

enum WindPageMenu {
  History,
  Climb,
  Cruise,
  Descent,
}

export class MfdFmsWindPage extends FmsPage<MfdFmsWindProps> {
  private static readonly pageTitlesActiveFpln = ['HISTORY', 'CLB', 'CRZ', 'DES'];
  private static readonly pageTitlesSecondaryFpln = ['CLB', 'CRZ', 'DES'];

  // General Navigation
  private readonly pageTitles = Subject.create(MfdFmsWindPage.pageTitlesActiveFpln);
  private selectedPageMenu = WindPageMenu.Climb;
  /* Shifted by one when on secondary flight plan. */
  private readonly selectedTabIndex = Subject.create(0);
  private wasSecPreviouslyActive = false;
  private readonly returnButtonVisible = Subject.create(true);
  private readonly fpIsActiveOrCopyOfActive = Subject.create(false);

  private readonly displayedWindHeader = Subject.create('');

  // History Wind
  private readonly historyWindDisabled = Subject.create(false);
  private readonly historyWindButtonVisiblity = this.historyWindDisabled.map((v) => (v ? 'hidden' : 'visible'));

  // Climb Wind

  // Cruise Wind
  private readonly selectedWaypointLegIndex = Subject.create<number | null>(null);

  // Descent Wind

  protected onNewData(): void {
    this.updatePage();
  }

  private updatePage() {
    const loadedFlightPlanIndex = this.loadedFlightPlanIndex.get();
    // If we switched from a SEC to active, recompute navigation and enable history again;
    if (this.wasSecPreviouslyActive && loadedFlightPlanIndex < FlightPlanIndex.FirstSecondary) {
      this.pageTitles.set(MfdFmsWindPage.pageTitlesActiveFpln);
      this.selectedTabIndex.set(this.selectedTabIndex.get() + 1);
    }
    const hasFP = this.props.fmcService.master.flightPlanInterface.has(loadedFlightPlanIndex);
    const fp = hasFP ? this.props.fmcService.master.flightPlanInterface.get(loadedFlightPlanIndex) : null;
    const isActiveOrCopyOfActive = fp ? fp.isActiveOrCopiedFromActive() : false;
    this.fpIsActiveOrCopyOfActive.set(isActiveOrCopyOfActive);
    // History wind methods
    if (this.selectedPageMenu === WindPageMenu.History) {
      this.historyWindDisabled.set(
        this.props.fmcService.master.fmgc.data.flightPhase.get() >= FmgcFlightPhase.Preflight,
      );
    }
    this.wasSecPreviouslyActive =
      this.loadedFlightPlanIndex.get() >= FlightPlanIndex.FirstSecondary ? true : this.wasSecPreviouslyActive;
  }

  destroy() {
    super.destroy();
  }

  public onAfterRender(node: VNode) {
    super.onAfterRender(node);
    const extra = this.props.mfd.uiService.activeUri.get().extra;
    this.returnButtonVisible.set(extra?.includes(showReturnButtonUriExtra) ?? false);
    // Check if the uri contains a waypoint reference (return/wptIdx).
    const extraParts = extra?.split('/');
    if (extraParts && extraParts.length == 2) {
      const wptIdx = parseInt(extraParts[1]);
      if (!Number.isNaN(wptIdx)) {
        this.selectedWaypointLegIndex.set(wptIdx);
      }
    }
    const fpIndex = this.loadedFlightPlanIndex.get();
    if (fpIndex >= FlightPlanIndex.FirstSecondary) {
      this.pageTitles.set(MfdFmsWindPage.pageTitlesSecondaryFpln);
    }
    this.fpIsActiveOrCopyOfActive.set(
      this.props.fmcService.master.flightPlanInterface.has(fpIndex)
        ? this.props.fmcService.master.flightPlanInterface.get(fpIndex).isActiveOrCopiedFromActive()
        : false,
    );
    this.automaticallySelectTab();
    this.subs.push(
      this.props.fmcService.master.fmgc.data.flightPhase.sub((phase) => {
        this.automaticallySelectTabByFlightPhase(phase);
      }),
      this.selectedTabIndex.sub((v) => {
        if (this.loadedFlightPlanIndex.get() >= FlightPlanIndex.FirstSecondary) {
          // History is not available on secondary so we need to skip it.
          this.selectedPageMenu = Math.min(v + 1, WindPageMenu.Descent);
        } else {
          this.selectedPageMenu = v;
        }
        this.setWindHeaderBasedOnMenu();
        this.updatePage();
      }),
    );
  }

  private automaticallySelectTab() {
    const wptIdx = this.selectedWaypointLegIndex.get();
    let page: WindPageMenu | null = null;
    if (this.loadedFlightPlan && wptIdx !== null) {
      const leg = this.props.fmcService.master.flightPlanInterface
        .get(this.loadedFlightPlanIndex.get())
        .elementAt(wptIdx);
      if (leg && isLeg(leg)) {
        switch (leg.segment.class) {
          case SegmentClass.Departure:
            page = WindPageMenu.Climb;
            break;
          case SegmentClass.Enroute:
            page = WindPageMenu.Cruise;
            break;
          case SegmentClass.Arrival:
            page = WindPageMenu.Descent;
            break;
        }
      }
    }
    if (page === null) {
      this.automaticallySelectTabByFlightPhase(this.props.fmcService.master.fmgc.getFlightPhase());
    } else {
      this.setSelectedPageIndex(page);
    }
  }

  private automaticallySelectTabByFlightPhase(phase: FmgcFlightPhase) {
    if (this.fpIsActiveOrCopyOfActive.get()) {
      switch (phase) {
        case FmgcFlightPhase.Preflight:
        case FmgcFlightPhase.Done:
        case FmgcFlightPhase.Climb:
          this.setSelectedPageIndex(WindPageMenu.Climb);
          break;
        case FmgcFlightPhase.Cruise:
          this.setSelectedPageIndex(WindPageMenu.Cruise);
          break;
        default:
          this.setSelectedPageIndex(WindPageMenu.Descent);
          break;
      }
    } else {
      this.setSelectedPageIndex(WindPageMenu.Climb); //TODO What should we select in this case?
    }
  }

  private setSelectedPageIndex(menu: WindPageMenu) {
    if (this.loadedFlightPlanIndex.get() >= FlightPlanIndex.FirstSecondary) {
      // History is not available on secondary so we need to skip it.
      this.selectedTabIndex.set(Math.max(menu - 1, WindPageMenu.Climb));
    } else {
      this.selectedTabIndex.set(menu);
    }
  }

  private setWindHeaderBasedOnMenu() {
    switch (this.selectedPageMenu) {
      case WindPageMenu.History:
        this.displayedWindHeader.set('HIS WIND');
        break;
      case WindPageMenu.Climb:
        this.displayedWindHeader.set('CLB WIND');
        break;
      case WindPageMenu.Cruise:
        this.displayedWindHeader.set('CRZ WIND');
        break;
      case WindPageMenu.Descent:
        this.displayedWindHeader.set('DES WIND');
        break;
    }
  }

  public render(): VNode {
    return (
      <>
        {super.render()}
        {/* begin page content */}
        <div class="mfd-page-container">
          <div style="height: 15px;" />
          <TopTabNavigator pageTitles={this.pageTitles} selectedPageIndex={this.selectedTabIndex}>
            <TopTabNavigatorPage>
              {/* HISTORY */}
              <div class="mfd-fms-wind-page-container">
                <div class="mfd-fms-wind-page-title-container">
                  <span class="mfd-label bigger">{this.displayedWindHeader}</span>
                </div>
                <MfdFmsWindPageTableHeader></MfdFmsWindPageTableHeader>
              </div>
            </TopTabNavigatorPage>
          </TopTabNavigator>

          <div style="flex-grow: 1;" />
          {/* fill space vertically */}
          <div class="fr">
            <Button
              label="RETURN"
              onClick={() => this.props.mfd.uiService.navigateTo('back')}
              buttonStyle="margin-right: 5px; width:150px;"
              visible={this.returnButtonVisible}
            />
          </div>
        </div>
        <Footer
          bus={this.props.bus}
          mfd={this.props.mfd}
          fmcService={this.props.fmcService}
          flightPlanInterface={this.props.fmcService.master.flightPlanInterface}
        />
      </>
    );
  }
}
export class MfdFmsWindPageTableHeader extends DisplayComponent<ComponentProps> {
  public render(): VNode {
    return (
      <div class="mfd-fms-wind-page-table-row header">
        <span class="mfd-label bigger">ALT</span>
        <span class="mfd-label bigger">T.WIND</span>
      </div>
    );
  }
}
