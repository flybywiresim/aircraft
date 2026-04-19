// Copyright (c) 2024-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
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
import { formatWindMagnitude, formatWindTrueDegrees } from '@fmgc/flightplanning/data/wind';

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
  private readonly temporaryExists = Subject.create(false);

  // History Wind
  private static readonly NUM_HISTORY_WIND_ENTRIES = 5;
  private static readonly HISTORY_WIND_ENTRIES_ARRAY = Array.from(
    { length: MfdFmsWindPage.NUM_HISTORY_WIND_ENTRIES },
    (_, i) => i,
  );
  private readonly inPreFlightPhase = Subject.create(false);
  private readonly historyWindFlightLevels = Array.from({ length: MfdFmsWindPage.NUM_HISTORY_WIND_ENTRIES }, () =>
    Subject.create<number | null>(null),
  );
  private readonly historyWindDirections = Array.from({ length: MfdFmsWindPage.NUM_HISTORY_WIND_ENTRIES }, () =>
    Subject.create<string>('---'),
  );
  private readonly historyWindSpeeds = Array.from({ length: MfdFmsWindPage.NUM_HISTORY_WIND_ENTRIES }, () =>
    Subject.create<string>('/---'),
  );
  private readonly isHistoryWindCruiseFlightLevel = Array.from(
    { length: MfdFmsWindPage.NUM_HISTORY_WIND_ENTRIES },
    () => Subject.create(false),
  );
  private readonly historyWindUnitsVisible = Array.from({ length: MfdFmsWindPage.NUM_HISTORY_WIND_ENTRIES }, () =>
    Subject.create(false),
  );
  private readonly historyWindValidEntry = Array.from({ length: MfdFmsWindPage.NUM_HISTORY_WIND_ENTRIES }, () =>
    Subject.create(false),
  );
  private readonly historyWindFlightLevelLabel = this.isHistoryWindCruiseFlightLevel.map((v) =>
    v.map((isCruise) => (isCruise ? 'CRZ' : '\xa0'.repeat(3))),
  );
  private readonly historyWindsUnitVisiblity = this.historyWindUnitsVisible.map((sub) =>
    sub.map((v) => (v ? 'visible' : 'hidden')),
  );

  private readonly historyWindEntryVisibility = this.historyWindValidEntry.map((sub) =>
    sub.map((v) => (v ? 'visible' : 'hidden')),
  );

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
    this.temporaryExists.set(loadedFlightPlanIndex === FlightPlanIndex.Temporary);
    // History wind methods
    if (this.selectedPageMenu === WindPageMenu.History) {
      this.inPreFlightPhase.set(this.props.fmcService.master.fmgc.data.flightPhase.get() === FmgcFlightPhase.Preflight);
      const cruiseFlightLevel = fp?.performanceData.cruiseFlightLevel.get() ?? null;
      const historyWinds = this.props.fmcService.master.getHistoryWinds(cruiseFlightLevel);
      for (let i = 0; i < MfdFmsWindPage.NUM_HISTORY_WIND_ENTRIES; i++) {
        const windEntry = historyWinds[i];
        if (windEntry) {
          this.historyWindFlightLevels[i].set(windEntry.altitude / 100);
          const windVector = windEntry.vector;
          this.historyWindSpeeds[i].set(windVector ? `/${formatWindMagnitude(windVector)}` : '/---');
          this.historyWindDirections[i].set(windVector ? formatWindTrueDegrees(windVector, false) : '---');
          this.historyWindUnitsVisible[i].set(windVector !== null);
          this.historyWindValidEntry[i].set(true);
          this.isHistoryWindCruiseFlightLevel[i].set(
            cruiseFlightLevel !== null && windEntry.altitude == cruiseFlightLevel * 100,
          );
        } else {
          this.historyWindValidEntry[i].set(false);
        }
      }
      this.wasSecPreviouslyActive =
        this.loadedFlightPlanIndex.get() >= FlightPlanIndex.FirstSecondary ? true : this.wasSecPreviouslyActive;
    }
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
      ...this.historyWindFlightLevelLabel,
      ...this.historyWindsUnitVisiblity,
      ...this.historyWindEntryVisibility,
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
      case WindPageMenu.Climb:
        this.displayedWindHeader.set('CLB WIND');
        break;
      case WindPageMenu.Cruise:
        this.displayedWindHeader.set('CRZ WIND');
        break;
      case WindPageMenu.Descent:
        this.displayedWindHeader.set('DES WIND');
        break;
      default:
        this.displayedWindHeader.set('');
    }
  }

  private insertHistoryWind() {
    const success = this.props.fmcService.master.insertHistoryWinds();
    if (success) {
      this.setSelectedPageIndex(WindPageMenu.Climb);
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
                <MfdFmsWindPageTableHeader />
                {MfdFmsWindPage.HISTORY_WIND_ENTRIES_ARRAY.map((value) => (
                  <div class="mfd-fms-wind-page-table-row">
                    <div style={{ visibility: this.historyWindEntryVisibility[value] }}>
                      <div class="mfd-fms-wind-history-fl-entry">
                        <span class="mfd-label">{this.historyWindFlightLevelLabel[value]}</span>
                        <div class="mfd-label-value-container">
                          <span class="mfd-label unit">FL</span>
                          <span class="mfd-label green">{this.historyWindFlightLevels[value]}</span>
                        </div>
                      </div>
                      <div class="mfd-fms-wind-history-wind-entry">
                        <div class="mfd-label-value-container">
                          <span class="mfd-label green">{this.historyWindDirections[value]}</span>
                          <span class="mfd-label unit" style={{ visibility: this.historyWindsUnitVisiblity[value] }}>
                            °
                          </span>
                        </div>
                        <div class="mfd-label-value-container">
                          <span class="mfd-label green">/{this.historyWindSpeeds[value]}</span>
                          <span class="mfd-label unit" style={{ visibility: this.historyWindsUnitVisiblity[value] }}>
                            KT
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div class="history-wind-button-container">
                <Button
                  label={'INSERT\n HISTORY WIND*'}
                  onClick={this.insertHistoryWind}
                  visible={this.inPreFlightPhase}
                />
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
