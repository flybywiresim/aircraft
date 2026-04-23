// Copyright (c) 2024-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import {
  ComponentProps,
  DisplayComponent,
  FSComponent,
  Subject,
  Subscribable,
  Vec2Math,
  VNode,
} from '@microsoft/msfs-sdk';
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
import {
  extractWindDirectionFromVector,
  extractWindSpeedFromVector,
  FlightPlanWindEntryFlags,
  formatWindMagnitude,
  formatWindTrueDegrees,
  WindEntry,
} from '@fmgc/flightplanning/data/wind';
import { A380AircraftConfig } from '@fmgc/flightplanning/A380AircraftConfig';
import { InputField } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';
import { WindAltitudeFormat, WindDirectionFormat, WindSpeedFormat } from '../common/DataEntryFormats';
import { MathUtils } from '../../../../../../../../fbw-common/src/systems/shared/src/MathUtils';

interface MfdFmsWindProps extends AbstractMfdPageProps {}

enum WindPageMenu {
  History,
  Climb,
  Cruise,
  Descent,
}

enum WindEntryData {
  Altitude,
  Direction,
  Speed,
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
  private readonly temporaryMessageAreaDisplay = this.tmpyActive.map((exists) => (exists ? 'block' : 'none'));
  private readonly tableHeaderDisplay = this.tmpyActive.map((exists) => (exists ? 'none' : 'flex'));

  // History Wind
  private static readonly NUM_HISTORY_WIND_ENTRIES = 5;
  private static readonly HISTORY_WIND_ENTRIES_ARRAY = Array.from(
    { length: MfdFmsWindPage.NUM_HISTORY_WIND_ENTRIES },
    (_, i) => i,
  );

