// Copyright (c) 2024-2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.
import {
  ArraySubject,
  ClockEvents,
  ComponentProps,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  MathUtils,
  NodeReference,
  NumberFormatter,
  NumberUnitInterface,
  NumberUnitSubject,
  SimpleUnit,
  Subject,
  Subscribable,
  Subscription,
  Unit,
  UnitFamily,
  UnitType,
  VNode,
} from '@microsoft/msfs-sdk';

import './MfdFmsFpln.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { Button, ButtonMenuItem } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { IconButton } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/IconButton';
import { ContextMenu, ContextMenuElement } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/ContextMenu';
import { FplnRevisionsMenuType, getRevisionsMenu } from 'instruments/src/MFD/pages/FMS/F-PLN/FplnRevisionsMenu';
import { DestinationWindow } from 'instruments/src/MFD/pages/FMS/F-PLN/DestinationWindow';
import { InsertNextWptFromWindow, NextWptInfo } from 'instruments/src/MFD/pages/FMS/F-PLN/InsertNextWptFrom';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';
import { PseudoWaypoint } from '@fmgc/guidance/PseudoWaypoint';
import { Coordinates, bearingTo } from 'msfs-geo';
import { FmgcFlightPhase } from '@shared/flightphase';
import {
  Units,
  LegType,
  TurnDirection,
  AltitudeDescriptor,
  AltitudeConstraint,
  SpeedConstraint,
  NXDataStore,
} from '@flybywiresim/fbw-sdk';
import { MfdFmsFplnVertRev } from 'instruments/src/MFD/pages/FMS/F-PLN/MfdFmsFplnVertRev';
import { ConditionalComponent } from '../../../../MsfsAvionicsCommon/UiWidgets/ConditionalComponent';
import { InternalKccuKeyEvent } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import {
  formatWindPredictionDirection,
  formatWindPredictionMagnitude,
  TailwindComponent,
  WindVector,
} from '@fmgc/flightplanning/data/wind';
import { dirToUri, fixInfoUri } from '../../../shared/utils';
import { ReadonlyFlightPlanElement } from '@fmgc/flightplanning/legs/ReadonlyFlightPlanLeg';
import { FlightPlanOperationEvents } from '@fmgc/events/FlightPlanOperationEvents';

interface MfdFmsFplnProps extends AbstractMfdPageProps {}

export interface DerivedFplnLegData {
  trackFromLastWpt: number | null;
  distanceFromLastWpt: number | null;
}

export class MfdFmsFpln extends FmsPage<MfdFmsFplnProps> {
  private readonly weightUnit = NXDataStore.getSetting('CONFIG_USING_METRIC_UNIT').map((v) =>
    v ? UnitType.KILOGRAM : UnitType.POUND,
  );
  private readonly weightUnitText = this.weightUnit.map((v) => (v === UnitType.KILOGRAM ? 'T' : 'KLB'));

  private readonly weightFormatter = NumberFormatter.create({
    nanString: '---.-',
    precision: 0.1,
  });

  private readonly lineColor = Subject.create<FplnLineColor>(FplnLineColor.Active);

  private readonly spdAltEfobWindRef = FSComponent.createRef<HTMLDivElement>();

  private readonly displayEfobAndWind = Subject.create<boolean>(false);

  private readonly trueTrackEnabled = Subject.create<boolean>(false);

  private readonly efobAndWindButtonMenuItems = Subject.create<ButtonMenuItem[]>([
    {
      action: () => this.displayEfobAndWind.set(!this.displayEfobAndWind.get()),
      label: this.displayEfobAndWind.map((v) => (v ? 'SPD\xa0\xa0\xa0\xa0\xa0ALT' : 'EFOB\xa0\xa0\xa0\xa0T.WIND')),
    },
  ]);

  private readonly lineData: FplnLineDisplayData[] = [];

  private readonly renderedLineData = [
    Subject.create<FplnLineDisplayData | null>(null),
    Subject.create<FplnLineDisplayData | null>(null),
    Subject.create<FplnLineDisplayData | null>(null),
    Subject.create<FplnLineDisplayData | null>(null),
    Subject.create<FplnLineDisplayData | null>(null),
    Subject.create<FplnLineDisplayData | null>(null),
    Subject.create<FplnLineDisplayData | null>(null),
    Subject.create<FplnLineDisplayData | null>(null),
    Subject.create<FplnLineDisplayData | null>(null),
  ];

  private lastRenderedActiveLegIndex: number | null = null;

  private lastRenderedFpVersion: number | null = null;

  private readonly derivedFplnLegData: DerivedFplnLegData[] = [];

  private readonly linesDivRef = FSComponent.createRef<HTMLDivElement>();

  private readonly tmpyLineRef = FSComponent.createRef<HTMLDivElement>();

  private readonly destButtonLabel = Subject.create<string>('');

  private readonly destNotLoaded = Subject.create<boolean>(true);

  private readonly destTime = Subject.create<Date | null>(null);

  private readonly destTimeLabel = this.destTime.map((v) =>
    v !== null
      ? `${v.getUTCHours().toString().padStart(2, '0')}:${v.getUTCMinutes().toString().padStart(2, '0')}`
      : '--:--',
  );

  private readonly destTimeNotAvailAndInActive = MappedSubject.create(
    ([tmpy, time, fpIndex]) => !tmpy && time == null && fpIndex === FlightPlanIndex.Active,
    this.tmpyActive,
    this.destTime,
    this.loadedFlightPlanIndex,
  );

  private readonly destEfob = NumberUnitSubject.create(UnitType.KILOGRAM.createNumber(NaN));
  private readonly destEfobLabel = this.createWeightSubscribable(this.destEfob);

  private readonly destEfobNotAvailableAndInActive = MappedSubject.create(
    ([tmpy, efob, fpIndex]) => !tmpy && isNaN(efob.number) && fpIndex === FlightPlanIndex.Active,
    this.tmpyActive,
    this.destEfob,
    this.loadedFlightPlanIndex,
  );

  private readonly destEfobUnitVisiblity = this.destEfob.map((v) => (isNaN(v.number) ? 'hidden' : 'visible'));

  private readonly distanceToDest = Subject.create<number | null>(null);

  private readonly distanceToDestLabel = this.distanceToDest.map((v) => (v !== null ? v.toFixed(0) : '----'));

  private readonly distanceToDestNotAvailInActive = MappedSubject.create(
    ([tmpy, distance, fpIndex]) => !tmpy && distance == null && fpIndex === FlightPlanIndex.Active,
    this.tmpyActive,
    this.distanceToDest,
    this.loadedFlightPlanIndex,
  );

  private readonly distanceToDestUnitVisibility = this.distanceToDest.map((v) => (v == null ? 'hidden' : 'visible'));

  private readonly displayFplnFromLineIndex = Subject.create<number>(0);

  private lastRenderedDisplayLineIndex: number = -1;

  private readonly disabledScrollDown = Subject.create(true);

  private readonly disabledScrollUp = Subject.create(false);

  private readonly revisionsMenuRef = FSComponent.createRef<ContextMenu>();

  private readonly revisionsMenuValues = Subject.create<ContextMenuElement[]>([]);

  private readonly revisionsMenuOpened = Subject.create<boolean>(false);

  private readonly newDestWindowOpened = Subject.create<boolean>(false);

  private readonly insertNextWptWindowOpened = Subject.create<boolean>(false);

  private readonly nextWptAvailableWaypoints = ArraySubject.create<NextWptInfo>([]);

  private readonly renderedFplnLines: NodeReference<FplnLegLine>[] = [];

  private readonly lineColorIsTemporary = this.lineColor.map((it) => it === FplnLineColor.Temporary);

  private readonly showInitButton = MappedSubject.create(
    ([flightPhase, loadedFlightPlan]) =>
      flightPhase === FmgcFlightPhase.Preflight &&
      (loadedFlightPlan === FlightPlanIndex.Active || loadedFlightPlan === FlightPlanIndex.Temporary),
    this.activeFlightPhase,
    this.loadedFlightPlanIndex,
  );

  private readonly flightplanTimeHeader = this.activeFlightPhase.map((v) =>
    v === FmgcFlightPhase.Preflight || v === FmgcFlightPhase.Done ? 'TIME' : 'UTC',
  );

  private readonly endOfFlightPlan: FplnLineDisplayData = {
    type: FplnLineType.Special,
    originalLegIndex: null,
    label: 'END OF F-PLN',
  };

  private readonly noAlternateFlightPlan: FplnLineDisplayData = {
    type: FplnLineType.Special,
    originalLegIndex: null,
    label: 'NO ALTN F-PLN',
  };

  private readonly discontinuityLabel = 'DISCONTINUITY';

  private emptyFlightPlanRendered = false;

  private readonly destEfobAmber = Subject.create(false);

  private readonly isActiveFlightPlan = this.loadedFlightPlanIndex.map((idx) => idx === FlightPlanIndex.Active);

  private createWeightSubscribable(
    value: NumberUnitSubject<UnitFamily.Weight, SimpleUnit<UnitFamily.Weight>>,
  ): MappedSubject<
    [NumberUnitInterface<UnitFamily.Weight, SimpleUnit<UnitFamily.Weight>>, Unit<UnitFamily.Weight>],
    string
  > {
    return MappedSubject.create(
      ([value, weightUnit]) => this.weightFormatter(value.asUnit(weightUnit) / 1000),
      value,
      this.weightUnit,
    );
  }

