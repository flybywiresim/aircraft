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
  Vec2Math,
  VNode,
} from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from '../../MFD';
import { FmsPage } from '../common/FmsPage';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/TopTabNavigator';
import { Footer } from '../common/Footer';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { onEntryNotInList, showReturnButtonUriExtra } from '../../shared/utils';
import { FmgcFlightPhase } from '@shared/flightphase';
import { isLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';
import './MfdFmsWindPage.scss';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import {
  createWindVector,
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
import { InputField } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';
import {
  FlightLevelFormat,
  TemperatureFormat,
  WindAltitudeFormat,
  WindDirectionFormat,
  WindFlightLevelFormat,
  WindSpeedFormat,
} from '../common/DataEntryFormats';
import { MathUtils } from '../../../../../../../../fbw-common/src/systems/shared/src/MathUtils';
import { CpnyWindRequestButton } from './CpnyWindButtonUtils';
import { FpmConfigs } from '@fmgc/flightplanning/FpmConfig';
import { ProfilePhase } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { NXSystemMessages } from '../../shared/NXSystemMessages';
import { DropdownMenu } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/DropdownMenu';
import { IconButton } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/IconButton';

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
}

export class MfdFmsWindPage extends FmsPage<MfdFmsWindProps> {
  private static readonly pageTitlesActiveFpln = ['HISTORY', 'CLB', 'CRZ', 'DES'];
  private static readonly pageTitlesSecondaryFpln = ['', 'CLB', 'CRZ', 'DES']; // Use an empty page title to skip the history page in SEC.

  // General Navigation
  private readonly pageTitles = Subject.create(MfdFmsWindPage.pageTitlesActiveFpln);
  private readonly selectedSubPage = Subject.create(WindSubPageMenu.Climb);
  private wasSecPreviouslyActive = false;
  private readonly returnButtonVisible = Subject.create(true);
  private readonly fpIsActiveOrCopyOfActive = Subject.create(false);
  private readonly draftWinds = MappedSubject.create(
    ([draftExists, loadedFpIndex]) => draftExists && loadedFpIndex === FlightPlanIndex.Active,
    this.props.fmcService.master.getDraftWindsExist(),
    this.loadedFlightPlanIndex,
  );
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
    () => ({ altitude: null, direction: null, speed: null, disabled: false, enteredByPilot: true }),
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
    () => ({ altitude: null, direction: null, speed: null, disabled: false }),
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
    const subPage = this.selectedSubPage.get();
    if (subPage === WindSubPageMenu.History) {
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
    } else if (subPage === WindSubPageMenu.Climb) {
      this.transitionAltitude.set(fp?.performanceData.transitionAltitude.get() ?? null);
      this.departureElevation.set(fp?.originAirport?.location.alt ?? null);
      this.climbWindsDisabled.set(fp === undefined || this.tmpyExists.get());
      this.climbWindsInactive.set(
        isActiveOrCopyOfActive && this.props.fmcService.master.fmgc.getFlightPhase() != FmgcFlightPhase.Preflight,
      );
      if (fp) {
        this.fillDisplayWindEntriesFromFlightPlan(
          this.props.flightPlanInterface.getClimbWindEntries(loadedFlightPlanIndex),
          this.climbWindDisplayEntries,
        );
      } else {
        this.clearAllDisplayWindEntries(this.climbWindDisplayEntries);
      }
      this.updateClimbWindDisplayRows();
      this.updateWindDisplayedEntriesVisibility(
        this.climbWindAltitudesVisible,
        this.climbWindsSpeedDirectionVisible,
        this.displayedClimbWindAltitudes,
      );
    } else if (subPage === WindSubPageMenu.Cruise) {
      this.findSuitableCruiseLeg();
      this.cruiseWindsDisabled.set(fp === undefined || this.tmpyExists.get() || this.availableWaypoints.length === 0);
      this.cruiseWindsInactive.set(
        isActiveOrCopyOfActive && this.props.fmcService.master.fmgc.getFlightPhase() > FmgcFlightPhase.Cruise,
      );
      const legIndex = this.selectedWaypointLegIndex.get();
      const winds =
        legIndex !== null
          ? this.props.flightPlanInterface.propagateWindsAt(legIndex, this.WindCache, loadedFlightPlanIndex)
          : null;
      this.clearAllCruiseDisplayWindEntries();
      if (winds !== null) {
        for (let i = 0; i < winds.length; i++) {
          const wind = winds[i];
          this.cruiseWindDisplayEntries[i].altitude = wind.altitude / 100;
          this.cruiseWindDisplayEntries[i].direction =
            wind.type !== PropagationType.Backward ? extractWindDirectionFromVector(wind.vector) : null;
          this.cruiseWindDisplayEntries[i].speed =
            wind.type !== PropagationType.Backward ? extractWindSpeedFromVector(wind.vector) : null;
          this.cruiseWindDisplayEntries[i].speedOrDirectionIsPropagated = wind.type === PropagationType.Forward;
          this.cruiseWindDisplayEntries[i].isPropagated = wind.type !== PropagationType.Entry;
        }
      }
      this.updateCruiseWindDisplayRows();
      this.updateWindDisplayedEntriesVisibility(
        this.cruiseWindAltitudesVisible,
        this.cruiseWindSpeedDirectionVisible,
        this.displayedCruiseWindFlightLevels,
      );
    } else if (subPage === WindSubPageMenu.Descent) {
      this.transitionLevel.set(fp?.performanceData.transitionLevel.get() ?? null);
      this.arrivalElevation.set(fp?.destinationAirport?.location.alt ?? null);
      this.descentWindsDisabled.set(fp === undefined || this.tmpyExists.get());
      this.descentWindsInactive.set(
        isActiveOrCopyOfActive && this.props.fmcService.master.fmgc.getFlightPhase() >= FmgcFlightPhase.Descent,
      );
      this.alternateWindIsPrimaryFlightPlan.set(loadedFlightPlanIndex === FlightPlanIndex.Active);
      const hasAlternate = fp?.alternateDestinationAirport !== undefined;
      const alternateWind = this.props.flightPlanInterface.getAlternateWind(loadedFlightPlanIndex);
      if (!hasAlternate) {
        this.alternateWindDirection.set(null);
        this.alternateWindSpeed.set(null);
      }
      this.alternateWindDisabled.set(!hasAlternate || this.tmpyExists.get());
      this.alternateCruiseFlightLevel.set(fp?.getAlternateCruiseLevel() ?? null);
      if (fp) {
        this.fillDisplayWindEntriesFromFlightPlan(
          this.props.flightPlanInterface.getDescentWindEntries(loadedFlightPlanIndex),
          this.descentWindDisplayEntries,
        );
        if (hasAlternate && alternateWind !== null) {
          this.alternateWindDirection.set(extractWindDirectionFromVector(alternateWind));
          this.alternateWindSpeed.set(extractWindSpeedFromVector(alternateWind));
        }
      } else {
        this.clearAllDisplayWindEntries(this.descentWindDisplayEntries);
      }
      this.updateDescentWindDisplayRows();
      this.updateWindDisplayedEntriesVisibility(
        this.descentWindAltitudesVisible,
        this.descentWindSpeedDirectionVisible,
        this.displayedDescentWindAltitudes,
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
      this.draftWinds.sub((v) => {
        if (v) {
          this.updatePage();
        }
      }),
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
      if (isLeg(leg)) {
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
    const success = this.props.fmcService.master.insertHistoryWinds();
    if (success) {
      this.selectedSubPage.set(WindSubPageMenu.Climb);
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

  private clearCruiseDisplayWindEntry(index: number) {
    const row = this.cruiseWindDisplayEntries[index];
    row.altitude = null;
    row.direction = null;
    row.speed = null;
    row.isPropagated = false;
    row.speedOrDirectionIsPropagated = false;
  }

  private clearAllCruiseDisplayWindEntries() {
    for (let i = 0; i < this.cruiseWindDisplayEntries.length; i++) {
      this.clearCruiseDisplayWindEntry(i);
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

  private shiftUpDisplayedCruiseWindEntriesFromIndex(index: number) {
    for (let i = index; i < this.cruiseWindDisplayEntries.length - 1; i++) {
      const next = this.cruiseWindDisplayEntries[i + 1];
      const current = this.cruiseWindDisplayEntries[i];
      current.altitude = next.altitude;
      current.direction = next.direction;
      current.speed = next.speed;
      current.isPropagated = next.isPropagated;
      current.speedOrDirectionIsPropagated = next.speedOrDirectionIsPropagated;
    }

    this.clearCruiseDisplayWindEntry(this.cruiseWindDisplayEntries.length - 1);
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

  private sortDisplayWindEntriesByAltitude(entries: WindDisplayEntry[]) {
    entries.sort((a, b) => (b.altitude ?? 0) - (a.altitude ?? 0));
  }

  private onWindEntryModified(index: number, value: number | null, dataType: WindEntryData, isDescentWind = false) {
    const displayEntries = isDescentWind ? this.descentWindDisplayEntries : this.climbWindDisplayEntries;
    const altitudesVisible = isDescentWind ? this.descentWindAltitudesVisible : this.climbWindAltitudesVisible;
    const speedDirectionVisible = isDescentWind
      ? this.descentWindSpeedDirectionVisible
      : this.climbWindsSpeedDirectionVisible;
    const displayedAltitudes = isDescentWind ? this.displayedDescentWindAltitudes : this.displayedClimbWindAltitudes;
    const displayEntry = displayEntries[index];
    const oldAltitude = displayEntry.altitude;
    // Altitude was cleared meaning we need to delete the entry and shift rows accordingly.
    if (value === null && dataType === WindEntryData.Altitude) {
      const existsInFlightPlan = oldAltitude !== null && displayEntry.direction !== null && displayEntry.speed !== null;
      this.shiftUpDisplayedWindEntriesFromIndex(displayEntries, index);
      if (existsInFlightPlan) {
        if (isDescentWind) {
          this.props.fmcService.master.flightPlanInterface.setDescentWindEntry(
            oldAltitude,
            null,
            this.loadedFlightPlanIndex.get(),
            true,
          );
        } else {
          this.props.fmcService.master.flightPlanInterface.setClimbWindEntry(
            oldAltitude,
            null,
            this.loadedFlightPlanIndex.get(),
          );
        }
      } else {
        // Draft entry which was not in the flightplan.
        if (isDescentWind) {
          this.updateDescentWindDisplayRows();
        } else {
          this.updateClimbWindDisplayRows();
        }
        this.updateWindDisplayedEntriesVisibility(altitudesVisible, speedDirectionVisible, displayedAltitudes);
      }
    } else {
      const currentAlt = dataType === WindEntryData.Altitude ? value : oldAltitude;
      const currentDir = dataType === WindEntryData.Direction ? value : displayEntry.direction;
      const currentSpeed = dataType === WindEntryData.Speed ? value : displayEntry.speed;
      displayEntry.altitude = currentAlt;
      displayEntry.direction = currentDir;
      displayEntry.speed = currentSpeed;
      if (dataType === WindEntryData.Altitude && currentAlt !== null && currentAlt !== oldAltitude) {
        displayEntry.enteredByPilot = true;
      }
      if (currentAlt !== null && currentDir != null && currentSpeed != null) {
        const altitudeChanged = oldAltitude !== currentAlt;
        if (altitudeChanged) {
          this.sortDisplayWindEntriesByAltitude(displayEntries);
        }
        const entry = this.getWindEntryFromValues(currentAlt, currentDir, currentSpeed);
        if (isDescentWind) {
          this.props.fmcService.master.flightPlanInterface.setDescentWindEntry(
            oldAltitude ?? currentAlt, // if old altitude is null, we know its a new user entry.
            entry,
            this.loadedFlightPlanIndex.get(),
            true,
          );
        } else {
          this.props.fmcService.master.flightPlanInterface.setClimbWindEntry(
            oldAltitude ?? currentAlt, // if old altitude is null, we know its a new user entry.
            entry,
            this.loadedFlightPlanIndex.get(),
          );
        }
        if (isDescentWind) {
          this.updateDescentWindDisplayRows();
        } else {
          this.updateClimbWindDisplayRows();
        }
        if (oldAltitude === null) {
          this.updateWindDisplayedEntriesVisibility(altitudesVisible, speedDirectionVisible, displayedAltitudes);
        }
      } else {
        const altitudeChanged = oldAltitude !== currentAlt;
        if (altitudeChanged) {
          this.sortDisplayWindEntriesByAltitude(displayEntries);
        }
        if (isDescentWind) {
          this.updateDescentWindDisplayRows();
        } else {
          this.updateClimbWindDisplayRows();
        }
        // Change visibility if it is a new entry or if it was cleared.
        if ((oldAltitude === null && currentAlt !== null) || currentAlt === null) {
          this.updateWindDisplayedEntriesVisibility(altitudesVisible, speedDirectionVisible, displayedAltitudes);
        }
      }
    }
  }

  private onCruiseWindEntryModified(index: number, value: number | null, dataType: WindEntryData) {
    const displayEntries = this.cruiseWindDisplayEntries;
    const displayEntry = displayEntries[index];
    const oldAltitude = displayEntry.altitude;
    const selectedLegIndex = this.selectedWaypointLegIndex.get();

    if (dataType === WindEntryData.Altitude && displayEntry.isPropagated) {
      // We should never enter here.
      console.log('Propagated cruise wind entry FL edit attempt.');
      this.props.fmcService.master.addMessageToQueue(NXSystemMessages.notAllowed, undefined, undefined);
      return;
    }

    // Altitude was cleared meaning we need to delete the entry and shift rows accordingly.
    if (value === null && dataType === WindEntryData.Altitude) {
      const existsInFlightPlan = oldAltitude !== null && displayEntry.direction !== null && displayEntry.speed !== null;
      this.shiftUpDisplayedCruiseWindEntriesFromIndex(index);
      if (existsInFlightPlan && selectedLegIndex !== null) {
        this.props.fmcService.master.flightPlanInterface.deleteCruiseWindEntry(
          selectedLegIndex,
          oldAltitude * 100,
          this.loadedFlightPlanIndex.get(),
        );
      } else {
        // Draft entry which was not in the flightplan.
        this.updateCruiseWindDisplayRows();
        this.updateWindDisplayedEntriesVisibility(
          this.cruiseWindAltitudesVisible,
          this.cruiseWindSpeedDirectionVisible,
          this.displayedCruiseWindFlightLevels,
        );
      }
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

      if (currentAlt !== null && currentDir != null && currentSpeed != null) {
        const altitudeChanged = oldAltitude !== currentAlt;
        if (altitudeChanged) {
          this.sortDisplayWindEntriesByAltitude(displayEntries);
        }
        const entry = this.getWindEntryFromValues(currentAlt, currentDir, currentSpeed);
        entry.altitude *= 100;
        const existedInFlightPlan =
          oldAltitude !== null && displayEntry.direction !== null && displayEntry.speed !== null;

        if (selectedLegIndex !== null) {
          if (existedInFlightPlan) {
            this.props.fmcService.master.flightPlanInterface.editCruiseWindEntry(
              selectedLegIndex,
              oldAltitude * 100,
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
        this.updateCruiseWindDisplayRows();
        if (oldAltitude === null) {
          this.updateWindDisplayedEntriesVisibility(
            this.cruiseWindAltitudesVisible,
            this.cruiseWindSpeedDirectionVisible,
            this.displayedCruiseWindFlightLevels,
          );
        }
      } else {
        const altitudeChanged = oldAltitude !== currentAlt;
        if (altitudeChanged) {
          this.sortDisplayWindEntriesByAltitude(displayEntries);
        }
        this.updateCruiseWindDisplayRows();
        // Change visibility if it is a new entry or if it was cleared.
        if ((oldAltitude === null && currentAlt !== null) || currentAlt === null) {
          this.updateWindDisplayedEntriesVisibility(
            this.cruiseWindAltitudesVisible,
            this.cruiseWindSpeedDirectionVisible,
            this.displayedCruiseWindFlightLevels,
          );
        }
      }
    }
  }

  private onAlternateWindModified(value: number | null, dataType: WindEntryData) {
    const currentDir = dataType === WindEntryData.Direction ? value : this.alternateWindDirection.get();
    const currentSpeed = dataType === WindEntryData.Speed ? value : this.alternateWindSpeed.get();
    if (dataType === WindEntryData.Direction) {
      this.alternateWindDirection.set(value);
    } else if (dataType === WindEntryData.Speed) {
      this.alternateWindSpeed.set(value);
    }
    if (currentDir !== null && currentSpeed !== null) {
      this.props.fmcService.master.flightPlanInterface.setAlternateWind(
        createWindVector(currentDir, currentSpeed),
        this.loadedFlightPlanIndex.get(),
      );
    } else {
      this.props.fmcService.master.flightPlanInterface.setAlternateWind(null, this.loadedFlightPlanIndex.get());
    }
  }

  /**
   * Updates displayed entry visibility based upon whether the previous entry has an altitude.
   * The first row is always displayed.
   */
  private updateWindDisplayedEntriesVisibility(
    altitudeVisible: Subject<boolean>[],
    speedDirectionVisible: Subject<boolean>[],
    altitudes: Subject<number | null>[],
  ) {
    for (let i = 0; i < altitudeVisible.length; i++) {
      altitudeVisible[i].set(i === 0 || altitudes[i - 1].get() !== null);
      speedDirectionVisible[i].set(i === 0 || altitudes[i].get() !== null);
    }
  }

  private getWindEntryFromValues(altitude: number, direction: number, speed: number): WindEntry {
    return {
      altitude: altitude,
      vector: Vec2Math.setFromPolar(speed, direction * MathUtils.DEGREES_TO_RADIANS, Vec2Math.create()),
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
      } else {
        const selectedWaypoint = this.selectedWaypointLegIndex.get();
        // Select first if selection is not valid anymore or nothing was selected.
        if (selectedWaypoint === null || !waypointsLegIndexes.includes(selectedWaypoint)) {
          this.selectedWaypointLegIndex.set(waypointsLegIndexes.length > 0 ? waypointsLegIndexes[0] : null);
        }
      }
      this.navigationWaypointLegIndex = null;
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
            <TopTabNavigatorPage>
              {/* CRUISE */}
              <div class="mfd-fms-wind-page-container crz">
                <div class="mfd-fms-wind-page-crz-title-buttons-container">
                  <div class="mfd-fms-wind-page-crz-title-container">
                    <span class="mfd-label bigger">{this.displayedWindHeader}</span>
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
                          canBeCleared={true}
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
                          canBeCleared={false}
                          enteredByPilot={this.displayedCruiseWindVectorIsEnteredByPilot[value]}
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
                          canBeCleared={false}
                          enteredByPilot={this.displayedCruiseWindVectorIsEnteredByPilot[value]}
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
                  ></InputField>
                </div>
              </div>
            </TopTabNavigatorPage>
            <TopTabNavigatorPage>
              {/* DESCENT */}
              <div class="mfd-fms-wind-page-container">
                <div class="mfd-fms-wind-page-title-container">
                  <span class="mfd-label bigger">{this.displayedWindHeader}</span>
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
                          canBeCleared={false}
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
                          canBeCleared={false}
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
                      ></InputField>
                      <InputField
                        containerStyle="height: 42px; width:115px;"
                        onModified={(v) => {
                          this.onAlternateWindModified(v, WindEntryData.Speed);
                        }}
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
