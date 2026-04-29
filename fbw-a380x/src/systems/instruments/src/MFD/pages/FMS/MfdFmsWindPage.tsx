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
  FlightPlanWindEntry,
  FlightPlanWindEntryFlags,
  formatWindMagnitude,
  formatWindTrueDegrees,
  WindEntry,
} from '@fmgc/flightplanning/data/wind';
import { A380AircraftConfig } from '@fmgc/flightplanning/A380AircraftConfig';
import { InputField } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';
import { WindAltitudeFormat, WindDirectionFormat, WindSpeedFormat } from '../common/DataEntryFormats';
import { MathUtils } from '../../../../../../../../fbw-common/src/systems/shared/src/MathUtils';
import { CpnyWindRequestButton } from './CpnyWindButtonUtils';
import { FpmConfigs } from '@fmgc/flightplanning/FpmConfig';

interface MfdFmsWindProps extends AbstractMfdPageProps {}

enum WindSubPageMenu {
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

interface WindDisplayEntry {
  altitude: number | null;
  direction: number | null;
  speed: number | null;
  enteredByPilot: boolean;
}

export class MfdFmsWindPage extends FmsPage<MfdFmsWindProps> {
  private static readonly pageTitlesActiveFpln = ['HISTORY', 'CLB', 'CRZ', 'DES'];
  private static readonly pageTitlesSecondaryFpln = ['CLB', 'CRZ', 'DES'];

  // General Navigation
  private readonly pageTitles = Subject.create(MfdFmsWindPage.pageTitlesActiveFpln);
  private readonly selectedSubPage = Subject.create(WindSubPageMenu.Climb);
  /* Shifted by one when on secondary flight plan. */
  private readonly selectedTabIndex = Subject.create(0);
  private wasSecPreviouslyActive = false;
  private readonly returnButtonVisible = Subject.create(true);
  private readonly fpIsActiveOrCopyOfActive = Subject.create(false);
  private readonly displayedWindHeader = this.selectedSubPage.map((menu) => {
    switch (menu) {
      case WindSubPageMenu.Climb:
        return 'CLB WIND';
      case WindSubPageMenu.Cruise:
        return 'CRZ WIND AT';
      case WindSubPageMenu.Descent:
        return 'DES WIND';
      default:
        return '';
    }
  });
  private readonly temporaryMessageAreaDisplay = this.tmpyExists.map((exists) => (exists ? 'block' : 'none'));
  private readonly tableHeaderDisplay = this.tmpyExists.map((exists) => (exists ? 'none' : 'flex'));
  private readonly uplinkAvailableForPlan = Subject.create(false);

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
    v.map((isCruise) => (isCruise ? '\xa0CRZ\xa0' : '\xa0'.repeat(5))),
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
    { length: FpmConfigs.A380.NUM_CLIMB_WIND_LEVELS },
    (_, i) => i,
  );
  private readonly climbWindsDisabled = Subject.create(false);

  private readonly climbWindsInactive = Subject.create(false);

  private readonly displayedClimbWindAltitudes = Array.from({ length: FpmConfigs.A380.NUM_CLIMB_WIND_LEVELS }, () =>
    Subject.create<number | null>(null),
  );

  private readonly displayedClimbWindDirections = Array.from({ length: FpmConfigs.A380.NUM_CLIMB_WIND_LEVELS }, () =>
    Subject.create<number | null>(null),
  );

  private readonly displayedClimbWindSpeeds = Array.from({ length: FpmConfigs.A380.NUM_CLIMB_WIND_LEVELS }, () =>
    Subject.create<number | null>(null),
  );

  private readonly displayedClimbWindAltitudeIsEnteredByPilot = Array.from(
    { length: FpmConfigs.A380.NUM_CLIMB_WIND_LEVELS },
    () => Subject.create(true),
  );

  private readonly climbWindRowsVisible = Array.from({ length: FpmConfigs.A380.NUM_CLIMB_WIND_LEVELS }, () =>
    Subject.create(true),
  );

  private readonly climbWindRowsVisibility = this.climbWindRowsVisible.map((sub) =>
    sub.map((v) => (v ? 'visible' : 'hidden')),
  );