  protected onNewData(): void {
    if (!this.loadedFlightPlan) {
      return;
    }

    // update(...) is the most costly function. First performance improvement: Don't render everything completely new every time, just update with refs
    // Delete and re-render FPLN lines only if:
    // a) activeLegIndex changes
    // b) flight plan version was increased
    // c) list was scrolled up or down
    const activeLegIndexChanged = this.lastRenderedActiveLegIndex !== this.loadedFlightPlan.activeLegIndex;
    const fpVersionIncreased = this.lastRenderedFpVersion !== this.loadedFlightPlan.version;
    const listWasScrolled = this.lastRenderedDisplayLineIndex !== this.displayFplnFromLineIndex.get();
    const onlyUpdatePredictions = !(activeLegIndexChanged || fpVersionIncreased || listWasScrolled);

    // If we somehow ended up before the FROM waypoint, also update the internal state. Triggers a call of this function, so we can stop this call.
    if (this.displayFplnFromLineIndex.get() < this.loadedFlightPlan.activeLegIndex - 1) {
      this.displayFplnFromLineIndex.set(this.loadedFlightPlan.activeLegIndex - 1);
      return;
    }

    // If we ended beyond flightplan end due to TMPY deletion, scroll back to last element of the flightplan
    const lastAllowableIndex = this.lineData.length;
    if (this.displayFplnFromLineIndex.get() > lastAllowableIndex) {
      this.displayFplnFromLineIndex.set(lastAllowableIndex);
      return;
    }

    this.update(this.displayFplnFromLineIndex.get(), onlyUpdatePredictions);

    this.lastRenderedActiveLegIndex = this.loadedFlightPlan.activeLegIndex ?? null;
    this.lastRenderedFpVersion = this.loadedFlightPlan.version ?? null;
    this.lastRenderedDisplayLineIndex = this.displayFplnFromLineIndex.get();
    const hasDestination = this.loadedFlightPlan.destinationAirport !== undefined;
    const loadedFpIndex = this.loadedFlightPlanIndex.get();

    if (hasDestination) {
      this.destNotLoaded.set(false);
      this.distanceToDest.set(
        this.props.fmcService.master?.fmgc?.guidanceController?.getAlongTrackDistanceToDestination(loadedFpIndex) ??
          null,
      );
      if (this.loadedFlightPlan.destinationRunway) {
        this.destButtonLabel.set(
          `${this.loadedFlightPlan.destinationRunway.airportIdent}${this.loadedFlightPlan.destinationRunway.ident.substring(4)}`,
        );
      } else {
        this.destButtonLabel.set(this.loadedFlightPlan.destinationAirport!.ident);
      }
    } else {
      this.destNotLoaded.set(true);
      this.destButtonLabel.set('------');
    }

    // TODO SEC predictions
    const destPred =
      loadedFpIndex === FlightPlanIndex.Active
        ? this.props.fmcService?.master?.guidanceController?.vnavDriver?.getDestinationPrediction()
        : null;
    if (destPred) {
      this.destEfobAmber.set(this.props.fmcService.master.fmgc.data.destEfobBelowMinInActive.get());
      this.destTime.set(new Date(this.predictionTimestamp(destPred.secondsFromPresent)));
      this.destEfob.set(destPred.estimatedFuelOnBoard ?? NaN, UnitType.POUND);
    } else {
      this.destEfob.set(NaN);
      this.destTime.set(null);
      this.destEfobAmber.set(false);
    }
    this.checkScrollButtons();
  }

