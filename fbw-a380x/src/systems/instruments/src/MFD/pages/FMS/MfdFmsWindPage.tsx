// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import {
  ArraySubject,
  ComponentProps,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from '../../MFD';
import { FmsFlightPlanPage } from '../common/FmsFlightPlanPage';
import { TopTabNavigator, TopTabNavigatorPage } from '../../../MsfsAvionicsCommon/UiWidgets/TopTabNavigator';
import { Footer } from '../common/Footer';
import { Button } from '../../../MsfsAvionicsCommon/UiWidgets/Button';
import { onEntryNotInList, showReturnButtonUriExtra } from '../../shared/utils';
import { FmgcFlightPhase } from '@shared/flightphase';
import { isLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';
import './MfdFmsWindPage.scss';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import {
  createVectorFromMagnitudeAndDirection,
  extractWindDirectionFromVector,
  extractWindSpeedFromVector,
  FlightPlanWindEntry,
  FlightPlanWindEntryFlags,
  formatWindMagnitude,
  formatWindTrueDegrees,
  PropagatedWindEntry,
  PropagationType,
  WindEntry,
} from '@fmgc/flightplanning/data/wind';
import { A380AircraftConfig } from '@fmgc/flightplanning/A380AircraftConfig';
import { InputField } from '../../../MsfsAvionicsCommon/UiWidgets/InputField';
import {
  FlightLevelFormat,
  TemperatureFormat,
  WindAltitudeFormat,
  WindDirectionFormat,
  WindFlightLevelFormat,
  WindSpeedFormat,
} from '../common/DataEntryFormats';
import { CpnyWindRequestButton } from './CpnyWindButtonUtils';
import { FpmConfigs } from '@fmgc/flightplanning/FpmConfig';
import { ProfilePhase } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { NXSystemMessages } from '../../shared/NXSystemMessages';
import { DropdownMenu } from '../../../MsfsAvionicsCommon/UiWidgets/DropdownMenu';
import { IconButton } from '../../../MsfsAvionicsCommon/UiWidgets/IconButton';

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

interface CruiseWindDisplayEntry extends WindDisplayEntry {
  speedOrDirectionIsPropagated: boolean;
  isPropagated: boolean;
}

interface WindDisplayEntry {
  altitude: number | null;
  direction: number | null;
  speed: number | null;
  /** Only used for climb winds when inserted through history winds */
  enteredByPilot?: boolean;

  /** Indicates whether the entry exists in the flight-plan */
  entryInFp: boolean;
}

export class MfdFmsWindPage extends FmsFlightPlanPage<MfdFmsWindProps> {
  private static readonly pageTitlesActiveFpln = ['HISTORY', 'CLB', 'CRZ', 'DES'];
  private static readonly pageTitlesSecondaryFpln = ['', 'CLB', 'CRZ', 'DES']; // Use an empty page title to skip the history page in SEC.

  // General Navigation
  private readonly pageTitles = Subject.create(MfdFmsWindPage.pageTitlesActiveFpln);
  private readonly selectedSubPage = Subject.create(WindSubPageMenu.Climb);
  private wasSecPreviouslyActive = false;
  private readonly returnButtonVisible = Subject.create(true);
  private readonly fpIsActiveOrCopyOfActive = Subject.create(false);
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

  private readonly climbWindAltitudesVisible = Array.from({ length: FpmConfigs.A380.NUM_CLIMB_WIND_LEVELS }, () =>
    Subject.create(true),
  );

  private readonly climbWindAltitudesVisibility = this.climbWindAltitudesVisible.map((sub) =>
    sub.map((v) => (v ? 'visible' : 'hidden')),
  );

  private readonly climbWindsSpeedDirectionVisible = Array.from({ length: FpmConfigs.A380.NUM_CLIMB_WIND_LEVELS }, () =>
    Subject.create(true),
  );
  private readonly climbWindsSpeedDirectionVisibility = this.climbWindsSpeedDirectionVisible.map((sub) =>
    sub.map((v) => (v ? 'visible' : 'hidden')),
  );

  /** The entries used to feed the displayed data */
  private readonly climbWindDisplayEntries: WindDisplayEntry[] = Array.from(
    { length: FpmConfigs.A380.NUM_CLIMB_WIND_LEVELS },
    () => ({ altitude: null, direction: null, speed: null, disabled: false, enteredByPilot: true, entryInFp: false }),
  );

  private readonly transitionAltitude = Subject.create<number | null>(null);
  private readonly departureElevation = Subject.create<number | null>(null);

  // Cruise Wind
  private navigationWaypointLegIndex: number | null = null;
  private readonly WindCache: PropagatedWindEntry[] = [];
  private readonly selectedWaypointLegIndex = Subject.create<number | null>(null);
  private availableWaypointsToLegIndex: number[] = [];
  private readonly availableWaypoints = ArraySubject.create<string>([]);
  private readonly availableWaypointsSize = Subject.create(0);
  private readonly dropdownMenuSelectedWaypointIndex = this.selectedWaypointLegIndex.map((si) => {
    if (si === null) {
      return null;
    } else {
      const idx = this.availableWaypointsToLegIndex.findIndex((i) => i === si);
      return idx !== -1 ? idx : null;
    }
  });
  private readonly cruiseWindsDisabled = Subject.create(false);
  private readonly cruiseWindsInactive = Subject.create(false);

  private readonly selectNextDisabled = MappedSubject.create(
    ([selectedIndex, size]) => selectedIndex === null || selectedIndex >= size - 1,
    this.dropdownMenuSelectedWaypointIndex,
    this.availableWaypointsSize,
  );
  private readonly selectPreviousDisabled = this.dropdownMenuSelectedWaypointIndex.map((v) => v === null || v === 0);

  private static readonly CRUISE_WIND_ENTRIES_ARRAY = Array.from(
    { length: FpmConfigs.A380.NUM_CRUISE_WIND_LEVELS },
    (_, i) => i,
  );

  private readonly displayedCruiseWindFlightLevels = Array.from(
    { length: FpmConfigs.A380.NUM_CRUISE_WIND_LEVELS },
    () => Subject.create<number | null>(null),
  );

  private readonly displayedCruiseWindFlightLevelsInactive = Array.from(
    { length: FpmConfigs.A380.NUM_CRUISE_WIND_LEVELS },
    () => Subject.create(false),
  );

  private readonly displayedCruiseWindDirections = Array.from({ length: FpmConfigs.A380.NUM_CRUISE_WIND_LEVELS }, () =>
    Subject.create<number | null>(null),
  );
  private readonly displayedCruiseWindSpeeds = Array.from({ length: FpmConfigs.A380.NUM_CRUISE_WIND_LEVELS }, () =>
    Subject.create<number | null>(null),
  );

  private readonly displayedCruiseWindVectorIsEnteredByPilot = Array.from(
    { length: FpmConfigs.A380.NUM_CRUISE_WIND_LEVELS },
    () => Subject.create(true),
  );

  private readonly cruiseWindAltitudesVisible = Array.from({ length: FpmConfigs.A380.NUM_CRUISE_WIND_LEVELS }, () =>
    Subject.create(true),
  );
  private readonly cruiseWindAltitudesVisibility = this.cruiseWindAltitudesVisible.map((sub) =>
    sub.map((v) => (v ? 'visible' : 'hidden')),
  );
  private readonly cruiseWindSpeedDirectionVisible = Array.from(
    { length: FpmConfigs.A380.NUM_CRUISE_WIND_LEVELS },
    () => Subject.create(true),
  );
  private readonly cruiseWindSpeedDirectionVisibility = this.cruiseWindSpeedDirectionVisible.map((sub) =>
    sub.map((v) => (v ? 'visible' : 'hidden')),
  );
  /** The entries used to feed the displayed data */
  private readonly cruiseWindDisplayEntries: CruiseWindDisplayEntry[] = Array.from(
    { length: FpmConfigs.A380.NUM_CRUISE_WIND_LEVELS },
    () => ({
      altitude: null,
      direction: null,
      speed: null,
      speedOrDirectionIsPropagated: false,
      isPropagated: false,
      entryInFp: false,
    }),
  );

  private readonly cruiseWindRowFlightLevelIsPropagated = Array.from(
    { length: FpmConfigs.A380.NUM_CRUISE_WIND_LEVELS },
    () => Subject.create(false),
  );

  private readonly cruiseWindRowFlightLevelIsEnteredByPilot = Array.from(
    { length: FpmConfigs.A380.NUM_CRUISE_WIND_LEVELS },
    (_, i) => MappedSubject.create(([propagated]) => !propagated, this.cruiseWindRowFlightLevelIsPropagated[i]),
  );

  private readonly cruiseWindRowAltitudeIsInactive = Array.from(
    { length: FpmConfigs.A380.NUM_CRUISE_WIND_LEVELS },
    (_, i) =>
      MappedSubject.create(
        ([isInactive, isPropagated]) => isInactive || isPropagated,
        this.displayedCruiseWindFlightLevelsInactive[i],
        this.cruiseWindRowFlightLevelIsPropagated[i],
      ),
  );

  //TODO Dummies for now till implemented by systems
  private readonly cruiseTemperatureFlightLevel = Subject.create<number | null>(null);
  private readonly cruiseTemperature = Subject.create<number | null>(null);

  // Descent Wind
  private static readonly DESCENT_WIND_ENTRIES_ARRAY = Array.from(
    { length: FpmConfigs.A380.NUM_DESCENT_WIND_LEVELS },
    (_, i) => i,
  );
  private readonly descentWindsDisabled = Subject.create(false);

  private readonly descentWindsInactive = Subject.create(false);

  private readonly displayedDescentWindAltitudes = Array.from({ length: FpmConfigs.A380.NUM_DESCENT_WIND_LEVELS }, () =>
    Subject.create<number | null>(null),
  );

  private readonly displayedDescentWindDirections = Array.from(
    { length: FpmConfigs.A380.NUM_DESCENT_WIND_LEVELS },
    () => Subject.create<number | null>(null),
  );

  private readonly displayedDescentWindSpeeds = Array.from({ length: FpmConfigs.A380.NUM_DESCENT_WIND_LEVELS }, () =>
    Subject.create<number | null>(null),
  );

  private readonly descentWindAltitudesVisible = Array.from({ length: FpmConfigs.A380.NUM_DESCENT_WIND_LEVELS }, () =>
    Subject.create(true),
  );

  private readonly descentWindAltitudesVisibility = this.descentWindAltitudesVisible.map((sub) =>
    sub.map((v) => (v ? 'visible' : 'hidden')),
  );

  private readonly descentWindSpeedDirectionVisible = Array.from(
    { length: FpmConfigs.A380.NUM_DESCENT_WIND_LEVELS },
    () => Subject.create(true),
  );

  private readonly descentWindSpeedDirectionVisibility = this.descentWindSpeedDirectionVisible.map((sub) =>
    sub.map((v) => (v ? 'visible' : 'hidden')),
  );

  /** The entries used to feed the displayed data */
  private readonly descentWindDisplayEntries: WindDisplayEntry[] = Array.from(
    { length: FpmConfigs.A380.NUM_DESCENT_WIND_LEVELS },
    () => ({ altitude: null, direction: null, speed: null, disabled: false, entryInFp: false }),
  );

  private readonly transitionLevel = Subject.create<number | null>(null);
  private readonly arrivalElevation = Subject.create<number | null>(null);

  private readonly alternateCruiseFlightLevel = Subject.create<number | null>(null);
  private readonly alternateCruiseFlightLevelDisplay = this.alternateCruiseFlightLevel.map((fl) =>
    fl !== null ? fl.toFixed(0) : '---',
  );
  private readonly alternateWindDirection = Subject.create<number | null>(null);
  private readonly alternateWindSpeed = Subject.create<number | null>(null);
  private readonly alternateWindDisabled = Subject.create(false);
  private readonly alternateWindIsPrimaryFlightPlan = Subject.create(false);
  private readonly alternateWindFlightLevelUnitVisibility = this.alternateCruiseFlightLevel.map((fl) =>
    fl === null ? 'hidden' : 'visible',
  );

  private readonly draftWindsExist = Subject.create(false);

  private readonly historyWindsDisabled = MappedSubject.create(
    ([draft, hasTmpy]) => draft || hasTmpy,
    this.draftWindsExist,
    this.tmpyActive,
  );

  private readonly draftWindButtonIsAmber = MappedSubject.create(
    ([draft, fpIndex]) => draft && fpIndex === FlightPlanIndex.Active,
    this.draftWindsExist,
    this.loadedFlightPlanIndex,
  );

  private readonly draftWindLabelVisibility = this.draftWindsExist.map((exists) => (exists ? 'visible' : 'hidden'));

  private readonly draftWindButtonDisplay = this.draftWindsExist.map((exists) => (exists ? 'flex' : 'none'));

  private readonly returnButtonDisplay = MappedSubject.create(
    ([showReturnButton, draft]) => (showReturnButton && !draft ? 'inline' : 'none'),
    this.returnButtonVisible,
    this.draftWindsExist,
  );

  protected onNewData(): void {
    this.updatePage();
  }

  private updatePage() {
    const loadedFlightPlanIndex = this.loadedFlightPlanIndex.get();
    // If we switched from a SEC to active, enable history again;
    if (this.wasSecPreviouslyActive && loadedFlightPlanIndex < FlightPlanIndex.FirstSecondary) {
      this.pageTitles.set(MfdFmsWindPage.pageTitlesActiveFpln);
      return;
    }

    const hasFP = this.props.fmcService.master.flightPlanInterface.has(loadedFlightPlanIndex);
    const fp = hasFP ? this.props.fmcService.master.flightPlanInterface.get(loadedFlightPlanIndex) : null;
    const isActiveOrCopyOfActive = fp ? fp.isActiveOrCopiedFromActive() : false;
    this.fpIsActiveOrCopyOfActive.set(isActiveOrCopyOfActive);
    this.draftWindsExist.set(fp?.hasDraftWindEntries() ?? false);
    const subPage = this.selectedSubPage.get();
    const hasTmpy = this.tmpyActive.get();
    if (subPage === WindSubPageMenu.History) {
      this.props.flightPlanInterface.getHistoryWindsEntries().then((historyWinds) => {
        let hasNonEmptyWind = false;
        const cruiseFlightLevel = fp?.performanceData.cruiseFlightLevel.get() ?? null;
        for (let i = 0; i < MfdFmsWindPage.NUM_HISTORY_WIND_ENTRIES; i++) {
          const windEntry = historyWinds[i];
          if (windEntry) {
            const windVector = windEntry.vector;
            hasNonEmptyWind =
              hasNonEmptyWind || (windVector.direction !== undefined && windVector.magnitude !== undefined);
            this.historyWindFlightLevels[i].set((windEntry.altitude! / 100).toFixed(0).padStart(3, '0'));
            this.historyWindSpeeds[i].set(
              windVector.magnitude === undefined ? '\xa0---' : `/${formatWindMagnitude(windVector)}`,
            );
            this.historyWindDirections[i].set(
              windVector.direction === undefined ? '---' : formatWindTrueDegrees(windVector, false),
            );
            this.historyWindUnitsVisible[i].set(
              windVector.direction !== undefined && windVector.magnitude !== undefined,
            );
            this.historyWindValidEntry[i].set(true);
            this.isHistoryWindCruiseFlightLevel[i].set(
              cruiseFlightLevel !== null && windEntry.altitude == cruiseFlightLevel * 100,
            );
          } else {
            this.historyWindValidEntry[i].set(false);
          }
        }
      });

      this.props.flightPlanInterface.historyWindInsertionAllowed().then((v) => {
        this.historyWindButtonVisible.set(v);
      });
    } else if (subPage === WindSubPageMenu.Climb) {
      this.transitionAltitude.set(fp?.performanceData.transitionAltitude.get() ?? null);
      this.departureElevation.set(fp?.originAirport?.location.alt ?? null);
      this.climbWindsDisabled.set(fp === undefined || hasTmpy);
      this.climbWindsInactive.set(
        isActiveOrCopyOfActive && this.props.fmcService.master.fmgc.getFlightPhase() != FmgcFlightPhase.Preflight,
      );
      if (fp) {
        this.fillDisplayWindEntriesFromFlightPlan(fp.getClimbWindEntries(), this.climbWindDisplayEntries);
      } else {
        this.clearAllDisplayWindEntries(this.climbWindDisplayEntries);
      }
      this.updateClimbWindDisplayRows();
      this.updateWindDisplayedEntriesVisibility(
        this.climbWindAltitudesVisible,
        this.climbWindsSpeedDirectionVisible,
        this.climbWindDisplayEntries,
      );
    } else if (subPage === WindSubPageMenu.Cruise) {
      this.findSuitableCruiseLeg();
      this.cruiseWindsDisabled.set(fp === undefined || hasTmpy || this.availableWaypoints.length === 0);
      this.cruiseWindsInactive.set(
        isActiveOrCopyOfActive && this.props.fmcService.master.fmgc.getFlightPhase() > FmgcFlightPhase.Cruise,
      );
      const legIndex = this.selectedWaypointLegIndex.get();
      const winds =
        legIndex !== null
          ? this.props.flightPlanInterface.propagateWindsAt(legIndex, this.WindCache, loadedFlightPlanIndex)
          : null;
      this.clearAllCruiseDisplayWindEntries();
      for (let i = 0; i < this.cruiseWindDisplayEntries.length; i++) {
        const wind = winds !== null ? winds[i] : undefined;
        if (wind !== undefined) {
          this.cruiseWindDisplayEntries[i].altitude = wind.altitude !== undefined ? wind.altitude / 100 : null;
          this.cruiseWindDisplayEntries[i].direction =
            wind.type !== PropagationType.Backward && wind.vector.direction !== undefined
              ? extractWindDirectionFromVector(wind.vector) ?? null
              : null;
          this.cruiseWindDisplayEntries[i].speed =
            wind.type !== PropagationType.Backward && wind.vector.magnitude !== undefined
              ? extractWindSpeedFromVector(wind.vector) ?? null
              : null;
          this.cruiseWindDisplayEntries[i].speedOrDirectionIsPropagated = wind.type === PropagationType.Forward;
          this.cruiseWindDisplayEntries[i].isPropagated = wind.type !== PropagationType.Entry;
          this.cruiseWindDisplayEntries[i].entryInFp = true;
        } else {
          this.cruiseWindDisplayEntries[i].entryInFp = false;
        }
      }
      this.updateCruiseWindDisplayRows();
      this.updateWindDisplayedEntriesVisibility(
        this.cruiseWindAltitudesVisible,
        this.cruiseWindSpeedDirectionVisible,
        this.cruiseWindDisplayEntries,
      );
    } else if (subPage === WindSubPageMenu.Descent) {
      this.transitionLevel.set(fp?.performanceData.transitionLevel.get() ?? null);
      this.arrivalElevation.set(fp?.destinationAirport?.location.alt ?? null);
      this.descentWindsDisabled.set(fp === undefined || hasTmpy);
      this.descentWindsInactive.set(
        isActiveOrCopyOfActive && this.props.fmcService.master.fmgc.getFlightPhase() >= FmgcFlightPhase.Descent,
      );
      this.alternateWindIsPrimaryFlightPlan.set(
        loadedFlightPlanIndex === FlightPlanIndex.Active || loadedFlightPlanIndex === FlightPlanIndex.Temporary,
      );
      const hasAlternate = fp?.alternateDestinationAirport !== undefined;
      const alternateWind = fp?.getAlternateWind() ?? null;
      this.alternateWindDirection.set(
        alternateWind !== null ? extractWindDirectionFromVector(alternateWind) ?? null : null,
      );
      this.alternateWindSpeed.set(alternateWind !== null ? extractWindSpeedFromVector(alternateWind) ?? null : null);
      this.alternateWindDisabled.set(!hasAlternate || hasTmpy);
      this.alternateCruiseFlightLevel.set(fp?.getAlternateCruiseLevel() ?? null);
      if (fp) {
        this.fillDisplayWindEntriesFromFlightPlan(fp.getDescentWindEntries(), this.descentWindDisplayEntries);
      } else {
        this.clearAllDisplayWindEntries(this.descentWindDisplayEntries);
      }
      this.updateDescentWindDisplayRows();
      this.updateWindDisplayedEntriesVisibility(
        this.descentWindAltitudesVisible,
        this.descentWindSpeedDirectionVisible,
        this.descentWindDisplayEntries,
      );
    }
    this.wasSecPreviouslyActive =
      loadedFlightPlanIndex >= FlightPlanIndex.FirstSecondary ? true : this.wasSecPreviouslyActive;
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
        this.navigationWaypointLegIndex = wptIdx;
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
    this.subs.push(
      this.props.fmcService.master.fmgc.data.flightPhase.sub((phase) => {
        this.automaticallySelectTabByFlightPhase(phase);
      }),
      this.selectedSubPage.sub((v) => {
        if (this.loadedFlightPlanIndex.get() >= FlightPlanIndex.FirstSecondary) {
          // History is not available on secondary so we need to skip it.
          this.selectedSubPage.set(Math.max(WindSubPageMenu.Climb, v));
        }
        this.updatePage();
      }),
      ...this.historyWindFlightLevelLabel,
      ...this.historyWindsUnitVisiblity,
      ...this.historyWindEntryVisibility,
      ...this.climbWindAltitudesVisibility,
      ...this.climbWindsSpeedDirectionVisibility,
      ...this.cruiseWindAltitudesVisibility,
      ...this.cruiseWindSpeedDirectionVisibility,
      ...this.descentWindAltitudesVisibility,
      ...this.descentWindSpeedDirectionVisibility,
      this.temporaryMessageAreaDisplay,
      this.tableHeaderDisplay,
      this.alternateCruiseFlightLevelDisplay,
      this.alternateWindFlightLevelUnitVisibility,
      ...this.cruiseWindRowAltitudeIsInactive,
      ...this.cruiseWindRowFlightLevelIsEnteredByPilot,
      this.selectNextDisabled,
      this.historyWindsDisabled,
      this.draftWindButtonIsAmber,
      this.draftWindLabelVisibility,
      this.draftWindButtonDisplay,
      this.returnButtonDisplay,
    );
    this.automaticallySelectTab();
  }

  private automaticallySelectTab() {
    const wptIdx = this.navigationWaypointLegIndex;
    let page: WindSubPageMenu | null = null;
    if (this.loadedFlightPlan && wptIdx !== null) {
      const leg = this.props.fmcService.master.flightPlanInterface
        .get(this.loadedFlightPlanIndex.get())
        .maybeElementAt(wptIdx);
      if (isLeg(leg) && leg.isXF()) {
        const preds =
          this.loadedFlightPlanIndex.get() === FlightPlanIndex.Active
            ? this.props.fmcService.master.fmgc.guidanceController?.vnavDriver.mcduProfile?.waypointPredictions.get(
                wptIdx,
              )
            : undefined;
        const segment = preds === undefined ? leg.segment.class : preds.profilePhase;
        switch (segment) {
          case ProfilePhase.Climb:
          case SegmentClass.Departure:
            page = WindSubPageMenu.Climb;
            break;
          case ProfilePhase.Cruise:
          case SegmentClass.Enroute:
            page = WindSubPageMenu.Cruise;
            break;
          case ProfilePhase.Descent:
          case SegmentClass.Arrival:
            page = WindSubPageMenu.Descent;
            break;
        }
      }
    }
    if (page === null) {
      this.automaticallySelectTabByFlightPhase(this.props.fmcService.master.fmgc.getFlightPhase());
    } else {
      this.selectedSubPage.set(page);
    }
  }

  private automaticallySelectTabByFlightPhase(phase: FmgcFlightPhase) {
    if (this.fpIsActiveOrCopyOfActive.get()) {
      switch (phase) {
        case FmgcFlightPhase.Preflight:
        case FmgcFlightPhase.Done:
        case FmgcFlightPhase.Climb:
          this.selectedSubPage.set(WindSubPageMenu.Climb);
          break;
        case FmgcFlightPhase.Cruise:
          this.selectedSubPage.set(WindSubPageMenu.Cruise);
          break;
        default:
          this.selectedSubPage.set(WindSubPageMenu.Descent);
          break;
      }
    }
  }

  private insertHistoryWind() {
    this.props.flightPlanInterface.insertHistoryWinds().then((v) => {
      if (v) {
        this.selectedSubPage.set(WindSubPageMenu.Climb);
      }
    });
  }

  private clearDisplayWindEntry(entries: WindDisplayEntry[], index: number) {
    const row = entries[index];
    row.altitude = null;
    row.direction = null;
    row.speed = null;
    row.entryInFp = false;
  }

  // Used when there's no flightplan to insert the winds in.
  private clearAllDisplayWindEntries(entries: WindDisplayEntry[]) {
    for (let i = 0; i < entries.length; i++) {
      this.clearDisplayWindEntry(entries, i);
    }
  }

  private clearCruiseDisplayWindEntry(index: number) {
    const row = this.cruiseWindDisplayEntries[index];
    row.altitude = null;
    row.direction = null;
    row.speed = null;
    row.isPropagated = false;
    row.speedOrDirectionIsPropagated = false;
    row.entryInFp = false;
  }

  private clearAllCruiseDisplayWindEntries() {
    for (let i = 0; i < this.cruiseWindDisplayEntries.length; i++) {
      this.clearCruiseDisplayWindEntry(i);
    }
  }

  /**
   * Fills the display wind entries buffer from flightplan wind entries.
   */
  private fillDisplayWindEntriesFromFlightPlan(windEntries: FlightPlanWindEntry[], displayEntries: WindDisplayEntry[]) {
    for (let i = 0; i < displayEntries.length; i++) {
      this.clearDisplayWindEntry(displayEntries, i);
      const windEntry = windEntries[i];
      const row = displayEntries[i];
      if (windEntry) {
        // Copy the flightplan entry to the display entry.
        row.altitude = windEntry.altitude ?? null;
        row.direction =
          windEntry.vector.direction !== undefined
            ? extractWindDirectionFromVector(windEntry.vector, false) ?? null
            : null;
        row.speed =
          windEntry.vector.magnitude !== undefined ? extractWindSpeedFromVector(windEntry.vector, false) ?? null : null;
        row.enteredByPilot =
          (windEntry.flags & FlightPlanWindEntryFlags.InsertedFromHistory) !==
          FlightPlanWindEntryFlags.InsertedFromHistory;
        row.entryInFp = true;
      } else {
        row.entryInFp = false;
      }
    }
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
      this.displayedClimbWindAltitudeIsEnteredByPilot[i].set(entry.enteredByPilot ?? false);
    }
  }

  private updateDescentWindDisplayRows() {
    for (let i = 0; i < A380AircraftConfig.fpmConfig.NUM_DESCENT_WIND_LEVELS; i++) {
      const entry = this.descentWindDisplayEntries[i];
      this.displayedDescentWindDirections[i].set(entry.direction);
      this.displayedDescentWindSpeeds[i].set(entry.speed);
      this.displayedDescentWindAltitudes[i].set(entry.altitude);
    }
  }

  private updateCruiseWindDisplayRows() {
    for (let i = 0; i < A380AircraftConfig.fpmConfig.NUM_CRUISE_WIND_LEVELS; i++) {
      const entry = this.cruiseWindDisplayEntries[i];
      this.displayedCruiseWindDirections[i].set(entry.direction);
      this.displayedCruiseWindSpeeds[i].set(entry.speed);
      this.displayedCruiseWindFlightLevels[i].set(entry.altitude);
      this.cruiseWindRowFlightLevelIsPropagated[i].set(entry.isPropagated);
      this.displayedCruiseWindVectorIsEnteredByPilot[i].set(!entry.speedOrDirectionIsPropagated);
    }
  }

  private onWindEntryModified(index: number, value: number | null, dataType: WindEntryData, isDescentWind = false) {
    const displayEntries = isDescentWind ? this.descentWindDisplayEntries : this.climbWindDisplayEntries;
    const displayEntry = displayEntries[index];
    const oldAltitude = displayEntry.altitude;
    const currentDir = dataType === WindEntryData.Direction ? value : displayEntry.direction;
    const currentSpeed = dataType === WindEntryData.Speed ? value : displayEntry.speed;
    const currentAlt = dataType === WindEntryData.Altitude ? value : oldAltitude;
    displayEntry.altitude = currentAlt;
    displayEntry.direction = currentDir;
    displayEntry.speed = currentSpeed;
    if (dataType === WindEntryData.Altitude && currentAlt !== null && currentAlt !== oldAltitude) {
      displayEntry.enteredByPilot = true;
    }
    const entry = this.getWindEntryFromValues(currentAlt, currentDir, currentSpeed);
    if (isDescentWind) {
      if (displayEntry.entryInFp) {
        this.props.fmcService.master.flightPlanInterface.editDescentWindEntry(
          index,
          entry,
          this.loadedFlightPlanIndex.get(),
        );
      } else {
        this.props.fmcService.master.flightPlanInterface.setDescentWindEntry(
          currentAlt ?? undefined,
          entry,
          this.loadedFlightPlanIndex.get(),
          true,
        );
      }
    } else {
      if (displayEntry.entryInFp) {
        this.props.fmcService.master.flightPlanInterface.editClimbWindEntry(
          index,
          entry,
          this.loadedFlightPlanIndex.get(),
        );
      } else {
        this.props.fmcService.master.flightPlanInterface.setClimbWindEntry(
          currentAlt ?? undefined,
          entry,
          this.loadedFlightPlanIndex.get(),
        );
      }
    }
  }

  private onCruiseWindEntryModified(index: number, value: number | null, dataType: WindEntryData) {
    const displayEntries = this.cruiseWindDisplayEntries;
    const displayEntry = displayEntries[index];
    const oldAltitude = displayEntry.altitude;
    const selectedLegIndex = this.selectedWaypointLegIndex.get();

    if (selectedLegIndex === null) {
      console.log('No selected leg index for cruise wind entry modification.');
      return;
    }

    if (dataType === WindEntryData.Altitude && displayEntry.isPropagated) {
      // We should never enter here.
      console.log('Propagated cruise wind entry FL edit attempt.');
      this.props.fmcService.master.addMessageToQueue(NXSystemMessages.notAllowed, undefined, undefined);
      return;
    }

    // Should never enter here
    if (value === null && dataType === WindEntryData.Altitude && oldAltitude !== null) {
      console.warn('Cruise entry flight level altitude deletion attempt!');
      this.props.fmcService.master.addMessageToQueue(NXSystemMessages.notAllowed, undefined, undefined);
      return;
    } else {
      const currentAlt = dataType === WindEntryData.Altitude ? value : oldAltitude;
      const currentDir = dataType === WindEntryData.Direction ? value : displayEntry.direction;
      const currentSpeed = dataType === WindEntryData.Speed ? value : displayEntry.speed;
      if (displayEntry.speedOrDirectionIsPropagated && (currentDir === null || currentSpeed === null)) {
        // Don't allow clearing of speed or direction if the entry is propagated
        this.props.fmcService.master.addMessageToQueue(NXSystemMessages.notAllowed, undefined, undefined);
        return;
      }
      displayEntry.altitude = currentAlt;
      displayEntry.direction = currentDir;
      displayEntry.speed = currentSpeed;

      if (
        (dataType === WindEntryData.Direction && currentAlt !== null) ||
        (dataType === WindEntryData.Speed && currentSpeed !== null)
      ) {
        displayEntry.speedOrDirectionIsPropagated = false;
      }

      // Cruise winds are always in FL.
      const entry = this.getWindEntryFromValues(
        currentAlt !== null ? currentAlt * 100 : null,
        currentDir,
        currentSpeed,
      );
      if (displayEntry.entryInFp) {
        this.props.fmcService.master.flightPlanInterface.editCruiseWindEntry(
          selectedLegIndex,
          index,
          entry,
          this.loadedFlightPlanIndex.get(),
        );
      } else {
        this.props.fmcService.master.flightPlanInterface.addCruiseWindEntry(
          selectedLegIndex,
          entry,
          this.loadedFlightPlanIndex.get(),
        );
      }
    }
  }

  private onAlternateWindModified(value: number | null, dataType: WindEntryData) {
    if (value === null) {
      this.props.fmcService.master.flightPlanInterface.clearAlternateWind(this.loadedFlightPlanIndex.get());
    } else {
      const currentDir = dataType === WindEntryData.Direction ? value : this.alternateWindDirection.get();
      const currentSpeed = dataType === WindEntryData.Speed ? value : this.alternateWindSpeed.get();
      this.props.fmcService.master.flightPlanInterface.setAlternateWind(
        createVectorFromMagnitudeAndDirection(currentSpeed ?? undefined, currentDir ?? undefined),
        this.loadedFlightPlanIndex.get(),
      );
    }
  }

  /**
   * Updates displayed entry visibility based upon whether the previous entry has an altitude.
   * The first row is always displayed.
   */
  private updateWindDisplayedEntriesVisibility(
    altitudeVisible: Subject<boolean>[],
    speedDirectionVisible: Subject<boolean>[],
    entries: WindDisplayEntry[],
  ) {
    for (let i = 0; i < altitudeVisible.length; i++) {
      const previousEntry = entries[i - 1];
      const currentEntry = entries[i];
      altitudeVisible[i].set(
        i === 0 || previousEntry.altitude !== null || (previousEntry.altitude === null && previousEntry.entryInFp),
      );
      speedDirectionVisible[i].set(
        i === 0 || currentEntry.altitude !== null || (currentEntry.altitude === null && currentEntry.entryInFp),
      );
    }
  }

  private getWindEntryFromValues(altitude: number | null, direction: number | null, speed: number | null): WindEntry {
    return {
      altitude: altitude ?? undefined,
      vector: createVectorFromMagnitudeAndDirection(speed ?? undefined, direction ?? undefined),
    };
  }

  private findSuitableCruiseLeg() {
    const loadedplanIndex = this.loadedFlightPlanIndex.get();
    const fp = this.props.fmcService.master.flightPlanInterface.has(loadedplanIndex)
      ? this.props.fmcService.master.flightPlanInterface.get(loadedplanIndex)
      : null;
    if (!fp) {
      this.selectedWaypointLegIndex.set(null);
      this.navigationWaypointLegIndex = null;
      this.availableWaypoints.set([]);
      this.availableWaypointsToLegIndex = [];
      this.availableWaypointsSize.set(0);
      return;
    } else {
      const legPredictions =
        loadedplanIndex === FlightPlanIndex.Active
          ? this.props.fmcService.master.guidanceController.vnavDriver.mcduProfile?.waypointPredictions
          : null;
      const waypoints: string[] = [];
      const waypointsLegIndexes: number[] = [];
      for (let i = fp.activeLegIndex; i < fp.firstMissedApproachLegIndex; i++) {
        const leg = fp.maybeElementAt(i);
        if (isLeg(leg) && leg.isXF()) {
          const legPrediction = legPredictions?.get(i);
          const isCruiseLeg =
            legPrediction !== undefined
              ? legPrediction.profilePhase === ProfilePhase.Cruise
              : leg.segment.class === SegmentClass.Enroute;
          if (isCruiseLeg) {
            waypointsLegIndexes.push(i);
            waypoints.push(leg.ident);
          }
        }
      }
      this.availableWaypoints.set(waypoints);
      this.availableWaypointsToLegIndex = waypointsLegIndexes;
      this.availableWaypointsSize.set(waypoints.length);

      // If a waypoint has been specified due to page navigation before, try to select it if it's still valid.
      if (this.navigationWaypointLegIndex !== null) {
        const isNavWaypointLegIndexValid = waypointsLegIndexes.includes(this.navigationWaypointLegIndex);
        if (isNavWaypointLegIndexValid) {
          this.selectedWaypointLegIndex.set(this.navigationWaypointLegIndex);
        }
        this.navigationWaypointLegIndex = null;
      }
      const selectedWaypoint = this.selectedWaypointLegIndex.get();
      // Select first if selection is not valid anymore or nothing was selected.
      if (selectedWaypoint === null || !waypointsLegIndexes.includes(selectedWaypoint)) {
        this.selectedWaypointLegIndex.set(waypointsLegIndexes.length > 0 ? waypointsLegIndexes[0] : null);
      }
    }
  }

  private confirmFlightPlanDraftWinds(insert: boolean) {
    const fpIndex = this.loadedFlightPlanIndex.get();
    const fp = this.props.fmcService.master.flightPlanInterface.has(fpIndex)
      ? this.props.fmcService.master.flightPlanInterface.get(fpIndex)
      : null;
    if (fp?.hasDraftWindEntries()) {
      if (insert) {
        fp?.insertDraftWindEntries();
      } else {
        fp?.deleteDraftWindEntries();
      }
    }
  }

  public render(): VNode {
    return (
      <>
        {super.render()}
        {/* begin page content */}
        <div class="mfd-page-container">
          <div style="height: 11px;" />
          <TopTabNavigator pageTitles={this.pageTitles} selectedPageIndex={this.selectedSubPage}>
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
                  disabled={this.historyWindsDisabled}
                />
              </div>
            </TopTabNavigatorPage>

            <TopTabNavigatorPage containerStyle="padding-bottom:3px;">
              {/* CLIMB */}
              <div class="mfd-fms-wind-page-container">
                <div class="mfd-fms-wind-page-title-container">
                  <span
                    class="mfd-fms-wind-page-draft-label mfd-label biggest"
                    style={{ visibility: this.draftWindLabelVisibility }}
                  >
                    DRAFT
                  </span>
                  <span class="mfd-label bigger">CLB WIND</span>
                </div>
                <MfdFmsWindPageTableHeader
                  headerDisplay={this.tableHeaderDisplay}
                  messageAreaDisplay={this.temporaryMessageAreaDisplay}
                />
                {MfdFmsWindPage.CLIMB_WIND_ENTRIES_ARRAY.map((value) => (
                  <div class={{ 'mfd-fms-wind-page-table-row': true, entry: true, first: value === 0 }}>
                    <div class="mfd-fms-wind-page-entry-row">
                      <div
                        class={{ 'mfd-fms-wind-altitude-entry-container': true, first: value === 0 }}
                        style={{
                          visibility: this.climbWindAltitudesVisibility[value],
                        }}
                      >
                        <InputField
                          containerStyle="width:157px; height:40px;"
                          alignText={'flex-start'}
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
                          tmpyActive={this.draftWindsExist}
                        ></InputField>
                      </div>
                      <div
                        class={{ 'mfd-fms-wind-direction-speed-entry-container': true, first: value === 0 }}
                        style={{ visibility: this.climbWindsSpeedDirectionVisibility[value] }}
                      >
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
                          canBeCleared={true}
                          tmpyActive={this.draftWindsExist}
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
                          canBeCleared={true}
                          tmpyActive={this.draftWindsExist}
                        ></InputField>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TopTabNavigatorPage>
            <TopTabNavigatorPage>
              {/* CRUISE */}
              <div class="mfd-fms-wind-page-container crz">
                <div class="mfd-fms-wind-page-crz-title-buttons-container">
                  <div class="mfd-fms-wind-page-crz-title-container">
                    <span
                      class="mfd-fms-wind-page-draft-label mfd-label biggest"
                      style={{ visibility: this.draftWindLabelVisibility }}
                    >
                      DRAFT
                    </span>
                    <span class="mfd-label bigger" style={{ position: 'relative', bottom: '3px' }}>
                      CRZ WIND AT
                    </span>
                  </div>
                  <div class="mfd-fms-wind-page-crz-dropdown-container">
                    <DropdownMenu
                      disabled={this.cruiseWindsDisabled}
                      inactive={this.cruiseWindsInactive}
                      values={this.availableWaypoints}
                      selectedIndex={this.dropdownMenuSelectedWaypointIndex}
                      errorOnNotInList={() => {
                        onEntryNotInList(this.props.fmcService);
                      }}
                      onModified={(v) => {
                        if (v !== null && v >= 0) {
                          this.selectedWaypointLegIndex.set(this.availableWaypointsToLegIndex[v]);
                          this.updatePage();
                        }
                      }}
                      idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_CruiseWindWaypointDropdown`}
                      keyboardEntryAllowed={true}
                      containerStyle="width: 192px; margin-right: 19px; "
                      numberOfDigitsForInputField={7}
                      alignLabels="center"
                      hEventConsumer={this.props.mfd.hEventConsumer}
                      interactionMode={this.props.mfd.interactionMode}
                    />
                  </div>
                  <div class="mfd-fms-wind-page-buttons-container">
                    <IconButton
                      icon="double-down"
                      disabled={this.selectNextDisabled}
                      onClick={() => {
                        const selectedIndex = this.dropdownMenuSelectedWaypointIndex.get();
                        if (selectedIndex !== null) {
                          const next = selectedIndex + 1;
                          if (next < this.availableWaypointsToLegIndex.length) {
                            this.selectedWaypointLegIndex.set(this.availableWaypointsToLegIndex[next]);
                            this.updatePage();
                          }
                        }
                      }}
                      containerStyle="width: 66px; height: 62px; margin-right: 6px;"
                    />
                    <IconButton
                      icon="double-up"
                      disabled={this.selectPreviousDisabled}
                      onClick={() => {
                        const selectedIndex = this.dropdownMenuSelectedWaypointIndex.get();
                        if (selectedIndex !== null) {
                          const prev = selectedIndex - 1;
                          if (prev >= 0 && prev < this.availableWaypointsToLegIndex.length) {
                            this.selectedWaypointLegIndex.set(this.availableWaypointsToLegIndex[prev]);
                            this.updatePage();
                          }
                        }
                      }}
                      containerStyle="width: 66px; height: 62px;"
                    />
                  </div>
                </div>
                <MfdFmsWindPageTableHeader
                  headerDisplay={this.tableHeaderDisplay}
                  messageAreaDisplay={this.temporaryMessageAreaDisplay}
                />
                {MfdFmsWindPage.CRUISE_WIND_ENTRIES_ARRAY.map((value) => (
                  <div class={{ 'mfd-fms-wind-page-table-row': true, entry: true, first: value === 0 }}>
                    <div class="mfd-fms-wind-page-entry-row">
                      <div
                        class={{ 'mfd-fms-wind-altitude-entry-container': true, first: value === 0 }}
                        style={{ visibility: this.cruiseWindAltitudesVisibility[value] }}
                      >
                        <InputField
                          alignText={'flex-start'}
                          containerStyle="width:157px; height:40px;"
                          inactive={this.cruiseWindRowAltitudeIsInactive[value]}
                          disabled={this.cruiseWindsDisabled}
                          onModified={(v) => {
                            this.onCruiseWindEntryModified(value, v, WindEntryData.Altitude);
                          }}
                          errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
                          hEventConsumer={this.props.mfd.hEventConsumer}
                          interactionMode={this.props.mfd.interactionMode}
                          dataEntryFormat={new WindFlightLevelFormat()}
                          value={this.displayedCruiseWindFlightLevels[value]}
                          canBeCleared={false}
                          tmpyActive={this.draftWindsExist}
                        ></InputField>
                      </div>
                      <div
                        class={{ 'mfd-fms-wind-direction-speed-entry-container': true, first: value === 0 }}
                        style={{ visibility: this.cruiseWindSpeedDirectionVisibility[value] }}
                      >
                        <InputField
                          containerStyle="height:42px; width:98px; margin-right:6px;"
                          inactive={this.cruiseWindsInactive}
                          disabled={this.cruiseWindsDisabled}
                          onModified={(v) => {
                            this.onCruiseWindEntryModified(value, v, WindEntryData.Direction);
                          }}
                          errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
                          hEventConsumer={this.props.mfd.hEventConsumer}
                          interactionMode={this.props.mfd.interactionMode}
                          dataEntryFormat={new WindDirectionFormat()}
                          value={this.displayedCruiseWindDirections[value]}
                          canBeCleared={true}
                          enteredByPilot={this.displayedCruiseWindVectorIsEnteredByPilot[value]}
                          tmpyActive={this.draftWindsExist}
                        ></InputField>
                        <InputField
                          containerStyle="height: 42px; width:115px;"
                          inactive={this.cruiseWindsInactive}
                          disabled={this.cruiseWindsDisabled}
                          onModified={(v) => {
                            this.onCruiseWindEntryModified(value, v, WindEntryData.Speed);
                          }}
                          errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
                          hEventConsumer={this.props.mfd.hEventConsumer}
                          interactionMode={this.props.mfd.interactionMode}
                          dataEntryFormat={new WindSpeedFormat()}
                          value={this.displayedCruiseWindSpeeds[value]}
                          canBeCleared={true}
                          enteredByPilot={this.displayedCruiseWindVectorIsEnteredByPilot[value]}
                          tmpyActive={this.draftWindsExist}
                        ></InputField>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div class="mfd-fms-wind-page-crz-temp-table">
                <div class="fr">
                  <div class="mfd-fms-wind-crz-temp-alt-header-container">
                    <span class="mfd-label bigger">ALT</span>
                  </div>
                  <div class="mfd-fms-wind-crz-temp-sat-header-container">
                    <span class="mfd-label bigger">SAT</span>
                  </div>
                </div>

                <div class="mfd-fms-wind-crz-temp-entry-container">
                  <InputField
                    alignText={'flex-start'}
                    containerStyle="width:157px; height:40px;"
                    inactive={false}
                    disabled={true}
                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                    dataEntryFormat={new FlightLevelFormat()}
                    canBeCleared={true}
                    value={this.cruiseTemperatureFlightLevel}
                    tmpyActive={this.draftWindsExist}
                  ></InputField>
                  <InputField
                    alignText={'flex-start'}
                    containerStyle="height:43px; width:113px;margin-left: 76px;"
                    inactive={false}
                    disabled={true}
                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                    dataEntryFormat={new TemperatureFormat()}
                    canBeCleared={true}
                    value={this.cruiseTemperature}
                    tmpyActive={this.draftWindsExist}
                  ></InputField>
                </div>
              </div>
            </TopTabNavigatorPage>
            <TopTabNavigatorPage>
              {/* DESCENT */}
              <div class="mfd-fms-wind-page-container">
                <div class="mfd-fms-wind-page-title-container">
                  <span
                    class="mfd-fms-wind-page-draft-label mfd-label biggest"
                    style={{ visibility: this.draftWindLabelVisibility }}
                  >
                    DRAFT
                  </span>
                  <span class="mfd-label bigger">DES WIND</span>
                </div>
                <MfdFmsWindPageTableHeader
                  headerDisplay={this.tableHeaderDisplay}
                  messageAreaDisplay={this.temporaryMessageAreaDisplay}
                />
                {MfdFmsWindPage.DESCENT_WIND_ENTRIES_ARRAY.map((value) => (
                  <div
                    class={{
                      'mfd-fms-wind-page-table-row': true,
                      des: value !== 0,
                      first: value === 0,
                      entry: value === 0,
                    }}
                  >
                    <div class="mfd-fms-wind-page-entry-row">
                      <div
                        class={{ 'mfd-fms-wind-altitude-entry-container': true, first: value === 0, des: value !== 0 }}
                        style={{ visibility: this.descentWindAltitudesVisibility[value] }}
                      >
                        <InputField
                          alignText={'flex-start'}
                          containerStyle="width:157px; height:40px;"
                          inactive={this.descentWindsInactive}
                          disabled={this.descentWindsDisabled}
                          onModified={(v) => {
                            this.onWindEntryModified(value, v, WindEntryData.Altitude, true);
                          }}
                          errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
                          hEventConsumer={this.props.mfd.hEventConsumer}
                          interactionMode={this.props.mfd.interactionMode}
                          dataEntryFormat={new WindAltitudeFormat(this.transitionLevel, true, this.arrivalElevation)}
                          value={this.displayedDescentWindAltitudes[value]}
                          canBeCleared={true}
                          tmpyActive={this.draftWindsExist}
                        ></InputField>
                      </div>
                      <div
                        class={{
                          'mfd-fms-wind-direction-speed-entry-container': true,
                          des: value !== 0,
                          first: value === 0,
                        }}
                        style={{ visibility: this.descentWindSpeedDirectionVisibility[value] }}
                      >
                        <InputField
                          containerStyle="height:42px; width:98px; margin-right:6px;"
                          inactive={this.descentWindsInactive}
                          disabled={this.descentWindsDisabled}
                          onModified={(v) => {
                            this.onWindEntryModified(value, v, WindEntryData.Direction, true);
                          }}
                          errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
                          hEventConsumer={this.props.mfd.hEventConsumer}
                          interactionMode={this.props.mfd.interactionMode}
                          dataEntryFormat={new WindDirectionFormat()}
                          value={this.displayedDescentWindDirections[value]}
                          canBeCleared={true}
                          tmpyActive={this.draftWindsExist}
                        ></InputField>
                        <InputField
                          containerStyle="height: 42px; width:115px;"
                          inactive={this.descentWindsInactive}
                          disabled={this.descentWindsDisabled}
                          onModified={(v) => {
                            this.onWindEntryModified(value, v, WindEntryData.Speed, true);
                          }}
                          errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
                          hEventConsumer={this.props.mfd.hEventConsumer}
                          interactionMode={this.props.mfd.interactionMode}
                          dataEntryFormat={new WindSpeedFormat()}
                          value={this.displayedDescentWindSpeeds[value]}
                          canBeCleared={true}
                          tmpyActive={this.draftWindsExist}
                        ></InputField>
                      </div>
                    </div>
                  </div>
                ))}
                <div class="mfd-fms-wind-alternate-row">
                  <span class="mfd-label bigger">ALTN TRIP WIND</span>
                  <div class="fr">
                    <div class="mfd-fms-wind-alternate-row-cruise-fl">
                      <span
                        class="mfd-label-unit bigger"
                        style={{ visibility: this.alternateWindFlightLevelUnitVisibility }}
                      >
                        FL
                      </span>
                      <span
                        class={{
                          'mfd-label': true,
                          green: this.alternateWindIsPrimaryFlightPlan,
                          biggest: true,
                        }}
                      >
                        {this.alternateCruiseFlightLevelDisplay}
                      </span>
                    </div>
                    <div class="mfd-fms-wind-direction-speed-entry-container no-margin">
                      <InputField
                        containerStyle="height:42px; width:98px; margin-right:6px;"
                        onModified={(v) => {
                          this.onAlternateWindModified(v, WindEntryData.Direction);
                        }}
                        errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
                        hEventConsumer={this.props.mfd.hEventConsumer}
                        interactionMode={this.props.mfd.interactionMode}
                        dataEntryFormat={new WindDirectionFormat()}
                        value={this.alternateWindDirection}
                        canBeCleared={true}
                        disabled={this.alternateWindDisabled}
                        tmpyActive={this.draftWindsExist}
                      ></InputField>
                      <InputField
                        containerStyle="height: 42px; width:115px;"
                        onModified={(v) => {
                          this.onAlternateWindModified(v, WindEntryData.Speed);
                        }}
                        tmpyActive={this.draftWindsExist}
                        errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
                        hEventConsumer={this.props.mfd.hEventConsumer}
                        interactionMode={this.props.mfd.interactionMode}
                        dataEntryFormat={new WindSpeedFormat()}
                        value={this.alternateWindSpeed}
                        disabled={this.alternateWindDisabled}
                        canBeCleared={true}
                      ></InputField>
                    </div>
                  </div>
                </div>
              </div>
            </TopTabNavigatorPage>
          </TopTabNavigator>
          <div class="mfd-fms-wind-bottom-buttons-container">
            <div class="mfd-fms-wind-return-cancel-wind-container">
              <div style={{ display: this.returnButtonDisplay }}>
                <Button
                  label="RETURN"
                  onClick={() => this.props.mfd.uiService.navigateTo('back')}
                  buttonStyle="width:125px;"
                  visible={this.returnButtonVisible}
                />
              </div>
              <div style={{ display: this.draftWindButtonDisplay }}>
                <Button
                  label={
                    <div style="display: flex; flex-direction: row; justify-content: space-between;">
                      <span
                        style="text-align: center; vertical-align: center; margin-right: 10px;"
                        class={{ 'mfd-fms-wind-draft-wind-button-text-amber': this.draftWindButtonIsAmber }}
                      >
                        CANCEL
                        <br />
                        WIND
                      </span>
                      <span style="display: flex; align-items: center; justify-content: center;">*</span>
                    </div>
                  }
                  onClick={() => this.confirmFlightPlanDraftWinds(false)}
                  visible={this.draftWindsExist}
                  buttonStyle="justify-self: flex-end; height:58px;"
                />
              </div>
            </div>
            <div class="mfd-fms-wind-cpny-button-container">
              <CpnyWindRequestButton
                fmc={this.props.fmcService.master}
                flightPlanIndex={this.loadedFlightPlanIndex}
                tmpyExists={this.tmpyActive}
                isActiveOrCopiedFromActive={this.fpIsActiveOrCopyOfActive}
              />
            </div>
            <div class="mfd-fms-wind-insert-button-container" style={{ display: this.draftWindButtonDisplay }}>
              <Button
                label={
                  <div style="display: flex; flex-direction: row; justify-content: space-between;">
                    <span
                      style="text-align: center; vertical-align: center; margin-right: 10px;"
                      class={{ 'mfd-fms-wind-draft-wind-button-text-amber': this.draftWindButtonIsAmber }}
                    >
                      INSERT
                      <br />
                      WIND
                    </span>
                    <span style="display: flex; align-items: center; justify-content: center;">*</span>
                  </div>
                }
                onClick={() => this.confirmFlightPlanDraftWinds(true)}
                visible={this.draftWindsExist}
                buttonStyle="justify-self: flex-end; height:58px;"
              />
            </div>
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
          class={{
            'mfd-fms-wind-page-table-message-area': true,
            'mfd-value': true,
            smaller: true,
            amber: true,
            history: this.props.isHistoryPage ?? false,
          }}
          style={{ display: this.props.messageAreaDisplay }}
        >
          WIND ENTRY NOT ALLOWED: TMPY F-PLN EXISTING
        </div>
      </div>
    );
  }
}