  /** The entries used to feed the displayed data */
  private readonly climbWindDisplayEntries: WindDisplayEntry[] = Array.from(
    { length: FpmConfigs.A380.NUM_CLIMB_WIND_LEVELS },
    () => ({ altitude: null, direction: null, speed: null, disabled: false, enteredByPilot: true }),
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
      return;
    }
    const hasFP = this.props.fmcService.master.flightPlanInterface.has(loadedFlightPlanIndex);
    const fp = hasFP ? this.props.fmcService.master.flightPlanInterface.get(loadedFlightPlanIndex) : null;
    const isActiveOrCopyOfActive = fp ? fp.isActiveOrCopiedFromActive() : false;
    this.fpIsActiveOrCopyOfActive.set(isActiveOrCopyOfActive);
    this.uplinkAvailableForPlan.set(fp?.pendingWindUplink.isWindUplinkReadyToInsert() ?? false);
    // History wind methods
    const menu = this.selectedSubPage.get();
    if (menu === WindSubPageMenu.History) {
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
    } else if (menu === WindSubPageMenu.Climb) {
      this.transitionAltitude.set(fp?.performanceData.transitionAltitude.get() ?? null);
      this.departureElevation.set(fp?.originAirport?.location.alt ?? null);
      this.climbWindsDisabled.set(fp === undefined || this.tmpyExists.get());
      this.climbWindsInactive.set(
        isActiveOrCopyOfActive && this.props.fmcService.master.fmgc.getFlightPhase() != FmgcFlightPhase.Preflight,
      );
      if (fp) {
        this.fillDisplayWindEntriesFromFlightPlan(
          fp.performanceData.climbWindEntries.get(),
          this.climbWindDisplayEntries,
        );
      } else {
        this.clearAllDisplayWindEntries(this.climbWindDisplayEntries);
      }
      this.updateClimbWindDisplayRows();
      this.updateWindDisplayedEntriesVisibility(this.climbWindRowsVisible, this.displayedClimbWindAltitudes);
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
          this.selectedSubPage.set(Math.min(v + 1, WindSubPageMenu.Descent));
        } else {
          this.selectedSubPage.set(v);
        }
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
    let page: WindSubPageMenu | null = null;
    if (this.loadedFlightPlan && wptIdx !== null) {
      const leg = this.props.fmcService.master.flightPlanInterface
        .get(this.loadedFlightPlanIndex.get())
        .elementAt(wptIdx);
      if (leg && isLeg(leg)) {
        switch (leg.segment.class) {
          case SegmentClass.Departure:
            page = WindSubPageMenu.Climb;
            break;
          case SegmentClass.Enroute:
            page = WindSubPageMenu.Cruise;
            break;
          case SegmentClass.Arrival:
            page = WindSubPageMenu.Descent;
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
          this.setSelectedPageIndex(WindSubPageMenu.Climb);
          break;
        case FmgcFlightPhase.Cruise:
          this.setSelectedPageIndex(WindSubPageMenu.Cruise);
          break;
        default:
          this.setSelectedPageIndex(WindSubPageMenu.Descent);
          break;
      }
    } else {
      this.setSelectedPageIndex(WindSubPageMenu.Climb); //TODO What should we select in this case?
    }
  }

  private setSelectedPageIndex(menu: WindSubPageMenu) {
    if (this.loadedFlightPlanIndex.get() >= FlightPlanIndex.FirstSecondary) {
      // History is not available on secondary so we need to skip it.
      this.selectedTabIndex.set(Math.max(menu - 1, WindSubPageMenu.Climb));
    } else {
      this.selectedTabIndex.set(menu);
    }
  }

  private insertHistoryWind() {
    const success = this.props.fmcService.master.insertHistoryWinds();
    if (success) {
      this.setSelectedPageIndex(WindSubPageMenu.Climb);
    }
  }

  private clearDisplayWindEntry(entries: WindDisplayEntry[], index: number) {
    const row = entries[index];
    row.altitude = null;
    row.direction = null;
    row.speed = null;
  }

  // Used when there's no flightplan to insert the winds in.
  private clearAllDisplayWindEntries(entries: WindDisplayEntry[]) {
    for (let i = 0; i < entries.length; i++) {
      this.clearDisplayWindEntry(entries, i);
    }
  }

  private shiftUpDisplayedWindEntriesFromIndex(entries: WindDisplayEntry[], index: number) {
    for (let i = index; i < entries.length - 1; i++) {
      const next = entries[i + 1];
      const current = entries[i];
      current.altitude = next.altitude;
      current.direction = next.direction;
      current.speed = next.speed;
    }

    // Clear the last entry as all has been shifted up.
    this.clearDisplayWindEntry(entries, entries.length - 1);
  }

  /**
   * Fills the display wind entries buffer from flightplan wind entries.
   */
  private fillDisplayWindEntriesFromFlightPlan(windEntries: FlightPlanWindEntry[], displayEntries: WindDisplayEntry[]) {
    for (let i = 0; i < displayEntries.length; i++) {
      this.clearDisplayWindEntry(displayEntries, i);
      const windEntry = windEntries[i];
      if (windEntry) {
        // Copy the flightplan entry to the display entry.
        const row = displayEntries[i];
        row.altitude = windEntry.altitude;
        row.direction = extractWindDirectionFromVector(windEntry.vector);
        row.speed = extractWindSpeedFromVector(windEntry.vector);
        row.enteredByPilot =
          (windEntry.flags & FlightPlanWindEntryFlags.InsertedFromHistory) !==
          FlightPlanWindEntryFlags.InsertedFromHistory;
      }
    }

    this.sortDisplayWindEntriesByAltitude(displayEntries);
  }