  private update(startAtIndex: number, onlyUpdatePredictions = true): void {
    let startAtIndexChecked = 0;
    let shouldOnlyUpdatePredictions: boolean;
    if (!this.loadedFlightPlan || this.loadedFlightPlan.legCount === 0) {
      if (!this.emptyFlightPlanRendered) {
        this.lineData.length = 0;

        this.lineData.push({
          type: FplnLineType.Waypoint,
          ident: 'P.POS',
          originalLegIndex: null,
          isPseudoWaypoint: false,
          isAltnWaypoint: false,
          isMissedAppchWaypoint: false,
          distFromLastWpt: null,
          holdSpeed: null,
          immExit: false,
          decelSequenced: false,
        });

        this.lineData.push({
          type: FplnLineType.Special,
          label: this.discontinuityLabel,
          originalLegIndex: null,
        });

        this.lineData.push(this.endOfFlightPlan);

        this.lineData.push(this.noAlternateFlightPlan);
        shouldOnlyUpdatePredictions = false;
        this.emptyFlightPlanRendered = true;
      } else {
        return;
      }
    } else {
      shouldOnlyUpdatePredictions = this.lineData !== undefined && onlyUpdatePredictions;

      // Make sure that you can't scroll higher than the FROM wpt
      startAtIndexChecked =
        startAtIndex < (this.loadedFlightPlan.activeLegIndex ?? 1) - 1
          ? (this.loadedFlightPlan.activeLegIndex ?? 1) - 1
          : startAtIndex;

      // Compute rest of required attributes
      this.derivedFplnLegData.length = 0;
      let lastDistanceFromStart: number = 0;
      let lastLegLatLong: Coordinates = { lat: 0, long: 0 };
      // Construct leg data for all legs
      const jointFlightPlan = this.loadedFlightPlan.allLegs.concat(
        this.loadedAlternateFlightPlan?.allLegs as ReadonlyFlightPlanElement[],
      );

      if (!jointFlightPlan.length) {
        return;
      }

      this.emptyFlightPlanRendered = false;

      jointFlightPlan.forEach((el, index) => {
        const newEl: DerivedFplnLegData = { distanceFromLastWpt: null, trackFromLastWpt: null };

        if (
          index === this.loadedFlightPlan?.allLegs.length ||
          index === this.loadedFlightPlan?.firstMissedApproachLegIndex
        ) {
          // Reset distance accumulation for ALTN flight plan and for missed apch
          lastDistanceFromStart = 0;
        }

        if (
          el instanceof FlightPlanLeg &&
          index <
            (this.loadedFlightPlan?.legCount ?? 0) +
              (this.props.flightPlanInterface.get(this.loadedFlightPlanIndex.get()).alternateFlightPlan.legCount ?? 0)
        ) {
          if (index === 0 || el.calculated === undefined) {
            newEl.distanceFromLastWpt = null;
            newEl.trackFromLastWpt = null;
          } else {
            newEl.distanceFromLastWpt = el.calculated.cumulativeDistanceWithTransitions - lastDistanceFromStart;
            newEl.trackFromLastWpt = el.definition.waypoint
              ? bearingTo(lastLegLatLong, el.definition.waypoint.location)
              : null;
          }

          if (el.calculated !== undefined) {
            lastDistanceFromStart = el?.calculated?.cumulativeDistanceWithTransitions ?? lastDistanceFromStart;
            lastLegLatLong = el.definition.waypoint?.location ?? lastLegLatLong;
          }
        } else {
          newEl.distanceFromLastWpt = null;
          newEl.trackFromLastWpt = null;
        }

        this.derivedFplnLegData.push(newEl);
      });

      this.lineData.length = 0;

      // Prepare sequencing of pseudo waypoints
      const pseudoWptMap = new Map<number, PseudoWaypoint>();
      const fpIndex = this.loadedFlightPlanIndex.get();
      //TODO SEC or TMPY predictions
      const isActive = fpIndex === FlightPlanIndex.Active;
      if (isActive) {
        // Insert pseudo waypoints from guidance controller
        this.props.fmcService?.master?.guidanceController?.pseudoWaypoints?.pseudoWaypoints?.forEach((wpt) =>
          pseudoWptMap.set(wpt.alongLegIndex, wpt),
        );
      }
      lastDistanceFromStart = 0;

      for (let i = 0; i < jointFlightPlan.length; i++) {
        const leg = jointFlightPlan[i];
        const isAltn = i >= (this.loadedFlightPlan.allLegs.length ?? 0);
        let reduceDistanceBy = 0;
        const pred = isActive
          ? this.props.fmcService?.master?.guidanceController?.vnavDriver?.mcduProfile?.waypointPredictions?.get(i)
          : null;

        const pwp = pseudoWptMap.get(i);
        if (pwp && pwp.displayedOnMcdu) {
          reduceDistanceBy = (pwp.flightPlanInfo?.distanceFromStart ?? 0) - lastDistanceFromStart;
          const data: FplnLineWaypointDisplayData = {
            type: FplnLineType.Waypoint,
            originalLegIndex: null,
            isPseudoWaypoint: true,
            isAltnWaypoint: isAltn,
            isMissedAppchWaypoint: isAltn
              ? i >= (this.loadedAlternateFlightPlan?.firstMissedApproachLegIndex ?? Infinity)
              : i >= (this.loadedFlightPlan?.firstMissedApproachLegIndex ?? Infinity),
            ident: pwp.mcduIdent ?? pwp.ident,
            overfly: false,
            annotation: pwp.mcduHeader ?? '',
            etaOrSecondsFromPresent: this.predictionTimestamp(pwp.flightPlanInfo?.secondsFromPresent ?? 0),
            transitionAltitude: this.loadedFlightPlan.performanceData.transitionAltitude.get(),
            altitudePrediction: pwp.flightPlanInfo?.altitude ?? null,
            hasAltitudeConstraint: false, // TODO
            altitudeConstraint: null, // TODO
            altitudeConstraintIsRespected: true,
            speedPrediction: pwp.flightPlanInfo?.speed ?? null,
            hasSpeedConstraint: (pwp.mcduIdent ?? pwp.ident) === '(SPDLIM)',
            speedConstraint: null, // TODO
            speedConstraintIsRespected: true,
            efobPrediction: Units.poundToKilogram(pred?.estimatedFuelOnBoard ?? NaN),
            windPrediction: pwp.flightPlanInfo?.windPrediction ?? null,
            trackFromLastWpt: this.derivedFplnLegData[i].trackFromLastWpt,
            distFromLastWpt: reduceDistanceBy,
            fpa: null,
          };
          lastDistanceFromStart = pwp.flightPlanInfo?.distanceFromStart ?? 0;
          this.lineData.push(data);
        }

        if (leg instanceof FlightPlanLeg) {
          const transAlt = this.loadedFlightPlan.performanceData.transitionAltitude.get();
          const transLevel = this.loadedFlightPlan.performanceData.transitionLevel.get();
          const transLevelAsAlt = transLevel !== null && transLevel !== undefined ? transLevel * 100 : null;
          const useTransLevel = i >= this.loadedFlightPlan.lastEnrouteLegIndex;
          const firstMissedApproachLegIndex = this.loadedAlternateFlightPlan?.firstMissedApproachLegIndex ?? 0;
          const isMissedApproachWaypoint = isAltn
            ? i >= firstMissedApproachLegIndex
            : i >= this.loadedFlightPlan.firstMissedApproachLegIndex;
          const isHM = leg.type === LegType.HM;
          if (isHM) {
            const loadedFpIndex = this.loadedFlightPlanIndex.get();
            const holdData: FplnLineHoldDisplayData = {
              type: FplnLineType.HoldHm,
              originalLegIndex: i,
              isAltnWaypoint: isAltn,
              isMissedAppchWaypoint: isMissedApproachWaypoint,
              ident: leg.definition.turnDirection === TurnDirection.Left ? 'HOLD L' : 'HOLD R',
              distFromLastWpt: leg.definition.length ?? null,
              holdSpeed: this.props.fmcService.master?.acInterface.getLegHoldingSpeed(i, loadedFpIndex) ?? null,
              immExit: this.loadedFlightPlan.legElementAt(i).holdImmExit,
              decelSequenced:
                loadedFpIndex === FlightPlanIndex.Active &&
                i === this.loadedFlightPlan.activeLegIndex + 1 &&
                this.props.fmcService.master?.acInterface.getHoldDecelReached(),
              isActiveLeg: loadedFpIndex === FlightPlanIndex.Active && i === this.loadedFlightPlan.activeLegIndex,
            };
            this.lineData.push(holdData);
          }

          const derivedData = this.derivedFplnLegData[i];
          let annotation = '';
          if (!isHM) {
            // TODO check if necessary for HA and HF legs.
            annotation = leg.annotation;
          } else {
            const inboundCrs = leg.modifiedHold?.inboundMagneticCourse ?? leg.defaultHold?.inboundMagneticCourse;
            if (inboundCrs !== undefined) {
              annotation = 'C' + inboundCrs.toFixed(0).padStart(3, '0') + '°\xa0\xa0';
            }
          }

          const data: FplnLineWaypointDisplayData = {
            type: FplnLineType.Waypoint,
            originalLegIndex: isAltn ? i - this.loadedFlightPlan.legCount : i,
            isPseudoWaypoint: false,
            isAltnWaypoint: isAltn,
            isActiveHoldFix: isHM && i === this.loadedFlightPlan.activeLegIndex,
            isMissedAppchWaypoint: isMissedApproachWaypoint,
            ident: leg.ident,
            overfly: leg.definition.overfly,
            annotation: annotation,
            etaOrSecondsFromPresent: this.predictionTimestamp(pred?.secondsFromPresent ?? 0),
            transitionAltitude: useTransLevel ? transLevelAsAlt : transAlt,
            altitudePrediction: pred?.altitude ?? null,
            hasAltitudeConstraint: leg.altitudeConstraint !== undefined,
            altitudeConstraint: leg.altitudeConstraint ?? null,
            altitudeConstraintIsRespected: pred?.isAltitudeConstraintMet ?? true,
            speedPrediction: pred?.speed ?? null,
            hasSpeedConstraint: leg.speedConstraint !== undefined,
            speedConstraint: leg.speedConstraint ?? null,
            speedConstraintIsRespected: pred?.isSpeedConstraintMet ?? true,
            efobPrediction: pred?.estimatedFuelOnBoard ? Units.poundToKilogram(pred?.estimatedFuelOnBoard) : NaN,
            windPrediction: pred?.windPrediction ?? null,
            trackFromLastWpt: derivedData.trackFromLastWpt,
            distFromLastWpt: (derivedData.distanceFromLastWpt ?? -reduceDistanceBy) - reduceDistanceBy,
            fpa: leg.definition.verticalAngle ?? null,
          };
          lastDistanceFromStart = lastDistanceFromStart + (derivedData.distanceFromLastWpt ?? 0) - reduceDistanceBy;
          lastDistanceFromStart =
            leg?.calculated?.cumulativeDistanceWithTransitions ??
            lastDistanceFromStart + (derivedData.distanceFromLastWpt ?? 0) - reduceDistanceBy;
          this.lineData.push(data);

          if (leg.calculated?.endsInTooSteepPath) {
            this.lineData.push({
              type: FplnLineType.Special,
              originalLegIndex: null,
              label: 'TOO STEEP PATH',
            });
          }
        } else {
          const data: FplnLineSpecialDisplayData = {
            type: FplnLineType.Special,
            originalLegIndex: isAltn ? i - this.loadedFlightPlan.legCount : i,
            label: this.discontinuityLabel,
          };
          this.lineData.push(data);
        }

        // Identify end of F-PLN
        if (i === this.loadedFlightPlan.allLegs.length - 1) {
          this.lineData.push(this.endOfFlightPlan);

          if (this.loadedAlternateFlightPlan?.allLegs.length === 0) {
            this.lineData.push(this.noAlternateFlightPlan);
          }
        }

        // Identify end of ALTN F-PLN
        if ((this.loadedAlternateFlightPlan?.allLegs.length ?? 0) > 0 && i === jointFlightPlan.length - 1) {
          this.lineData.push({ type: FplnLineType.Special, originalLegIndex: null, label: 'END OF ALTN F-PLN' });
        }
      }
    }

    // Delete all lines only if re-render is neccessary.
    if (!shouldOnlyUpdatePredictions && this.linesDivRef.getOrDefault()) {
      while (this.linesDivRef.instance.firstChild) {
        this.linesDivRef.instance.removeChild(this.linesDivRef.instance.firstChild);
      }
      this.renderedFplnLines.forEach((line) => {
        line.instance.destroy();
      });

      this.renderedFplnLines.length = 0;
    }

    const untilLegIndex = Math.min(this.lineData.length, startAtIndexChecked + (this.tmpyActive.get() ? 8 : 9));
    for (let drawIndex = startAtIndexChecked; drawIndex < untilLegIndex; drawIndex++) {
      if (drawIndex > this.lineData.length - 1) {
        // Insert empty line
        if (!shouldOnlyUpdatePredictions && this.linesDivRef.getOrDefault()) {
          FSComponent.render(<div />, this.linesDivRef.instance);
        }
      } else {
        const lineIndex = drawIndex - startAtIndexChecked;

        const previousRow = drawIndex > 0 ? this.lineData[drawIndex - 1] : null;
        const previousIsSpecial = previousRow ? previousRow.type === FplnLineType.Special : false;
        const nextRow = drawIndex < this.lineData.length - 1 ? this.lineData[drawIndex + 1] : null;
        const nextIsSpecial = nextRow ? nextRow.type === FplnLineType.Special : false;
        const lineData = this.lineData[drawIndex];

        let flags = FplnLineFlags.None;
        if (lineIndex === 0) {
          flags |= FplnLineFlags.FirstLine;
        }
        if (previousIsSpecial) {
          flags |= FplnLineFlags.AfterSpecial;
        }
        if (lineIndex === (this.tmpyActive.get() ? 7 : 8)) {
          flags |= FplnLineFlags.LastLine;
        }
        if (nextIsSpecial) {
          flags |= FplnLineFlags.BeforeSpecial;
        }
        if (this.loadedFlightPlan) {
          if (
            drawIndex === this.loadedFlightPlan.activeLegIndex ||
            (isWaypoint(lineData) && lineData.isActiveHoldFix) || // When we are flying a HM, both the HOLD leg and the hold fix are displayed as white.
            (isHold(lineData) && lineData.isActiveLeg)
          ) {
            flags |= FplnLineFlags.IsActiveLeg;
          } else if (drawIndex === this.loadedFlightPlan.activeLegIndex - 1) {
            flags |= FplnLineFlags.BeforeActiveLeg;
          }
        }
        // No nested attributes, so that's OK
        const clonedLineData = { ...lineData };
        this.renderedLineData[lineIndex].set(clonedLineData);

        if (
          !shouldOnlyUpdatePredictions &&
          this?.renderedLineData[lineIndex]?.get() !== null &&
          this.linesDivRef.getOrDefault()
        ) {
          const lineRef: NodeReference<FplnLegLine> = FSComponent.createRef<FplnLegLine>();
          const node: VNode = (
            <FplnLegLine
              data={this.renderedLineData[lineIndex]}
              ref={lineRef}
              previousRow={Subject.create(previousRow)}
              openRevisionsMenuCallback={() => {
                const line = this.lineData[drawIndex];
                if (line.originalLegIndex !== null) {
                  this.openRevisionsMenu(line.originalLegIndex, isWaypoint(line) ? line.isAltnWaypoint : false);
                }
              }}
              flags={Subject.create(flags)}
              displayEfobAndWind={this.displayEfobAndWind}
              weightUnit={this.weightUnit}
              trueTrack={this.trueTrackEnabled}
              globalLineColor={MappedSubject.create(
                ([tmpy, sec]) => {
                  if (sec) {
                    return FplnLineColor.Secondary;
                  }
                  if (tmpy) {
                    return FplnLineColor.Temporary;
                  }
                  return FplnLineColor.Active;
                },
                this.tmpyActive,
                this.secActive,
              )}
              revisionsMenuIsOpened={this.revisionsMenuOpened}
              callbacks={{
                speed: () => this.goToSpeedConstraint(drawIndex),
                altitude: () => this.goToAltitudeConstraint(drawIndex),
                rta: () => this.goToTimeConstraint(drawIndex),
                wind: () => {},
                onImmediateExitHold: () => {
                  this.onImmediateExit(drawIndex);
                },
              }}
            />
          );
          FSComponent.render(node, this.linesDivRef.instance);
          this.renderedFplnLines.push(lineRef);
        }
      }
    }

    // Update EFIS/ND
    if (this.lineData.length > 0 && this.loadedFlightPlan) {
      // If pseudo-waypoint, find last actual waypoint
      let planCentreLineDataIndex = startAtIndexChecked;
      const isNoPseudoWpt = (data: FplnLineDisplayData) => {
        if (data && isWaypoint(data) && !data.isPseudoWaypoint) {
          return true;
        }
        return false;
      };
      while (this.lineData[planCentreLineDataIndex] && !isNoPseudoWpt(this.lineData[planCentreLineDataIndex])) {
        planCentreLineDataIndex--;
      }

      const planCentreWpt = this.lineData[planCentreLineDataIndex];
      if (planCentreWpt && isWaypoint(planCentreWpt) && planCentreWpt.originalLegIndex !== null) {
        this.props.fmcService.master.updateEfisPlanCentre(
          this.props.mfd.uiService.captOrFo === 'CAPT' ? 'L' : 'R',
          this.loadedFlightPlanIndex.get(),
          planCentreWpt.originalLegIndex,
          planCentreWpt.isAltnWaypoint,
        );
      }
    }
  }

  private predictionTimestamp = (seconds: number) => {
    if (seconds === undefined) {
      return 0;
    }

    const fmgcFlightPhase = this.props.fmcService.master.fmgc.getFlightPhase() ?? FmgcFlightPhase.Preflight;
    if (fmgcFlightPhase >= FmgcFlightPhase.Takeoff) {
      const eta = (SimVar.GetGlobalVarValue('ZULU TIME', 'seconds') + seconds) * 1000;
      return eta;
    }
    if (this.props.fmcService.master.fmgc.data.estimatedTakeoffTime.get() !== undefined) {
      const eta = ((this.props.fmcService.master.fmgc.data.estimatedTakeoffTime.get() ?? 0) + seconds) * 1000;
      return eta;
    }
    return seconds * 1000;
  };

  private openRevisionsMenu(legIndex: number, altnFlightPlan: boolean) {
    if (!this.revisionsMenuOpened.get()) {
      const flightPlan = altnFlightPlan ? this.loadedAlternateFlightPlan : this.loadedFlightPlan;
      const leg = flightPlan?.elementAt(legIndex);
      this.props.fmcService.master.setRevisedWaypoint(legIndex, this.loadedFlightPlanIndex.get(), altnFlightPlan);

      if (leg instanceof FlightPlanLeg) {
        let type: FplnRevisionsMenuType = FplnRevisionsMenuType.Waypoint;
        if (leg.segment.class === SegmentClass.Departure) {
          type = FplnRevisionsMenuType.Departure;
        } else if (leg.segment.class === SegmentClass.Arrival) {
          type = FplnRevisionsMenuType.Arrival;
        }

        this.revisionsMenuValues.set(getRevisionsMenu(this, type));
        this.revisionsMenuRef.getOrDefault()?.display(195, 183);
      } else {
        this.revisionsMenuValues.set(getRevisionsMenu(this, FplnRevisionsMenuType.Discontinuity));
        this.revisionsMenuRef.getOrDefault()?.display(195, 183);
      }
    }
  }