  private readonly historyWindFlightLevels = Array.from({ length: MfdFmsWindPage.NUM_HISTORY_WIND_ENTRIES }, () =>
    Subject.create<string | null>(null),
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

  private readonly historyWindButtonVisible = Subject.create(false);

  // Climb Wind
  private static readonly CLIMB_WIND_ENTRIES_ARRAY = Array.from(
    { length: A380AircraftConfig.fpmConfig.NUM_CLIMB_WIND_LEVELS },
    (_, i) => i,
  );
  private readonly climbWindsDisabled = Subject.create(false);

  private readonly climbWindAltitudes = Array.from({ length: A380AircraftConfig.fpmConfig.NUM_CLIMB_WIND_LEVELS }, () =>
    Subject.create<number | null>(null),
  );

  private readonly climbWindDirections = Array.from(
    { length: A380AircraftConfig.fpmConfig.NUM_CLIMB_WIND_LEVELS },
    () => Subject.create<number | null>(null),
  );

  private readonly climbWindSpeeds = Array.from({ length: A380AircraftConfig.fpmConfig.NUM_CLIMB_WIND_LEVELS }, () =>
    Subject.create<number | null>(null),
  );

  private readonly climbWindEntryVisible = Array.from(
    { length: A380AircraftConfig.fpmConfig.NUM_CLIMB_WIND_LEVELS },
    () => Subject.create(true),
  );

  private readonly climbWindEntryDisabled = Array.from(
    { length: A380AircraftConfig.fpmConfig.NUM_CLIMB_WIND_LEVELS },
    () => Subject.create(false),
  );

  private readonly climbWindEntryVisibility = this.climbWindEntryVisible.map((sub) =>
    sub.map((v) => (v ? 'visible' : 'hidden')),
  );

  private readonly transitionAltitude = Subject.create<number | null>(null);
  private readonly departureElevation = Subject.create<number | null>(null);

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
      const cruiseFlightLevel = fp?.performanceData.cruiseFlightLevel.get() ?? null;
      const historyWinds = this.props.fmcService.master.getHistoryWinds(cruiseFlightLevel);
      let hasNonEmptyWind = false;
      for (let i = 0; i < MfdFmsWindPage.NUM_HISTORY_WIND_ENTRIES; i++) {
        const windEntry = historyWinds[i];
        if (windEntry) {
          hasNonEmptyWind = hasNonEmptyWind || !windEntry.isEmpty;
          this.historyWindFlightLevels[i].set((windEntry.altitude / 100).toFixed(0).padStart(3, '0'));
          const windVector = windEntry.vector;
          this.historyWindSpeeds[i].set(windEntry.isEmpty ? '\xa0---' : `/${formatWindMagnitude(windVector)}`);
          this.historyWindDirections[i].set(windEntry.isEmpty ? '---' : formatWindTrueDegrees(windVector, false));
          this.historyWindUnitsVisible[i].set(!windEntry.isEmpty);
          this.historyWindValidEntry[i].set(true);
          this.isHistoryWindCruiseFlightLevel[i].set(
            cruiseFlightLevel !== null && windEntry.altitude == cruiseFlightLevel * 100,
          );
        } else {
          this.historyWindValidEntry[i].set(false);
        }
      }
      this.historyWindButtonVisible.set(
        hasNonEmptyWind && this.props.fmcService.master.fmgc.data.flightPhase.get() === FmgcFlightPhase.Preflight,
      );
    } else if (this.selectedPageMenu === WindPageMenu.Climb) {
      this.transitionAltitude.set(fp?.performanceData.transitionAltitude.get() ?? null);
      this.departureElevation.set(fp?.originAirport?.location.alt ?? null);
      this.climbWindsDisabled.set(
        this.tmpyActive.get() ||
          (isActiveOrCopyOfActive && this.props.fmcService.master.fmgc.getFlightPhase() >= FmgcFlightPhase.Climb),
      );
      // Sort climb winds by altitude descending
      const winds = fp?.performanceData.climbWindEntries.get().sort((a, b) => b.altitude - a.altitude) ?? [];
      for (let i = 0; i < A380AircraftConfig.fpmConfig.NUM_CLIMB_WIND_LEVELS; i++) {
        const windEntry = winds[i];
        if (windEntry) {
          this.climbWindEntryDisabled[i].set((windEntry.flags & FlightPlanWindEntryFlags.InsertedFromHistory) > 0);
          this.climbWindDirections[i].set(extractWindDirectionFromVector(windEntry.vector));
          this.climbWindSpeeds[i].set(extractWindSpeedFromVector(windEntry.vector));
          this.climbWindAltitudes[i].set(windEntry.altitude);
        } else {
          this.climbWindEntryDisabled[i].set(false);
        }
      }
      this.updateClimbWindEntriesVisibility();
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
      ...this.historyWindFlightLevelLabel,
      ...this.historyWindsUnitVisiblity,
      ...this.historyWindEntryVisibility,
      this.temporaryMessageAreaDisplay,
      this.tableHeaderDisplay,
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

  private onClimbEntryWindModified(index: number, value: number | null, dataType: WindEntryData) {
    const oldAltitude = this.climbWindAltitudes[index].get();
    if (value === null && dataType === WindEntryData.Altitude) {
      const existsInFlightPlan =
        oldAltitude !== null &&
        this.climbWindDirections[index].get() !== null &&
        this.climbWindSpeeds[index].get() !== null;
      if (existsInFlightPlan) {
        this.props.fmcService.master.flightPlanInterface.setClimbWindEntry(
          oldAltitude,
          null,
          this.loadedFlightPlanIndex.get(),
        );
      }
      // Shift subsequent rows up to fill the gap, then null out the last row.
      for (let i = index; i < A380AircraftConfig.fpmConfig.NUM_CLIMB_WIND_LEVELS - 1; i++) {
        this.climbWindAltitudes[i].set(this.climbWindAltitudes[i + 1].get());
        this.climbWindDirections[i].set(this.climbWindDirections[i + 1].get());
        this.climbWindSpeeds[i].set(this.climbWindSpeeds[i + 1].get());
      }
      this.climbWindAltitudes[A380AircraftConfig.fpmConfig.NUM_CLIMB_WIND_LEVELS - 1].set(null);
      this.climbWindDirections[A380AircraftConfig.fpmConfig.NUM_CLIMB_WIND_LEVELS - 1].set(null);
      this.climbWindSpeeds[A380AircraftConfig.fpmConfig.NUM_CLIMB_WIND_LEVELS - 1].set(null);
      this.updateClimbWindEntriesVisibility();
    } else {
      const currentAlt = dataType === WindEntryData.Altitude ? value : oldAltitude;
      const currentDir = dataType === WindEntryData.Direction ? value : this.climbWindDirections[index].get();
      const currentSpeed = dataType === WindEntryData.Speed ? value : this.climbWindSpeeds[index].get();
      if (currentAlt !== null && currentDir != null && currentSpeed != null) {
        const entry = this.getWindEntryFromValues(currentAlt, currentDir, currentSpeed);
        // Use oldAltitude as the lookup key so setClimbWindEntry finds and replaces the existing
        // entry. If there is no existing entry (new row), fall back to currentAlt so a new entry
        // is added.
        this.props.fmcService.master.flightPlanInterface.setClimbWindEntry(
          oldAltitude ?? currentAlt,
          entry,
          this.loadedFlightPlanIndex.get(),
        );
      } else {
        if (dataType === WindEntryData.Altitude) {
          this.climbWindAltitudes[index].set(value);
          // Altitude subject changed — update row visibility immediately.
          this.updateClimbWindEntriesVisibility();
        } else if (dataType === WindEntryData.Direction) {
          this.climbWindDirections[index].set(value);
        } else if (dataType === WindEntryData.Speed) {
          this.climbWindSpeeds[index].set(value);
        }
      }
    }
  }

  /**
   * Updates climb wind entry visibility based upon whether the previous entry has an altitude.
   * The first row is always displayed.
   */
  private updateClimbWindEntriesVisibility() {
    for (let i = 0; i < A380AircraftConfig.fpmConfig.NUM_CLIMB_WIND_LEVELS; i++) {
      this.climbWindEntryVisible[i].set(i === 0 || this.climbWindAltitudes[i - 1].get() !== null);
    }
  }

  private getWindEntryFromValues(altitude: number, direction: number, speed: number): WindEntry {
    return {
      altitude: altitude,
      vector: Vec2Math.setFromPolar(speed, direction * MathUtils.DEGREES_TO_RADIANS, Vec2Math.create()),
    };
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
                <MfdFmsWindPageTableHeader
                  headerDisplay={this.tableHeaderDisplay}
                  messageAreaDisplay={this.temporaryMessageAreaDisplay}
                  isHistoryPage={true}
                />
                {MfdFmsWindPage.HISTORY_WIND_ENTRIES_ARRAY.map((value) => (
                  <div class={{ 'mfd-fms-wind-page-table-row': true, history: true, entry: true, first: value === 0 }}>
                    <div
                      style={{
                        visibility: this.historyWindEntryVisibility[value],
                        display: 'flex',
                        'flex-direction': 'row',
                      }}
                    >
                      <div class="mfd-fms-wind-history-fl-entry">
                        <span class="mfd-label bigger">{this.historyWindFlightLevelLabel[value]}</span>
                        <span class="mfd-label-unit bigger">FL</span>
                        <span class="mfd-label green bigger">{this.historyWindFlightLevels[value]}</span>
                      </div>
                      <div class="mfd-fms-wind-history-wind-entry">
                        <span class="mfd-label green">{this.historyWindDirections[value]}</span>
                        <span class="mfd-label unit" style={{ visibility: this.historyWindsUnitVisiblity[value] }}>
                          °
                        </span>
                        <span class="mfd-label green">{this.historyWindSpeeds[value]}</span>
                        <span class="mfd-label unit" style={{ visibility: this.historyWindsUnitVisiblity[value] }}>
                          KT
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div class="history-wind-button-container">
                <Button
                  label={'INSERT\n HISTORY WIND*'}
                  onClick={this.insertHistoryWind.bind(this)}
                  visible={this.historyWindButtonVisible}
                  disabled={this.tmpyActive}
                />
              </div>
            </TopTabNavigatorPage>

            <TopTabNavigatorPage>
              {/* CLIMB */}
              <div class="mfd-fms-wind-page-container">
                <div class="mfd-fms-wind-page-title-container">
                  <span class="mfd-label bigger">{this.displayedWindHeader}</span>
                </div>
                <MfdFmsWindPageTableHeader
                  headerDisplay={this.tableHeaderDisplay}
                  messageAreaDisplay={this.temporaryMessageAreaDisplay}
                />
                {MfdFmsWindPage.CLIMB_WIND_ENTRIES_ARRAY.map((value) => (
                  <div class={{ 'mfd-fms-wind-page-table-row': true, entry: true, first: value === 0 }}>
                    <div
                      style={{
                        visibility: this.climbWindEntryVisibility[value],
                        display: 'flex',
                        'flex-direction': 'row',
                      }}
                    >
                      <div class="mfd-fms-wind-climb-altitude-entry">
                        <InputField
                          inactive={this.climbWindEntryDisabled[value]}
                          disabled={this.climbWindsDisabled}
                          onModified={(v) => {
                            this.onClimbEntryWindModified(value, v, WindEntryData.Altitude);
                          }}
                          errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
                          hEventConsumer={this.props.mfd.hEventConsumer}
                          interactionMode={this.props.mfd.interactionMode}
                          dataEntryFormat={
                            new WindAltitudeFormat(this.transitionAltitude, true, this.departureElevation)
                          }
                          value={this.climbWindAltitudes[value]}
                          canBeCleared={true}
                        ></InputField>
                      </div>
                      <div class="mfd-fms-wind-climb-wind-entry-container">
                        <InputField
                          inactive={this.climbWindEntryDisabled[value]}
                          disabled={this.climbWindsDisabled}
                          onModified={(v) => {
                            this.onClimbEntryWindModified(value, v, WindEntryData.Speed);
                          }}
                          errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
                          hEventConsumer={this.props.mfd.hEventConsumer}
                          interactionMode={this.props.mfd.interactionMode}
                          dataEntryFormat={new WindSpeedFormat()}
                          value={this.climbWindSpeeds[value]}
                          canBeCleared={false}
                        ></InputField>
                        <InputField
                          inactive={this.climbWindEntryDisabled[value]}
                          disabled={this.climbWindsDisabled}
                          onModified={(v) => {
                            this.onClimbEntryWindModified(value, v, WindEntryData.Direction);
                          }}
                          errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
                          hEventConsumer={this.props.mfd.hEventConsumer}
                          interactionMode={this.props.mfd.interactionMode}
                          dataEntryFormat={new WindDirectionFormat()}
                          value={this.climbWindDirections[value]}
                          canBeCleared={false}
                        ></InputField>
                      </div>
                    </div>
                  </div>
                ))}
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

export interface MfdFmsWindPageTableHeaderProps extends ComponentProps {
  messageAreaDisplay: Subscribable<string>;
  headerDisplay: Subscribable<string>;
  isHistoryPage?: boolean;
}

export class MfdFmsWindPageTableHeader extends DisplayComponent<MfdFmsWindPageTableHeaderProps> {
  public render(): VNode {
    return (
      <div>
        <div
          class={{ 'mfd-fms-wind-page-table-row': true, header: true, history: this.props.isHistoryPage ?? false }}
          style={{ display: this.props.headerDisplay }}
        >
          <span class="mfd-label bigger">ALT</span>
          <span class="mfd-label bigger">T.WIND</span>
        </div>
        <div
          class="mfd-fms-wind-page-table-message-area mfd-value amber"
          style={{ display: this.props.messageAreaDisplay }}
        >
          WIND ENTRY NOT ALLOWED: TMPY F-PLN EXISTING
        </div>
      </div>
    );
  }
}