  /**
   * Copies the mock entries to the display subjects.
   */
  private updateClimbWindDisplayRows() {
    for (let i = 0; i < A380AircraftConfig.fpmConfig.NUM_CLIMB_WIND_LEVELS; i++) {
      const entry = this.climbWindDisplayEntries[i];
      this.displayedClimbWindDirections[i].set(entry.direction);
      this.displayedClimbWindSpeeds[i].set(entry.speed);
      this.displayedClimbWindAltitudes[i].set(entry.altitude);
      this.displayedClimbWindAltitudeIsEnteredByPilot[i].set(entry.enteredByPilot);
    }
  }

  private sortDisplayWindEntriesByAltitude(entries: WindDisplayEntry[]) {
    entries.sort((a, b) => (b.altitude ?? 0) - (a.altitude ?? 0));
  }

  private onWindEntryModified(index: number, value: number | null, dataType: WindEntryData) {
    const displayEntry = this.climbWindDisplayEntries[index];
    const oldAltitude = displayEntry.altitude;
    // Altitude was cleared meaning we need to delete the entry and shift rows accordingly.
    if (value === null && dataType === WindEntryData.Altitude) {
      const existsInFlightPlan = oldAltitude !== null && displayEntry.direction !== null && displayEntry.speed !== null;
      this.shiftUpDisplayedWindEntriesFromIndex(this.climbWindDisplayEntries, index);
      if (existsInFlightPlan) {
        this.props.fmcService.master.flightPlanInterface.setClimbWindEntry(
          oldAltitude,
          null,
          this.loadedFlightPlanIndex.get(),
        );
        displayEntry.altitude = null;
        displayEntry.speed = null;
        displayEntry.direction = null;
        displayEntry.enteredByPilot = true;
      } else {
        displayEntry.altitude = null;
        displayEntry.speed = null;
        displayEntry.direction = null;
        displayEntry.enteredByPilot = true;
        // Draft entry which was not in the flightplan.
        this.updateClimbWindDisplayRows();
        this.updateWindDisplayedEntriesVisibility(this.climbWindRowsVisible, this.displayedClimbWindAltitudes);
      }
    } else {
      const currentAlt = dataType === WindEntryData.Altitude ? value : oldAltitude;
      const currentDir = dataType === WindEntryData.Direction ? value : displayEntry.direction;
      const currentSpeed = dataType === WindEntryData.Speed ? value : displayEntry.speed;
      displayEntry.altitude = currentAlt;
      displayEntry.direction = currentDir;
      displayEntry.speed = currentSpeed;
      displayEntry.enteredByPilot = true;
      if (currentAlt !== null && currentDir != null && currentSpeed != null) {
        const entry = this.getWindEntryFromValues(currentAlt, currentDir, currentSpeed);
        this.props.fmcService.master.flightPlanInterface.setClimbWindEntry(
          oldAltitude ?? currentAlt, // if old altitude is null, we know its a new user entry.
          entry,
          this.loadedFlightPlanIndex.get(),
        );
      } else {
        const altitudeChanged = oldAltitude !== currentAlt;
        if (altitudeChanged) {
          this.sortDisplayWindEntriesByAltitude(this.climbWindDisplayEntries);
        }
        this.updateClimbWindDisplayRows();
        // Change visibility if it is a new entry or if it was cleared.
        if ((oldAltitude === null && currentAlt !== null) || currentAlt === null) {
          this.updateWindDisplayedEntriesVisibility(this.climbWindRowsVisible, this.displayedClimbWindAltitudes);
        }
      }
    }
  }