  public openNewDestWindow() {
    this.newDestWindowOpened.set(true);
  }

  public openInsertNextWptFromWindow() {
    const flightPlan = this.props.fmcService.master.revisedLegIsAltn.get()
      ? this.loadedAlternateFlightPlan
      : this.loadedFlightPlan;
    const revWptIndex = this.props.fmcService.master.revisedLegIndex.get();
    if (revWptIndex !== null) {
      const wpt: NextWptInfo[] = flightPlan?.allLegs
        .map((el: ReadonlyFlightPlanElement, idx: number) => {
          if (el instanceof FlightPlanLeg && el.isXF() && idx >= revWptIndex + 1) {
            return { ident: el.ident, originalLegIndex: idx };
          }
          return null;
        })
        .filter((el) => el !== null) as NextWptInfo[];

      this.insertNextWptWindowOpened.set(true);
      this.nextWptAvailableWaypoints.set(wpt);
    }
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.onNewData();

    this.subs.push(
      this.displayFplnFromLineIndex.sub((_) => {
        this.onNewData();
        this.checkScrollButtons();
      }, true),
    );

    this.subs.push(
      this.tmpyActive.sub((val) => {
        if (this.tmpyLineRef.getOrDefault()) {
          if (val) {
            this.lineColor.set(FplnLineColor.Temporary);
            this.tmpyLineRef.instance.style.display = 'flex';
          } else {
            this.lineColor.set(FplnLineColor.Active);
            this.tmpyLineRef.instance.style.display = 'none';
          }
        }

        this.update(this.displayFplnFromLineIndex.get(), false);
        this.lastRenderedDisplayLineIndex = this.displayFplnFromLineIndex.get();
      }, true),
    );

    if (this.props.mfd.uiService.activeUri.get().extra === 'top') {
      this.scrollToTop();
    } else if (this.props.mfd.uiService.activeUri.get().extra === 'dest') {
      // Scroll to end of FPLN (destination on last line)
      this.scrollToDest();
    }

    const sub = this.props.bus.getSubscriber<ClockEvents & InternalKccuKeyEvent>();
    this.subs.push(
      sub
        .on('realTime')
        .atFrequency(0.5)
        .handle(() => {
          this.onNewData();
        }),
    );

    this.subs.push(
      sub.on('kccuKeyEvent').handle((k) => {
        if (k[0] === this.props.mfd.side && k[1] === 'UP') {
          this.displayFplnFromLineIndex.set(this.displayFplnFromLineIndex.get() - 1);
        } else if (k[0] === this.props.mfd.side && k[1] === 'DOWN') {
          this.displayFplnFromLineIndex.set(Math.min(this.displayFplnFromLineIndex.get() + 1, this.lineData.length));
        }
      }),
    );

    this.subs.push(
      this.destEfobLabel,
      this.weightUnit,
      this.weightUnitText,
      this.lineColorIsTemporary,
      this.showInitButton,
      this.destTimeNotAvailAndInActive,
      this.destEfobNotAvailableAndInActive,
      this.destEfobUnitVisiblity,
      this.distanceToDestNotAvailInActive,
      this.distanceToDestUnitVisibility,
      this.isActiveFlightPlan,
      this.activeFlightPhase,
      this.flightplanTimeHeader,
      this.destTimeLabel,
      this.destEfobLabel,
      this.distanceToDestLabel,
    );
  }

  checkScrollButtons() {
    // Line index for "FROM" waypoint
    this.disabledScrollUp.set(
      !this.lineData || this.displayFplnFromLineIndex.get() <= (this.loadedFlightPlan?.activeLegIndex ?? 1) - 1,
    );
    this.disabledScrollDown.set(
      !this.lineData || this.displayFplnFromLineIndex.get() >= this.getLastPageAllowableIndex(),
    );
  }

  private goToTimeConstraint(lineDataIndex: number) {
    const data = this.lineData[lineDataIndex];
    if (
      isWaypoint(data) &&
      data.originalLegIndex &&
      this.loadedFlightPlan?.legElementAt(data.originalLegIndex) &&
      MfdFmsFplnVertRev.isEligibleForVerticalRevision(
        data.originalLegIndex,
        this.loadedFlightPlan.legElementAt(data.originalLegIndex),
        this.loadedFlightPlan,
      )
    ) {
      this.props.fmcService.master.setRevisedWaypoint(
        data.originalLegIndex,
        this.loadedFlightPlanIndex.get(),
        data.isAltnWaypoint,
      );
      this.props.mfd.uiService.navigateTo(
        `fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln-vert-rev/rta`,
      );
    }
  }

  private goToSpeedConstraint(lineDataIndex: number) {
    const data = this.lineData[lineDataIndex];
    if (
      isWaypoint(data) &&
      data.originalLegIndex &&
      this.loadedFlightPlan?.legElementAt(data.originalLegIndex) &&
      MfdFmsFplnVertRev.isEligibleForVerticalRevision(
        data.originalLegIndex,
        this.loadedFlightPlan.legElementAt(data.originalLegIndex),
        this.loadedFlightPlan,
      )
    ) {
      this.props.fmcService.master.setRevisedWaypoint(
        data.originalLegIndex,
        this.loadedFlightPlanIndex.get(),
        data.isAltnWaypoint,
      );
      this.props.mfd.uiService.navigateTo(
        `fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln-vert-rev/spd`,
      );
    }
  }

  private goToAltitudeConstraint(lineDataIndex: number) {
    const data = this.lineData[lineDataIndex];
    if (
      isWaypoint(data) &&
      data.originalLegIndex &&
      this.loadedFlightPlan?.legElementAt(data.originalLegIndex) &&
      MfdFmsFplnVertRev.isEligibleForVerticalRevision(
        data.originalLegIndex,
        this.loadedFlightPlan.legElementAt(data.originalLegIndex),
        this.loadedFlightPlan,
      )
    ) {
      this.props.fmcService.master.setRevisedWaypoint(
        data.originalLegIndex,
        this.loadedFlightPlanIndex.get(),
        data.isAltnWaypoint,
      );
      this.props.mfd.uiService.navigateTo(
        `fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln-vert-rev/alt`,
      );
    }
  }

  private onImmediateExit(lineDataIndex: number) {
    const data = this.lineData[lineDataIndex];
    if (isHold(data) && data.originalLegIndex !== null) {
      if (data.decelSequenced) {
        // Decel has been sequenced but leg not sequenced yet, delete it.
        this.props.fmcService.master?.flightPlanInterface.deleteElementAt(
          data.originalLegIndex,
          false,
          this.loadedFlightPlanIndex.get(),
          false,
        );
      } else if (data.isActiveLeg) {
        this.props.bus
          .getPublisher<FlightPlanOperationEvents>()
          .pub('fms_set_hold_immediate_exit', { index: data.originalLegIndex, exit: !data.immExit }, true, false);
      }
    }
  }

  private scrollToTop() {
    if (!this.loadedFlightPlan) {
      return;
    }

    this.checkScrollButtons();
    if (this.lineData) {
      const whichLineIndex = this.lineData.findIndex(
        (it) => it && it.originalLegIndex === this.loadedFlightPlan?.activeLegIndex,
      );
      this.displayFplnFromLineIndex.set(Math.max(whichLineIndex - 1, 0));
    }
  }

  private scrollToDest() {
    if (!this.loadedFlightPlan) {
      return;
    }

    this.checkScrollButtons();
    if (this.lineData) {
      const whichLineIndex =
        this.lineData.findIndex((it) => it && it.originalLegIndex === this.loadedFlightPlan?.destinationLegIndex) + 1;
      if (whichLineIndex === -1) {
        this.displayFplnFromLineIndex.set(0);
      } else {
        this.displayFplnFromLineIndex.set(whichLineIndex - (this.tmpyActive.get() ? 8 : 9));
      }
    }
  }

  private scrollPage(up: boolean) {
    if (!this.loadedFlightPlan) {
      return;
    }

    if (this.lineData) {
      let targetIndex;
      if (up) {
        targetIndex = this.displayFplnFromLineIndex.get() + 1 - this.renderedLineData.length;
      } else {
        targetIndex = this.displayFplnFromLineIndex.get() + this.renderedLineData.length - 1;
        const maxBottomIndex = this.getLastPageAllowableIndex();
        if (targetIndex > maxBottomIndex) {
          targetIndex = maxBottomIndex;
        }
      }
      this.displayFplnFromLineIndex.set(Math.max(targetIndex, 0));
    }
  }

  private getLastPageAllowableIndex() {
    return this.lineData.length - this.renderedLineData.length;
  }

  render(): VNode {
    return (
      <>
        {super.render()}
        {/* begin page content */}
        <div class="mfd-page-container">
          <ContextMenu
            ref={this.revisionsMenuRef}
            idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_revisionsMenu`}
            values={this.revisionsMenuValues}
            opened={this.revisionsMenuOpened}
          />
          <DestinationWindow
            fmcService={this.props.fmcService}
            flightPlanInterface={this.props.fmcService.master.flightPlanInterface}
            mfd={this.props.mfd}
            visible={this.newDestWindowOpened}
          />
          <InsertNextWptFromWindow
            fmcService={this.props.fmcService}
            flightPlanInterface={this.props.fmcService.master.flightPlanInterface}
            mfd={this.props.mfd}
            availableWaypoints={this.nextWptAvailableWaypoints}
            visible={this.insertNextWptWindowOpened}
            captOrFo={this.props.mfd.uiService.captOrFo}
          />
          <div class="mfd-fms-fpln-header">
            <div class="mfd-fms-fpln-header-from">
              <span class="mfd-label">FROM</span>
            </div>
            <div class="mfd-fms-fpln-header-time">
              <span class="mfd-label">{this.flightplanTimeHeader}</span>
            </div>
            <div ref={this.spdAltEfobWindRef} class="mfd-fms-fpln-header-speed-alt">
              <Button
                label={
                  <div class="mfd-fms-fpln-button-speed-alt">
                    {this.displayEfobAndWind.map((v) =>
                      v ? 'EFOB\xa0\xa0\xa0\xa0T.WIND' : '\xa0SPD\xa0\xa0\xa0\xa0ALT\xa0\xa0\xa0',
                    )}
                  </div>
                }
                onClick={() => {}}
                buttonStyle="margin-right: 5px; width: 260px; height: 43px;"
                idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_windbtn`}
                menuItems={this.efobAndWindButtonMenuItems}
              />
            </div>
            <div class="mfd-fms-fpln-header-trk">
              <span class="mfd-label">TRK</span>
            </div>
            <div class="mfd-fms-fpln-header-dist">
              <span class="mfd-label">DIST</span>
            </div>
            <div class="mfd-fms-fpln-header-fpa">
              <span class="mfd-label">FPA</span>
            </div>
          </div>
          <div ref={this.linesDivRef} />
          <div style="flex-grow: 1" />
          <div ref={this.tmpyLineRef} class="mfd-fms-fpln-line-erase-temporary">
            <Button
              label={
                <div style="display: flex; flex-direction: row; justify-content: space-between;">
                  <span style="text-align: center; vertical-align: center; margin-right: 10px;">
                    ERASE
                    <br />
                    TMPY
                  </span>
                  <span style="display: flex; align-items: center; justify-content: center;">*</span>
                </div>
              }
              onClick={() => this.props.flightPlanInterface.temporaryDelete()}
              buttonStyle="color: #e68000; padding-right: 2px;"
            />
            <Button
              label={
                <div style="display: flex; flex-direction: row; justify-content: space-between;">
                  <span style="text-align: center; vertical-align: center; margin-right: 10px;">
                    INSERT
                    <br />
                    TMPY
                  </span>
                  <span style="display: flex; align-items: center; justify-content: center;">*</span>
                </div>
              }
              onClick={() => this.props.flightPlanInterface.temporaryInsert()}
              buttonStyle="color: #e68000; padding-right: 2px;"
            />
          </div>
          <div style="flex-grow: 1;" />
          {/* fill space vertically */}
          <div class="mfd-fms-fpln-line-destination">
            <ConditionalComponent
              componentIfFalse={
                <Button
                  label={this.destButtonLabel}
                  onClick={() => {
                    this.props.fmcService.master.resetRevisedWaypoint();
                    this.props.mfd.uiService.navigateTo(
                      `fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln-arrival`,
                    );
                  }}
                  buttonStyle="font-size: 30px; width: 150px; margin-right: 5px;"
                />
              }
              componentIfTrue={
                <span
                  class={{ 'mfd-label': true, 'mfd-fms-green-text': this.isActiveFlightPlan }}
                  style={'width:150px; margin-right:5 px'}
                >
                  --------
                </span>
              }
              condition={this.destNotLoaded}
            ></ConditionalComponent>
            <span
              class={{
                'mfd-label': true,
                'mfd-fms-yellow-text': this.lineColorIsTemporary,
                'mfd-fms-green-text': this.destTimeNotAvailAndInActive,
              }}
            >
              {this.destTimeLabel}
            </span>
            <div class="mfd-label-value-container">
              <span
                class={{
                  'mfd-label': true,
                  'mfd-fms-yellow-text': this.lineColorIsTemporary,
                  'mfd-fms-green-text': this.destEfobNotAvailableAndInActive,
                  amber: this.destEfobAmber,
                }}
              >
                {this.destEfobLabel}
              </span>
              <span class="mfd-label-unit mfd-unit-trailing" style={{ visibility: this.destEfobUnitVisiblity }}>
                {this.weightUnitText}
              </span>
            </div>
            <div class="mfd-label-value-container">
              <span
                class={{
                  'mfd-label': true,
                  'mfd-fms-yellow-text': this.lineColorIsTemporary,
                  'mfd-fms-green-text': this.distanceToDestNotAvailInActive,
                }}
              >
                {this.distanceToDestLabel}
              </span>
              <span class="mfd-label-unit mfd-unit-trailing" style={{ visibility: this.distanceToDestUnitVisibility }}>
                NM
              </span>
            </div>
            <div style="display: flex; flex-direction: row; margin-top: 5px; margin-bottom: 5px;">
              <IconButton
                icon="double-down"
                onClick={() => this.scrollPage(false)}
                disabled={this.disabledScrollDown}
                containerStyle="width: 60px; height: 60px;"
              />
              <IconButton
                icon="double-up"
                onClick={() => this.scrollPage(true)}
                disabled={this.disabledScrollUp}
                containerStyle="width: 60px; height: 60px;"
              />
              <Button
                label="DEST"
                disabled={this.destNotLoaded}
                onClick={() => this.scrollToDest()}
                buttonStyle="height: 60px; margin-right: 5px; padding: auto 15px auto 15px;"
              />
            </div>
          </div>
          <div class="mfd-fms-fpln-footer">
            <ConditionalComponent
              condition={this.secActive}
              width={125}
              componentIfTrue={
                <Button
                  label="RETURN"
                  onClick={() =>
                    this.props.mfd.uiService.navigateTo(
                      `fms/sec/index/${this.loadedFlightPlanIndex.get() - FlightPlanIndex.FirstSecondary + 1}`,
                    )
                  }
                  buttonStyle="width: 125px;"
                />
              }
              componentIfFalse={
                <ConditionalComponent
                  condition={this.showInitButton}
                  width={125}
                  componentIfTrue={
                    <Button
                      label="INIT"
                      onClick={() =>
                        this.props.mfd.uiService.navigateTo(
                          `fms/${this.props.mfd.uiService.activeUri.get().category}/init`,
                        )
                      }
                      buttonStyle="width: 125px;"
                    />
                  }
                  componentIfFalse={<></>}
                ></ConditionalComponent>
              }
            />
            <Button
              disabled={false}
              label="F-PLN INFO"
              onClick={() => {}}
              idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_f-pln-infoBtn`}
              menuItems={Subject.create([
                {
                  label: 'ALTERNATE',
                  disabled: true,
                  action: () =>
                    this.props.mfd.uiService.navigateTo(
                      `fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln-alternate`,
                    ),
                },
                {
                  label: 'CLOSEST AIRPORTS',
                  disabled: true,
                  action: () =>
                    this.props.mfd.uiService.navigateTo(
                      `fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln-closest-airports`,
                    ),
                },
                {
                  label: 'EQUI-TIME POINT',
                  disabled: true,
                  action: () =>
                    this.props.mfd.uiService.navigateTo(
                      `fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln-equi-time-point`,
                    ),
                },
                {
                  label: 'FIX INFO',
                  disabled: this.secActive,
                  action: () => this.props.mfd.uiService.navigateTo(fixInfoUri),
                },
                {
                  label: 'LL CROSSING',
                  disabled: true,
                  action: () =>
                    this.props.mfd.uiService.navigateTo(
                      `fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln-ll-xing-time-mkr`,
                    ),
                },
                {
                  label: 'TIME',
                  disabled: true,
                  action: () =>
                    this.props.mfd.uiService.navigateTo(
                      `fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln-ll-xing-time-mkr`,
                    ),
                },
                {
                  label: 'CPNY F-PLN REPORT',
                  disabled: true,
                  action: () => {},
                },
              ] as ButtonMenuItem[])}
            />

            <ConditionalComponent
              condition={this.secActive}
              width={125}
              componentIfTrue={<></>}
              componentIfFalse={
                <Button
                  label="DIR TO"
                  onClick={() => this.props.mfd.uiService.navigateTo(dirToUri)}
                  buttonStyle="margin-right: 5px;"
                />
              }
            />
          </div>
          {/* end page content */}
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

  public destroy(): void {
    this.props.fmcService.master.updateEfisPlanCentre(
      this.props.mfd.uiService.captOrFo === 'CAPT' ? 'L' : 'R',
      FlightPlanIndex.Active,
      this.props.flightPlanInterface.active.activeLegIndex,
      this.props.flightPlanInterface.active.activeLegIndex >= this.props.flightPlanInterface.active.allLegs.length,
    );

    super.destroy();
  }
}

interface FplnLineCommonProps extends ComponentProps {
  openRevisionsMenuCallback: () => void;
}
enum FplnLineColor {
  Active = '#00ff00',
  Temporary = '#ffff00',
  Secondary = '#ffffff',
  Alternate = '#00ffff',
}

enum FplnLineFlags {
  None = 0,
  FirstLine = 1 << 0,
  BeforeSpecial = 1 << 1,
  AfterSpecial = 1 << 2,
  BeforeActiveLeg = 1 << 3,
  IsActiveLeg = 1 << 4,
  LastLine = 1 << 5,
}

enum FplnLineType {
  None,
  Waypoint,
  Special,
  HoldHm,
}

interface FplnLineTypeDiscriminator {
  /*
   * waypoint: Regular or pseudo waypoints
   * special: DISCONTINUITY, END OF F-PLN etc.
   */
  type: FplnLineType;
  originalLegIndex: number | null;
}

// Type for DISCO, END OF F-PLN etc.
interface FplnLineSpecialDisplayData extends FplnLineTypeDiscriminator {
  // type: FplnLineType.Special;
  label: string;
}

export interface FplnLineWaypointDisplayData extends FplnLineTypeDiscriminator {
  // type: FplnLineType.Waypoint;
  isPseudoWaypoint: boolean;
  isAltnWaypoint: boolean;
  isMissedAppchWaypoint: boolean;
  isActiveHoldFix?: boolean;
  ident: string;
  overfly: boolean;
  annotation: string;
  etaOrSecondsFromPresent: number; // timestamp, will be printed to HH:mm
  transitionAltitude: number | null;
  altitudePrediction: number | null;
  hasAltitudeConstraint: boolean;
  altitudeConstraint: AltitudeConstraint | null;
  altitudeConstraintIsRespected: boolean;
  speedPrediction: number | null;
  hasSpeedConstraint: boolean;
  speedConstraint: SpeedConstraint | null;
  speedConstraintIsRespected: boolean;
  /** in kilograms NaN if not available*/
  efobPrediction: number;
  windPrediction: WindVector | TailwindComponent | null;
  trackFromLastWpt?: number | null;
  distFromLastWpt: number | null;
  fpa: number | null;
}

interface FplnLineHoldDisplayData extends FplnLineTypeDiscriminator {
  // type: FplnLineType.Hold;
  isAltnWaypoint: boolean;
  isMissedAppchWaypoint: boolean;
  ident: string;
  holdSpeed: number | null;
  distFromLastWpt: number | null;
  immExit: boolean;
  decelSequenced: boolean;
  isActiveLeg?: boolean;
}

type FplnLineDisplayData = FplnLineWaypointDisplayData | FplnLineSpecialDisplayData | FplnLineHoldDisplayData;

function isWaypoint(object: FplnLineDisplayData): object is FplnLineWaypointDisplayData {
  return object?.type === FplnLineType.Waypoint;
}

function isSpecial(object: FplnLineDisplayData): object is FplnLineSpecialDisplayData {
  return object?.type === FplnLineType.Special;
}

function isHold(object: FplnLineDisplayData): object is FplnLineHoldDisplayData {
  return object?.type === FplnLineType.HoldHm;
}

type lineConstraintsCallbacks = {
  speed: () => void;
  rta: () => void;
  altitude: () => void;
  wind: () => void;
  onImmediateExitHold?: () => void;
};

export interface FplnLegLineProps extends FplnLineCommonProps {
  previousRow: Subscribable<FplnLineDisplayData | null>;
  data: Subscribable<FplnLineDisplayData | null>;
  flags: Subscribable<FplnLineFlags>;
  displayEfobAndWind: Subscribable<boolean>;
  weightUnit: Subscribable<SimpleUnit<UnitFamily.Weight>>;
  trueTrack: Subscribable<boolean>;
  globalLineColor: Subscribable<FplnLineColor>;
  revisionsMenuIsOpened: Subject<boolean>;
  callbacks: lineConstraintsCallbacks;
}

class FplnLegLine extends DisplayComponent<FplnLegLineProps> {
  // Make sure to collect all subscriptions here, so we can properly destroy them.
  private readonly subs = [] as Subscription[];

  private readonly selectedForRevision = Subject.create(false);

  private readonly lineColor = MappedSubject.create(
    ([color, data]) => {
      if (data && (isWaypoint(data) || isHold(data)) && (data.isAltnWaypoint || data.isMissedAppchWaypoint)) {
        return FplnLineColor.Alternate;
      }
      return color;
    },
    this.props.globalLineColor,
    this.props.data,
  );

  private readonly topRef = FSComponent.createRef<HTMLDivElement>();

  private readonly lineRef = FSComponent.createRef<HTMLDivElement>();

  private currentlyRenderedType: FplnLineType = FplnLineType.None;

  private currentlyRenderedLine: VNode | null = null;

  private readonly identRef = FSComponent.createRef<HTMLDivElement | HTMLSpanElement>();

  private readonly timeRef = FSComponent.createRef<HTMLDivElement>();
  /** Only used for displaying HOLD SPD text */
  private readonly timeAnnotation = Subject.create('');
  private readonly timeClickable = Subject.create(true);

  private readonly speedRef = FSComponent.createRef<HTMLDivElement>();
  private readonly speedClickable = Subject.create(true);

  private readonly altRef = FSComponent.createRef<HTMLDivElement>();
  private readonly altClickable = Subject.create(true);

  private readonly connectorRef = FSComponent.createRef<HTMLDivElement>();

  private readonly trackRef = FSComponent.createRef<HTMLDivElement>();

  private readonly distRef = FSComponent.createRef<HTMLDivElement>();

  private readonly fpaRef = FSComponent.createRef<HTMLDivElement>();

  private readonly allRefs: NodeReference<HTMLElement>[] = [
    this.identRef,
    this.timeRef,
    this.speedRef,
    this.altRef,
    this.connectorRef,
    this.trackRef,
    this.distRef,
    this.fpaRef,
  ];

  private readonly lineColorIsTemporary = this.lineColor.map((it) => it === FplnLineColor.Temporary);
  private readonly lineColorIsSecondary = this.lineColor.map((it) => it === FplnLineColor.Secondary);
  private readonly lineColorIsAlternate = this.lineColor.map((it) => it === FplnLineColor.Alternate);

  /** Used to display leg annotation. E.g. Hold inbound course, SID etc. */
  private readonly annotationText = Subject.create('');
  private readonly timeText = Subject.create('');

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subs.push(
      this.props.flags.sub((val) => {
        if (FplnLineFlags.IsActiveLeg === (val & FplnLineFlags.IsActiveLeg)) {
          this.allRefs.forEach((ref) => ref.getOrDefault()?.classList.add('mfd-fms-fpln-leg-active'));
        } else {
          this.allRefs.forEach((ref) => ref.getOrDefault()?.classList.remove('mfd-fms-fpln-leg-active'));
        }
      }, true),
    );

    const renderSpdAltEfobWind = () => {
      const data = this.props.data.get();
      if (data && isWaypoint(data)) {
        this.renderSpdAltEfobWind(data);
      }
    };

    const weightUnitSub = this.props.weightUnit.sub(renderSpdAltEfobWind, false, true);
    this.subs.push(weightUnitSub);
    this.subs.push(
      this.props.displayEfobAndWind.sub((efob) => {
        if (efob) {
          weightUnitSub.resume(false);
        } else {
          weightUnitSub.pause();
        }
        renderSpdAltEfobWind();
      }, true),
    );

    this.subs.push(this.props.data.sub((data) => data && this.onNewData(data), true));

    this.subs.push(
      this.selectedForRevision.sub((val) => {
        if (val) {
          this.identRef.getOrDefault()?.classList.add('selected');
        } else {
          this.identRef.getOrDefault()?.classList.remove('selected');
        }
      }),
    );

    this.subs.push(
      this.props.revisionsMenuIsOpened.sub((val) => {
        if (!val) {
          this.selectedForRevision.set(false);
          this.identRef.getOrDefault()?.classList.remove('selected');
        }
      }),
    );

    this.subs.push(this.lineColor, this.lineColorIsTemporary, this.lineColorIsSecondary, this.lineColorIsAlternate);

    this.identRef.getOrDefault()?.addEventListener('click', this.onIdentClickedHandler);
    this.timeRef.getOrDefault()?.addEventListener('click', this.onTimeClickedHandler);
    this.speedRef.getOrDefault()?.addEventListener('click', this.onSpeedClickedHandler);
    this.altRef.getOrDefault()?.addEventListener('click', this.onAltClickedHandler);
  }

  private readonly onIdentClickedHandler = this.onIdentClicked.bind(this);
  private readonly onTimeClickedHandler = this.onTimeClicked.bind(this);
  private readonly onSpeedClickedHandler = this.onSpeedClicked.bind(this);
  private readonly onAltClickedHandler = this.onAltClicked.bind(this);

  public destroy(): void {
    this.subs.forEach((sub) => sub.destroy());
    this.lineColor.destroy();

    this.identRef.getOrDefault()?.removeEventListener('click', this.onIdentClickedHandler);
    this.timeRef.getOrDefault()?.removeEventListener('click', this.onTimeClickedHandler);
    this.speedRef.getOrDefault()?.removeEventListener('click', this.onSpeedClickedHandler);
    this.altRef.getOrDefault()?.removeEventListener('click', this.onAltClickedHandler);

    super.destroy();
  }

  private resetLineTextAndClickableStyles(): void {
    this.annotationText.set('');
    this.timeAnnotation.set('');
    this.timeText.set('');
    this.timeClickable.set(true);
    this.speedClickable.set(true);
    this.altClickable.set(true);
  }

  private onIdentClicked() {
    if (this.props.data.get()?.originalLegIndex !== null && this.props.data.get()?.originalLegIndex !== undefined) {
      this.props.openRevisionsMenuCallback();
      this.selectedForRevision.set(true);
    }
  }

  private onTimeClicked() {
    if (this.timeClickable.get()) {
      this.props.callbacks.rta();
    }
  }

  private onSpeedClicked() {
    if (this.speedClickable.get()) {
      this.props.callbacks.speed();
    }
  }

  private onAltClicked() {
    if (this.altClickable.get()) {
      if (this.props.displayEfobAndWind.get()) {
        this.props.callbacks.wind();
      } else {
        this.props.callbacks.altitude();
      }
    }
  }

  private onNewData(data: FplnLineDisplayData): void {
    this.resetLineTextAndClickableStyles();

    if (data && isWaypoint(data) && this.topRef.getOrDefault()) {
      if (this.currentlyRenderedType !== FplnLineType.Waypoint) {
        while (this.topRef.instance.firstChild) {
          this.topRef.instance.removeChild(this.topRef.instance.firstChild);
        }
        if (this.currentlyRenderedLine && this.currentlyRenderedLine.instance instanceof DisplayComponent) {
          this.currentlyRenderedLine.instance.destroy();
        }
        this.currentlyRenderedLine = this.renderWaypointLine();
        FSComponent.render(this.currentlyRenderedLine, this.topRef.instance);
        this.currentlyRenderedType = FplnLineType.Waypoint;
      }

      if (this.identRef.getOrDefault()) {
        if (data.overfly) {
          this.identRef.instance.innerHTML = `<span>${data.ident}<span style="font-size: 24px; vertical-align: baseline;">@</span></span>`;
        } else {
          this.identRef.instance.innerText = data.ident;
        }
      }

      // TODO: RNP info
      this.annotationText.set(data.annotation ?? '');

      // Format time to leg
      // TODO: Time constraint.
      if (this.props.globalLineColor.get() === FplnLineColor.Active) {
        if (data.etaOrSecondsFromPresent) {
          const date = new Date(data.etaOrSecondsFromPresent);
          this.timeText.set(
            `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`,
          );
        } else {
          this.timeText.set('--:--');
        }
      } else {
        this.timeText.set('--:--');
      }

      this.renderSpdAltEfobWind(data);

      if (this.connectorRef.getOrDefault()) {
        while (this.connectorRef.instance.firstChild) {
          this.connectorRef.instance.removeChild(this.connectorRef.instance.firstChild);
        }
        FSComponent.render(this.lineConnector(data), this.connectorRef.instance);
      }

      if (this.trackRef.getOrDefault() && this.distRef.getOrDefault() && this.fpaRef.getOrDefault()) {
        if (FplnLineFlags.AfterSpecial === (this.props.flags.get() & FplnLineFlags.AfterSpecial)) {
          this.trackRef.instance.innerText = '';
          this.distRef.instance.innerText = '';
          this.fpaRef.instance.innerText = '';
        } else {
          this.trackRef.instance.innerText = data.trackFromLastWpt
            ? `${data.trackFromLastWpt.toFixed(0).padStart(3, '0')}°${this.props.trueTrack.get() ? 'T' : ''}`
            : '';
          this.distRef.instance.innerText = data.distFromLastWpt?.toFixed(0) ?? '';
          this.fpaRef.instance.innerText = data.fpa ? data.fpa.toFixed(1) : '';
        }
      }
    } else if (data && isSpecial(data) && this.identRef.getOrDefault()) {
      if (this.currentlyRenderedType !== FplnLineType.Special) {
        while (this.topRef.instance.firstChild) {
          this.topRef.instance.removeChild(this.topRef.instance.firstChild);
        }
        if (this.currentlyRenderedLine && this.currentlyRenderedLine.instance instanceof DisplayComponent) {
          this.currentlyRenderedLine.instance.destroy();
        }
        this.currentlyRenderedLine = this.renderSpecialLine(data);
        FSComponent.render(this.currentlyRenderedLine, this.topRef.instance);
        this.currentlyRenderedType = FplnLineType.Special;
      }

      const delimiter = data.label.length > 13 ? '- - - - -' : '- - - - - - ';
      this.identRef.instance.innerHTML = `${delimiter}<span style="margin: 0px 15px 0px 15px;">${data.label}</span>${delimiter}`;
    } else if (data && isHold(data) && this.identRef.getOrDefault()) {
      this.timeClickable.set(false);
      this.speedClickable.set(false);
      this.altClickable.set(false);

      if (this.currentlyRenderedType !== FplnLineType.Waypoint) {
        while (this.topRef.instance.firstChild) {
          this.topRef.instance.removeChild(this.topRef.instance.firstChild);
        }
        if (this.currentlyRenderedLine && this.currentlyRenderedLine.instance instanceof DisplayComponent) {
          this.currentlyRenderedLine.instance.destroy();
        }
        this.currentlyRenderedLine = this.renderWaypointLine();
        FSComponent.render(this.currentlyRenderedLine, this.topRef.instance);
        this.currentlyRenderedType = FplnLineType.Waypoint;
      }

      this.identRef.instance.innerText = data.ident;
      this.altRef.instance.innerText = '';
      this.speedRef.instance.innerText = '';
      this.timeAnnotation.set('SPD');
      this.timeText.set(data.holdSpeed?.toFixed(0) ?? '');

      if (this.connectorRef.getOrDefault()) {
        while (this.connectorRef.instance.firstChild) {
          this.connectorRef.instance.removeChild(this.connectorRef.instance.firstChild);
        }
        FSComponent.render(FplnLineConnectorHold(this.lineColor.get()), this.connectorRef.instance);
      }

      // If decel has been sequenced or this is the active leg, show the hold exit line.
      if (isHold(data) && (data.decelSequenced || data.isActiveLeg)) {
        FSComponent.render(this.renderHoldExitLine(data), this.speedRef.instance);
      }

      if (this.trackRef.getOrDefault() && this.distRef.getOrDefault() && this.fpaRef.getOrDefault()) {
        this.trackRef.instance.innerText = '';
        this.distRef.instance.innerText = '';
        this.fpaRef.instance.innerText = '';
      }
    }
  }

  // FIXME make the leg data fields subscribable so we don't have to do heavy DOM thrashing
  private renderSpdAltEfobWind(data: FplnLineWaypointDisplayData): void {
    if (!this.speedRef.getOrDefault() || !this.altRef.getOrDefault()) {
      return;
    }

    while (this.speedRef.instance.firstChild) {
      this.speedRef.instance.removeChild(this.speedRef.instance.firstChild);
    }
    while (this.altRef.instance.firstChild) {
      this.altRef.instance.removeChild(this.altRef.instance.firstChild);
    }
    FSComponent.render(this.efobOrSpeed(data), this.speedRef.instance);
    FSComponent.render(this.windOrAlt(data), this.altRef.instance);

    if (this.props.displayEfobAndWind.get()) {
      this.altRef.instance.style.alignSelf = 'flex-end';
      this.altRef.instance.style.paddingRight = '20px';
      this.speedRef.instance.style.paddingLeft = '10px';
      this.speedClickable.set(false);
      this.altClickable.set(true);
    } else {
      this.altRef.instance.style.alignSelf = '';
      this.altRef.instance.style.paddingRight = '';
      this.speedRef.instance.style.paddingLeft = '';
      this.speedClickable.set(true);
      this.altClickable.set(true);
    }
  }

  private formatWind(data: FplnLineWaypointDisplayData): VNode {
    let directionStr = '---';
    const previousRow = this.props.previousRow.get();
    if (
      previousRow &&
      isWaypoint(previousRow) &&
      previousRow.windPrediction !== null &&
      data.windPrediction !== null &&
      formatWindPredictionDirection(previousRow.windPrediction) ===
        formatWindPredictionDirection(data.windPrediction) &&
      !(
        FplnLineFlags.AfterSpecial === (this.props.flags.get() & FplnLineFlags.AfterSpecial) ||
        FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine)
      )
    ) {
      directionStr = <span style="font-family: HoneywellMCDU, monospace;">"</span>;
    } else if (data.windPrediction !== null) {
      directionStr = <span>{formatWindPredictionDirection(data.windPrediction)}</span>;
    }

    let speedStr = '--';
    if (
      previousRow &&
      isWaypoint(previousRow) &&
      previousRow.windPrediction !== null &&
      data.windPrediction !== null &&
      formatWindPredictionMagnitude(previousRow.windPrediction) === formatWindPredictionMagnitude(data.windPrediction)
    ) {
      speedStr = <span style="font-family: HoneywellMCDU, monospace;">"</span>;
    } else if (data.windPrediction !== null) {
      speedStr = <span>{formatWindPredictionMagnitude(data.windPrediction)}</span>;
    }

    return (
      <div style="display: flex; flex-direction: row; justify-self: flex-end">
        <div style="width: 45px; text-align: center;">{directionStr}</div>
        <span>/</span>
        <div style="width: 45px; text-align: center;">{speedStr}</div>
      </div>
    );
  }

  private formatAltitude(data: FplnLineWaypointDisplayData): VNode {
    let altStr: VNode = <span>---</span>;
    const previousRow = this.props.previousRow.get();
    if (data.altitudePrediction) {
      const isBelowTransAlt =
        data.transitionAltitude !== null ? data.altitudePrediction < data.transitionAltitude : true;
      if (
        previousRow &&
        isWaypoint(previousRow) &&
        previousRow.altitudePrediction &&
        Math.abs(previousRow.altitudePrediction - data.altitudePrediction) < 100 &&
        !data.hasAltitudeConstraint &&
        !(
          FplnLineFlags.AfterSpecial === (this.props.flags.get() & FplnLineFlags.AfterSpecial) ||
          FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine)
        )
      ) {
        altStr = <span style="font-family: HoneywellMCDU, monospace;">"</span>;
      } else if (!isBelowTransAlt) {
        altStr = (
          <span>{`FL${Math.round(data.altitudePrediction / 100)
            .toString()
            .padStart(3, '0')}`}</span>
        );
      } else {
        const roundedAltitude = MathUtils.round(data.altitudePrediction, 10).toFixed(0);
        altStr = <span>{roundedAltitude}</span>;
      }
    }
    if (data.hasAltitudeConstraint && data.altitudePrediction) {
      if (data.altitudeConstraintIsRespected) {
        return (
          <>
            <span class="mfd-fms-fpln-leg-constraint-respected">*</span>
            <span>{altStr}</span>
          </>
        );
      }
      return (
        <>
          <span class="mfd-fms-fpln-leg-constraint-missed">*</span>
          <span>{altStr}</span>
        </>
      );
    }
    if (data.hasAltitudeConstraint && data.altitudeConstraint?.altitude1 && !data.altitudePrediction) {
      const isBelowTransAlt =
        data.transitionAltitude !== null ? data.altitudeConstraint.altitude1 < data.transitionAltitude : true;
      const altCstr = isBelowTransAlt
        ? data.altitudeConstraint.altitude1.toFixed(0)
        : `FL${Math.round(data.altitudeConstraint.altitude1 / 100).toString()}`;
      let cstrType = '';
      if (
        data.altitudeConstraint.altitudeDescriptor &&
        [
          AltitudeDescriptor.AtOrAboveAlt1,
          AltitudeDescriptor.AtOrAboveAlt1AngleAlt2,
          AltitudeDescriptor.AtOrAboveAlt1GsIntcptAlt2,
          AltitudeDescriptor.AtOrAboveAlt1GsMslAlt2,
        ].includes(data.altitudeConstraint.altitudeDescriptor)
      ) {
        cstrType = '+';
      } else if (
        data.altitudeConstraint.altitudeDescriptor &&
        [AltitudeDescriptor.AtOrBelowAlt1, AltitudeDescriptor.AtOrBelowAlt1AngleAlt2].includes(
          data.altitudeConstraint.altitudeDescriptor,
        )
      ) {
        cstrType = '-';
      }
      const displayedStr = data.altitudeConstraint.altitude2 ? 'WINDOW' : `${cstrType}${altCstr}`;
      return (
        <span class="mfd-fms-fpln-leg-constraint-respected" style="font-size: 25px;">
          {displayedStr}
        </span>
      );
    }
    return <span style="margin-left: 20px;">{altStr}</span>;
  }

  private formatSpeed(data: FplnLineWaypointDisplayData): VNode {
    let speedStr: VNode = <span>---</span>;
    const previousRow = this.props.previousRow.get();
    if (
      previousRow &&
      isWaypoint(previousRow) &&
      data.speedPrediction &&
      previousRow.speedPrediction &&
      ((data.speedPrediction >= 2 && Math.abs(previousRow.speedPrediction - data.speedPrediction) < 1) ||
        (data.speedPrediction < 2 && Math.abs(previousRow.speedPrediction - data.speedPrediction) < 0.01)) &&
      !data.hasSpeedConstraint &&
      !(
        FplnLineFlags.AfterSpecial === (this.props.flags.get() & FplnLineFlags.AfterSpecial) ||
        FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine)
      )
    ) {
      speedStr = <span style="font-family: HoneywellMCDU, monospace; padding-left: 3px; padding-right: 3px;">"</span>;
    } else if (data.speedPrediction && Number.isFinite(data.speedPrediction) && data.speedPrediction > 0) {
      speedStr = (
        <span>
          {data.speedPrediction > 2
            ? data.speedPrediction.toFixed(0)
            : `.${data.speedPrediction.toFixed(2).split('.')[1]}`}
        </span>
      );
    }

    if (data.hasSpeedConstraint && data.speedPrediction) {
      if (data.speedConstraintIsRespected) {
        return (
          <>
            <span class="mfd-fms-fpln-leg-constraint-respected">*</span>
            <span>{speedStr}</span>
          </>
        );
      }
      return (
        <>
          <span class="mfd-fms-fpln-leg-constraint-missed">*</span>
          <span>{speedStr}</span>
        </>
      );
    }
    if (data.hasSpeedConstraint && data.speedConstraint?.speed && !data.speedPrediction) {
      return (
        <span class="mfd-fms-fpln-leg-constraint-respected" style="margin-left: 20px; font-size: 25px;">
          {data.speedConstraint.speed > 2
            ? data.speedConstraint.speed.toFixed(0)
            : `.${data.speedConstraint.speed.toFixed(2).split('.')[1]}`}
        </span>
      );
    }
    return <span style="margin-left: 20px;">{speedStr}</span>;
  }

  private efobOrSpeed(data: FplnLineWaypointDisplayData): VNode {
    if (this.props.displayEfobAndWind.get()) {
      return !Number.isNaN(data.efobPrediction) && this.props.globalLineColor.get() === FplnLineColor.Active ? (
        <span>
          {(this.props.weightUnit.get().convertFrom(data.efobPrediction, UnitType.KILOGRAM) / 1000).toFixed(1)}
        </span>
      ) : (
        <span>--.-</span>
      );
    }
    return this.props.globalLineColor.get() === FplnLineColor.Active ? this.formatSpeed(data) : <span>---</span>;
  }

  private windOrAlt(data: FplnLineWaypointDisplayData): VNode {
    if (this.props.displayEfobAndWind.get()) {
      return this.props.globalLineColor.get() === FplnLineColor.Active ? this.formatWind(data) : <span>---°/---</span>;
    }
    return this.props.globalLineColor.get() === FplnLineColor.Active ? this.formatAltitude(data) : <span>---</span>;
  }

  private lineConnector(data: FplnLineWaypointDisplayData): VNode {
    if (
      FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine) &&
      FplnLineFlags.BeforeActiveLeg === (this.props.flags.get() & FplnLineFlags.BeforeActiveLeg)
    ) {
      return <></>;
    }
    if (FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine)) {
      return FplnLineConnectorFirstLineNotBeforeActiveLeg(
        this.lineColor.get(),
        FplnLineFlags.IsActiveLeg === (this.props.flags.get() & FplnLineFlags.IsActiveLeg),
        FplnLineFlags.BeforeSpecial === (this.props.flags.get() & FplnLineFlags.BeforeSpecial),
      );
    }
    if (FplnLineFlags.AfterSpecial === (this.props.flags.get() & FplnLineFlags.AfterSpecial)) {
      const lastLineOrBeforeSpecial =
        FplnLineFlags.LastLine === (this.props.flags.get() & FplnLineFlags.LastLine) ||
        FplnLineFlags.BeforeSpecial === (this.props.flags.get() & FplnLineFlags.BeforeSpecial);
      return FplnLineConnectorNormalNotBeforeActiveLeg(this.lineColor.get(), lastLineOrBeforeSpecial);
    }
    if (FplnLineFlags.IsActiveLeg === (this.props.flags.get() & FplnLineFlags.IsActiveLeg)) {
      return FplnLineConnectorActiveLeg(this.lineColor.get());
    }
    if (data.isPseudoWaypoint) {
      const lastLineOrBeforeSpecial =
        FplnLineFlags.LastLine === (this.props.flags.get() & FplnLineFlags.LastLine) ||
        FplnLineFlags.BeforeSpecial === (this.props.flags.get() & FplnLineFlags.BeforeSpecial);
      return FplnLineConnectorPseudoWaypoint(this.lineColor.get(), lastLineOrBeforeSpecial);
    }
    const lastLineOrBeforeSpecial =
      FplnLineFlags.LastLine === (this.props.flags.get() & FplnLineFlags.LastLine) ||
      FplnLineFlags.BeforeSpecial === (this.props.flags.get() & FplnLineFlags.BeforeSpecial);
    return FplnLineConnectorNormal(this.lineColor.get(), lastLineOrBeforeSpecial);
  }

  private renderHoldExitLine(data: FplnLineHoldDisplayData): VNode {
    return (
      <Button
        label={Subject.create(
          <div style="display: flex; flex-direction: row; justify-content: space-between;">
            <span style="text-align: center; vertical-align: center; margin-right: 10px;">
              {data.immExit ? 'RESUME' : 'IMMEDIATE'}
              <br />
              {data.immExit ? 'HOLD' : 'EXIT'}
            </span>
            <span style="display: flex; align-items: center; justify-content: center;">*</span>
          </div>,
        )}
        onClick={() => {
          this.props.callbacks.onImmediateExitHold!();
        }}
        buttonStyle="color: #e68000; padding-right: 2px; width:200px;"
      />
    );
  }

  renderWaypointLine(): VNode {
    return (
      <div
        ref={this.lineRef}
        class={{
          'mfd-fms-fpln-line': true,
          'mfd-fms-fpln-line-temporary': this.lineColorIsTemporary,
          'mfd-fms-fpln-line-secondary': this.lineColorIsSecondary,
          'mfd-fms-fpln-line-altn': this.lineColorIsAlternate,
        }}
        style={`${FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine) ? 'height: 40px; margin-top: 16px;' : 'height: 72px;'};`}
      >
        <div style="width: 25%; display: flex; flex-direction: column;">
          {!(FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine)) && (
            <div class="mfd-fms-fpln-line-annotation">{this.annotationText}</div>
          )}
          <div ref={this.identRef} class="mfd-fms-fpln-line-ident" />
        </div>
        <div class={{ 'mfd-fms-fpln-label-small': true, clickable: this.timeClickable }} style="width: 11.5%;">
          {!(FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine)) && (
            <div class="mfd-fms-fpln-line-annotation">{this.timeAnnotation}</div>
          )}
          <div ref={this.timeRef} class="mfd-fms-fpln-leg-lower-row">
            {this.timeText}
          </div>
        </div>
        <div
          class={{ 'mfd-fms-fpln-label-small': true, clickable: this.speedClickable }}
          style="width: 15%; align-items: flex-start; padding-left: 40px;"
        >
          {!(FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine)) && (
            <div class="mfd-fms-fpln-leg-upper-row" />
          )}
          <div ref={this.speedRef} class="mfd-fms-fpln-leg-lower-row" />
        </div>
        <div
          class={{ 'mfd-fms-fpln-label-small': true, clickable: this.altClickable }}
          style="width: 21%; align-items: flex-start; padding-left: 20px;"
        >
          {!(FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine)) && (
            <div class="mfd-fms-fpln-leg-upper-row" />
          )}
          <div ref={this.altRef} class="mfd-fms-fpln-leg-lower-row" />
        </div>
        <div ref={this.connectorRef} class="mfd-fms-fpln-label-small" style="width: 30px; margin-right: 5px;" />
        <div class="mfd-fms-fpln-label-small" style="width: 9%; align-items: flex-start;">
          {!(FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine)) && (
            <div ref={this.trackRef} class="mfd-fms-fpln-leg-upper-row" />
          )}
          <div class="mfd-fms-fpln-leg-lower-row" />
        </div>
        <div class="mfd-fms-fpln-label-small" style="width: 6%; align-items: flex-end;">
          {!(FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine)) && (
            <div ref={this.distRef} class="mfd-fms-fpln-leg-upper-row" />
          )}
          <div class="mfd-fms-fpln-leg-lower-row" />
        </div>
        <div class="mfd-fms-fpln-label-small" style="width: 8%; align-items: flex-end;">
          {!(FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine)) && (
            <div ref={this.fpaRef} class="mfd-fms-fpln-leg-upper-row" />
          )}
          <div class="mfd-fms-fpln-leg-lower-row" />
        </div>
      </div>
    );
  }

  renderSpecialLine(data: FplnLineSpecialDisplayData): VNode {
    const delimiter = data.label.length > 13 ? '- - - - -' : '- - - - - - ';
    return (
      <div
        ref={this.identRef}
        class="mfd-fms-fpln-line mfd-fms-fpln-line-special"
        style={`font-size: 30px; ${FplnLineFlags.FirstLine === (this.props.flags.get() & FplnLineFlags.FirstLine) ? 'height: 40px; margin-top: 16px;' : 'height: 72px;'}`}
      >
        {delimiter}
        <span style="margin: 0px 15px 0px 15px;">{data.label}</span>
        {delimiter}
      </div>
    );
  }

  render() {
    const data = this.props.data.get();
    if (data && (isWaypoint(data) || isHold(data))) {
      // Hold lines are rendered just like waypoints with some minor differences on the applicable fields.
      this.currentlyRenderedType = FplnLineType.Waypoint;
      this.currentlyRenderedLine = this.renderWaypointLine();
    }
    if (data && isSpecial(data)) {
      this.currentlyRenderedType = FplnLineType.Special;
      this.currentlyRenderedLine = this.renderSpecialLine(data);
    }

    if (this.currentlyRenderedLine) {
      return <div ref={this.topRef}>{this.currentlyRenderedLine}</div>;
    } else {
      return <></>;
    }
  }
}

function FplnLineConnectorFirstLineNotBeforeActiveLeg(
  lineColor: FplnLineColor,
  activeLeg: boolean,
  beforeSpecial: boolean,
): VNode {
  return (
    <svg height="40" width="30">
      <line x1="15" y1="40" x2="15" y2="30" style={`stroke:${beforeSpecial ? '#000' : lineColor};stroke-width:2`} />
      <line
        x1="8"
        y1="18"
        x2="0"
        y2="18"
        style={`stroke:${activeLeg && lineColor === FplnLineColor.Active ? '#fff' : lineColor};stroke-width:2`}
      />
      <g
        style={`fill:none;stroke:${activeLeg && lineColor !== FplnLineColor.Temporary ? '#fff' : lineColor};stroke-width:2`}
      >
        <polyline points="15,31 8,19 15,5 22,19 15,31" />
      </g>
    </svg>
  );
}

function FplnLineConnectorNormal(lineColor: FplnLineColor, lastLine: boolean): VNode {
  return (
    <svg height="72" width="30">
      <line x1="15" y1="72" x2="15" y2="63" style={`stroke:${lastLine ? '#000' : lineColor};stroke-width:2`} />
      <g style={`fill:none;stroke:${lineColor};stroke-width:2`}>
        <line x1="15" y1="0" x2="15" y2="37" />
        <polyline points="15,63 8,51 15,37 22,51 15,63" />
        <line x1="8" y1="50" x2="0" y2="50" />
        <line x1="15" y1="10" x2="30" y2="10" />
      </g>
    </svg>
  );
}

function FplnLineConnectorNormalNotBeforeActiveLeg(lineColor: FplnLineColor, lastLine: boolean): VNode {
  return (
    <svg height="72" width="30">
      <line x1="15" y1="72" x2="15" y2="63" style={`stroke:${lastLine ? '#000' : lineColor};stroke-width:2`} />
      <g style={`fill:none;stroke:${lineColor};stroke-width:2`}>
        <polyline points="15,63 8,51 15,37 22,51 15,63" />
        <line x1="8" y1="50" x2="0" y2="50" />
      </g>
    </svg>
  );
}

function FplnLineConnectorActiveLeg(lineColor: FplnLineColor): VNode {
  return (
    <svg height="72" width="30">
      <line x1="15" y1="72" x2="15" y2="62" style={`stroke:${lineColor};stroke-width:2`} />
      <g style={`fill:none;stroke:${lineColor === FplnLineColor.Active ? '#fff' : lineColor};stroke-width:2`}>
        <line x1="15" y1="9" x2="15" y2="37" />
        <polyline points="15,63 8,51 15,37 22,51 15,63" />
        <line x1="8" y1="50" x2="0" y2="50" />
        <line x1="15" y1="10" x2="30" y2="10" />
      </g>
    </svg>
  );
}

function FplnLineConnectorPseudoWaypoint(lineColor: FplnLineColor, lastLine: boolean): VNode {
  return (
    <svg height="72" width="30">
      <line x1="15" y1="72" x2="15" y2="50" style={`stroke:${lastLine ? '#000' : lineColor};stroke-width:2`} />
      <g style={`fill:none;stroke:${lineColor};stroke-width:2`}>
        <line x1="15" y1="0" x2="15" y2="50" />
        <line x1="15" y1="50" x2="0" y2="50" />
        <line x1="15" y1="10" x2="30" y2="10" />
      </g>
    </svg>
  );
}

function FplnLineConnectorHold(lineColor: FplnLineColor): VNode {
  return (
    <svg height="72" width="30">
      <line x1="15" y1="72" x2="15" y2="0" style={`stroke:${lineColor};stroke-width:2`} />
    </svg>
  );
}