  /**
   * Updates displayed entry visibility based upon whether the previous entry has an altitude.
   * The first row is always displayed.
   */
  private updateWindDisplayedEntriesVisibility(entryVisible: Subject<boolean>[], altitudes: Subject<number | null>[]) {
    for (let i = 0; i < entryVisible.length; i++) {
      entryVisible[i].set(i === 0 || altitudes[i - 1].get() !== null);
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
          <div style="height: 11px;" />
          <TopTabNavigator pageTitles={this.pageTitles} selectedPageIndex={this.selectedTabIndex}>
            <TopTabNavigatorPage containerStyle="padding-bottom:3px;">
              {/* HISTORY */}
              <div class="mfd-fms-wind-page-container">
                <div class="mfd-fms-wind-page-title-container history"></div>
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
                        <span class="mfd-label bigger mfd-fms-wind-page-history-wind-fl-label">
                          {this.historyWindFlightLevelLabel[value]}
                        </span>
                        <span class="mfd-label-unit bigger mfd-fms-wind-page-history-wind-fl-label">FL</span>
                        <span class="mfd-label green biggest mfd-fms-wind-page-history-wind-fl-value">
                          {this.historyWindFlightLevels[value]}
                        </span>
                      </div>
                      <div class="mfd-fms-wind-history-wind-entry">
                        <span class="mfd-label green biggest">{this.historyWindDirections[value]}</span>
                        <span
                          class="mfd-label-unit bigger"
                          style={{ visibility: this.historyWindsUnitVisiblity[value] }}
                        >
                          °&nbsp;&nbsp;
                        </span>
                        <span class="mfd-label green biggest">{this.historyWindSpeeds[value]}</span>
                        <span
                          class="mfd-label-unit bigger"
                          style={{ visibility: this.historyWindsUnitVisiblity[value] }}
                        >
                          KT
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div class="history-wind-button-container">
                <Button
                  label={
                    <div style="display: flex; flex-direction: row; justify-content: space-between;">
                      <span style="text-align: center; vertical-align: center; margin-right: 5px;">
                        INSERT
                        <br />
                        HISTORY WIND
                      </span>
                      <span style="display: flex; align-items: center; justify-content: center;">*</span>
                    </div>
                  }
                  onClick={this.insertHistoryWind.bind(this)}
                  visible={this.historyWindButtonVisible}
                  disabled={this.tmpyExists}
                />
              </div>
            </TopTabNavigatorPage>

            <TopTabNavigatorPage containerStyle="padding-bottom:3px;">
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
                        visibility: this.climbWindRowsVisibility[value],
                      }}
                      class="mfd-fms-wind-page-entry-row"
                    >
                      <div class="mfd-fms-wind-altitude-entry-container">
                        <InputField
                          containerStyle="width:157px; height:40px;"
                          inactive={this.climbWindsInactive}
                          disabled={this.climbWindsDisabled}
                          onModified={(v) => {
                            this.onWindEntryModified(value, v, WindEntryData.Altitude);
                          }}
                          errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
                          hEventConsumer={this.props.mfd.hEventConsumer}
                          interactionMode={this.props.mfd.interactionMode}
                          dataEntryFormat={
                            new WindAltitudeFormat(this.transitionAltitude, false, this.departureElevation)
                          }
                          value={this.displayedClimbWindAltitudes[value]}
                          canBeCleared={true}
                          enteredByPilot={this.displayedClimbWindAltitudeIsEnteredByPilot[value]}
                        ></InputField>
                      </div>
                      <div class="mfd-fms-wind-direction-speed-entry-container">
                        <InputField
                          containerStyle="height:42px; width:98px; margin-right:6px;"
                          inactive={this.climbWindsInactive}
                          disabled={this.climbWindsDisabled}
                          onModified={(v) => {
                            this.onWindEntryModified(value, v, WindEntryData.Direction);
                          }}
                          errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
                          hEventConsumer={this.props.mfd.hEventConsumer}
                          interactionMode={this.props.mfd.interactionMode}
                          dataEntryFormat={new WindDirectionFormat()}
                          value={this.displayedClimbWindDirections[value]}
                          canBeCleared={false}
                        ></InputField>
                        <InputField
                          containerStyle="height: 42px; width:115px;"
                          inactive={this.climbWindsInactive}
                          disabled={this.climbWindsDisabled}
                          onModified={(v) => {
                            this.onWindEntryModified(value, v, WindEntryData.Speed);
                          }}
                          errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
                          hEventConsumer={this.props.mfd.hEventConsumer}
                          interactionMode={this.props.mfd.interactionMode}
                          dataEntryFormat={new WindSpeedFormat()}
                          value={this.displayedClimbWindSpeeds[value]}
                          canBeCleared={false}
                        ></InputField>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TopTabNavigatorPage>
          </TopTabNavigator>
          <div class="mfd-fms-wind-bottom-buttons-container">
            <Button
              label="RETURN"
              onClick={() => this.props.mfd.uiService.navigateTo('back')}
              buttonStyle="margin-right: 5px; width:150px;"
              visible={this.returnButtonVisible}
            />
            <CpnyWindRequestButton
              fmc={this.props.fmcService.master}
              flightPlanIndex={this.loadedFlightPlanIndex}
              tmpyExists={this.tmpyExists}
              isActiveOrCopiedFromActive={this.fpIsActiveOrCopyOfActive}
              buttonStyle="margin-right: 10px; justify-self: flex-end; width: 175px;"
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
          class="mfd-fms-wind-page-table-message-area mfd-value smaller amber"
          style={{ display: this.props.messageAreaDisplay }}
        >
          WIND ENTRY NOT ALLOWED: TMPY F-PLN EXISTING
        </div>
      </div>
    );
  }
}
