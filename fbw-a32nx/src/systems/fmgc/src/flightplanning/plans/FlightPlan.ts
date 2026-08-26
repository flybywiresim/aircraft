// Copyright (c) 2021-2026 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Airport, ApproachType, Fix, isMsfs2024, LegType, MagVar, MathUtils, NXDataStore } from '@flybywiresim/fbw-sdk';
import { AlternateFlightPlan } from '@fmgc/flightplanning/plans/AlternateFlightPlan';
import { AeroMath, BitFlags, EventBus, MutableSubscribable, Subject } from '@microsoft/msfs-sdk';
import { FixInfoData, FixInfoEntry } from '@fmgc/flightplanning/plans/FixInfo';
import { Coordinates, Degrees } from 'msfs-geo';
import { FlightPlanLeg, FlightPlanLegFlags, isLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';
import { FlightArea } from '@fmgc/navigation/FlightArea';
import { CopyOptions } from '@fmgc/flightplanning/plans/CloningOptions';
import { ImportedPerformanceData } from '@fmgc/flightplanning/uplink/SimBriefUplinkAdapter';
import {
  DefaultPerformanceData,
  FlightPlanPerformanceData,
  FlightPlanPerformanceDataProperties,
} from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';
import { BaseFlightPlan, FlightPlanContext, SerializedFlightPlan } from './BaseFlightPlan';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { FlightPlanQueuedOperation } from '@fmgc/flightplanning/plans/FlightPlanQueuedOperation';
import { FlightPlanFlags } from './FlightPlanFlags';
import {
  cloneWindVector,
  debugFormatWindEntry,
  extractTheta,
  FlightPlanWindEntry,
  isWindVectorComplete,
  WindEntry,
  WindVector,
} from '../data/wind';
import { PendingWindUplink } from './PendingWindUplink';
import { WindUtils } from '../../guidance/vnav/wind/WindUtils';

export class FlightPlan<P extends FlightPlanPerformanceData = FlightPlanPerformanceData> extends BaseFlightPlan<P> {
  private static readonly emptyWindEntry: FlightPlanWindEntry = {
    altitude: undefined,
    vector: { direction: undefined, magnitude: undefined },
    flags: 0,
  };

  static empty<P extends FlightPlanPerformanceData>(
    context: FlightPlanContext,
    index: number,
    bus: EventBus,
    performanceDataInit: P,
    maxClimbWindLevels: number,
    maxCruiseWindLevels: number,
    maxDescentWindLevels: number,
    time?: number,
    draftOnWindsOnWindEdit = false,
  ): FlightPlan<P> {
    return new FlightPlan<P>(
      context,
      index,
      bus,
      performanceDataInit,
      maxClimbWindLevels,
      maxCruiseWindLevels,
      maxDescentWindLevels,
      time,
      draftOnWindsOnWindEdit,
    );
  }

  /**
   * Alternate flight plan associated with this flight plan
   */
  alternateFlightPlan = new AlternateFlightPlan<P>(this.context, this.index, this);

  /**
   * Performance data for this flight plan
   */
  performanceData: P;

  /**
   * FIX INFO entries
   */
  fixInfos: readonly (FixInfoEntry | undefined)[] = [];

  /**
   * Shown as the "flight number" in the MCDU, but it's really the callsign
   */
  readonly flightNumber = Subject.create<string | null>(null);

  /**
   * Possible flags for this flight plan. See {@link FlightPlanFlags} for a list of flags.
   */
  flags: number = FlightPlanFlags.None;

  public readonly pendingWindUplink: PendingWindUplink = new PendingWindUplink();

  /**
   * The draft climb wind entries used to store pilot edits prior to these being applied to the plan. If undefined, draft winds are disabled.
   */
  private readonly draftClimbWindEntries: FlightPlanWindEntry[] | undefined;
  /**
   * The draft descent wind entries used to store pilot edits prior to these being applied to the plan. If undefined, draft winds are disabled.
   */
  private readonly draftDescentWindEntries: FlightPlanWindEntry[] | undefined;
  /**
   * The draft cruise wind entry used to store pilot edits prior to these being applied to the plan. If undefined, draft winds are disabled.
   */
  private readonly alternateDraftWind: WindVector | undefined;
  private draftClimbWindExists = false;
  private draftDescentWindExists = false;
  private alternateDraftWindExists = false;

  constructor(
    context: FlightPlanContext,
    index: number,
    bus: EventBus,
    performanceDataInit: P,
    private readonly maxClimbWindLevels: number,
    maxCruiseWindLevels: number,
    private readonly maxDescentWindLevels: number,
    time?: number,
    draftOnWindsOnWindEdit = false,
  ) {
    super(context, index, bus, maxCruiseWindLevels, time, draftOnWindsOnWindEdit);
    this.performanceData = performanceDataInit;
    if (draftOnWindsOnWindEdit) {
      this.draftClimbWindEntries =
        this.index !== FlightPlanIndex.Temporary && this.index !== FlightPlanIndex.Uplink ? [] : undefined;
      this.draftDescentWindEntries =
        this.index !== FlightPlanIndex.Temporary && this.index !== FlightPlanIndex.Uplink ? [] : undefined;
      this.alternateDraftWind = { direction: undefined, magnitude: undefined };
    }
  }

  destroy() {
    super.destroy();

    this.performanceData.destroy();
    this.alternateFlightPlan.destroy();
  }

  clone(newIndex: number, options: number = CopyOptions.Default, time?: number): FlightPlan<P> {
    const newPlan = FlightPlan.empty(
      this.context,
      newIndex,
      this.bus,
      this.performanceData.clone(),
      this.maxClimbWindLevels,
      this.maxCruiseWindLevels!,
      this.maxDescentWindLevels,
      time,
      this.alternateDraftWind !== undefined,
    );

    newPlan.version = this.version;
    newPlan.originSegment = this.originSegment.clone(newPlan, options);
    newPlan.departureRunwayTransitionSegment = this.departureRunwayTransitionSegment.clone(newPlan, options);
    newPlan.departureSegment = this.departureSegment.clone(newPlan, options);
    newPlan.departureEnrouteTransitionSegment = this.departureEnrouteTransitionSegment.clone(newPlan, options);
    newPlan.enrouteSegment = this.enrouteSegment.clone(newPlan, options);
    newPlan.arrivalEnrouteTransitionSegment = this.arrivalEnrouteTransitionSegment.clone(newPlan, options);
    newPlan.arrivalSegment = this.arrivalSegment.clone(newPlan, options);
    newPlan.arrivalRunwayTransitionSegment = this.arrivalRunwayTransitionSegment.clone(newPlan, options);
    newPlan.approachViaSegment = this.approachViaSegment.clone(newPlan, options);
    newPlan.approachSegment = this.approachSegment.clone(newPlan, options);
    newPlan.destinationSegment = this.destinationSegment.clone(newPlan, options);
    newPlan.missedApproachSegment = this.missedApproachSegment.clone(newPlan, options);

    newPlan.alternateFlightPlan = this.alternateFlightPlan.clone(this.context, newPlan, options);

    newPlan.availableOriginRunways = [...this.availableOriginRunways];
    newPlan.availableDepartures = [...this.availableDepartures];
    newPlan.availableDestinationRunways = [...this.availableDestinationRunways];
    newPlan.availableArrivals = [...this.availableArrivals];
    newPlan.availableApproaches = [...this.availableApproaches];
    newPlan.availableApproachVias = [...this.availableApproachVias];

    newPlan.activeLegIndex = this.activeLegIndex;

    newPlan.flightNumber.set(this.flightNumber.get());

    if (BitFlags.isAll(options, CopyOptions.IncludeFixInfos)) {
      newPlan.fixInfos = this.fixInfos.map((it) => it?.clone());
    }

    return newPlan;
  }

  get alternateDestinationAirport(): Airport | undefined {
    return this.alternateFlightPlan.destinationAirport;
  }

  async setAlternateDestinationAirport(icao: string | undefined) {
    await this.deleteAlternateFlightPlan();
    await this.alternateFlightPlan.setOriginAirport(this.destinationAirport?.ident);
    await this.alternateFlightPlan.setDestinationAirport(icao);

    await this.alternateFlightPlan.flushOperationQueue();
  }

  async deleteAlternateFlightPlan() {
    // unset procedures in an order least likely to leave legs behind
    await this.alternateFlightPlan.setDepartureEnrouteTransition(undefined);
    await this.alternateFlightPlan.setDeparture(undefined);
    await this.alternateFlightPlan.setOriginRunway(undefined);
    await this.alternateFlightPlan.setArrivalEnrouteTransition(undefined);
    await this.alternateFlightPlan.setArrival(undefined);
    await this.alternateFlightPlan.setApproachVia(undefined);
    await this.alternateFlightPlan.setApproach(undefined);
    await this.alternateFlightPlan.setDestinationRunway(undefined);

    // delete this last in case any other operations put legs in enroute
    this.alternateFlightPlan.enrouteSegment.clear();

    // and finally get rid of the airports (stuff might try to use them while legs still exist)
    await this.alternateFlightPlan.setDestinationAirport(undefined);
    await this.alternateFlightPlan.setOriginAirport(undefined);

    this.alternateFlightPlan.allLegs.length = 0;

    this.resetAlternatePerformanceData();

    this.alternateFlightPlan.incrementVersion();

    if (this.alternateFlightPlan.allLegs.length > 0) {
      console.warn('[FlightPlan::deleteAlternateFlightPlan] Legs left over after clearing the plan!', [
        ...this.alternateFlightPlan.allLegs,
      ]);
    }
  }

  private resetAlternatePerformanceData() {
    this.setPerformanceData('alternateClimbSpeedLimitSpeed', DefaultPerformanceData.ClimbSpeedLimitSpeed);
    this.setPerformanceData('alternateClimbSpeedLimitAltitude', DefaultPerformanceData.ClimbSpeedLimitAltitude);
    this.setPerformanceData('isAlternateClimbSpeedLimitPilotEntered', false);
    this.setPerformanceData('alternateDescentSpeedLimitSpeed', DefaultPerformanceData.DescentSpeedLimitSpeed);
    this.setPerformanceData('alternateDescentSpeedLimitAltitude', DefaultPerformanceData.DescentSpeedLimitAltitude);
    this.setPerformanceData('isAlternateDescentSpeedLimitPilotEntered', false);
    this.setPerformanceData('pilotAlternateFuel', null);
    this.setPerformanceData('alternateWind', WindUtils.undefinedWindVector);
  }

  directToLeg(ppos: Coordinates, trueTrack: Degrees, targetLegIndex: number, _withAbeam = false) {
    if (targetLegIndex >= this.firstMissedApproachLegIndex) {
      throw new Error('[FPM] Cannot direct to a leg in the missed approach segment');
    }

    const targetLeg = this.legElementAt(targetLegIndex);
    const targetLegFix = targetLeg.terminationWaypoint();
    if ((!targetLeg.isXF() && !targetLeg.isHX()) || !targetLegFix) {
      throw new Error('[FPM] Cannot direct to a non-XF leg');
    }

    const pposMagVar = MagVar.get(ppos.lat, ppos.long);
    const course = pposMagVar === null ? trueTrack : MagVar.trueToMagnetic(trueTrack, pposMagVar);

    const turningPoint = FlightPlanLeg.turningPoint(this.enrouteSegment, ppos, course, pposMagVar);
    turningPoint.flags |= FlightPlanLegFlags.DirectToTurningPoint;
    if (this.index === FlightPlanIndex.Temporary) {
      turningPoint.flags |= FlightPlanLegFlags.PendingDirectToTurningPoint;
    }

    const fixMagVar = MagVar.getForFix(targetLegFix);
    const turnEnd = FlightPlanLeg.directToTurnEnd(this.enrouteSegment, targetLegFix, fixMagVar)
      .withDefinitionFrom(targetLeg)
      .withPilotEnteredDataFrom(targetLeg);
    // If we don't do this, the turn end will have the termination waypoint's ident which may not be the leg ident (for runway legs for example)
    turnEnd.ident = targetLeg.ident;

    this.redistributeLegsAt(0);
    this.redistributeLegsAt(targetLegIndex);

    const indexInEnrouteSegment = this.enrouteSegment.allLegs.findIndex((it) => it === targetLeg);
    if (indexInEnrouteSegment === -1) {
      throw new Error('[FPM] Target leg of a direct to not found in enroute segment after leg redistribution!');
    }

    this.enrouteSegment.allLegs.splice(0, indexInEnrouteSegment + 1, turningPoint, turnEnd);
    this.incrementVersion();

    const turnEndLegIndexInPlan = this.allLegs.findIndex((it) => it === turnEnd);

    if (!this.requiresTurnDirectionAt(turnEndLegIndexInPlan + 1)) {
      this.removeForcedTurnAt(turnEndLegIndexInPlan + 1);
    }
    this.setActiveLegIndex(turnEndLegIndexInPlan);
  }

  directToWaypoint(ppos: Coordinates, trueTrack: Degrees, waypoint: Fix, withAbeam = false) {
    // TODO withAbeam
    // TODO handle direct-to into the alternate (make alternate active...?
    const existingLegIndex = this.allLegs.findIndex(
      (it) => it.isDiscontinuity === false && it.terminatesWithWaypoint(waypoint),
    );
    if (existingLegIndex !== -1 && existingLegIndex < this.firstMissedApproachLegIndex) {
      this.directToLeg(ppos, trueTrack, existingLegIndex, withAbeam);
      return;
    }

    const magVar = MagVar.get(ppos.lat, ppos.long);
    const course = magVar === null ? trueTrack : MagVar.trueToMagnetic(trueTrack, magVar);

    const turningPoint = FlightPlanLeg.turningPoint(this.enrouteSegment, ppos, course, magVar);
    const turnEnd = FlightPlanLeg.directToTurnEnd(this.enrouteSegment, waypoint, MagVar.getForFix(waypoint));

    turningPoint.flags |= FlightPlanLegFlags.DirectToTurningPoint;
    if (this.index === FlightPlanIndex.Temporary) {
      turningPoint.flags |= FlightPlanLegFlags.PendingDirectToTurningPoint;
    }

    // Move all legs before active one to the enroute segment
    let indexInEnrouteSegment = 0;
    this.redistributeLegsAt(0);
    if (this.activeLegIndex >= 1) {
      this.redistributeLegsAt(this.activeLegIndex);
      indexInEnrouteSegment = this.enrouteSegment.allLegs.findIndex((it) => it === this.activeLeg);
    }

    // Remove legs before active on from enroute
    this.enrouteSegment.allLegs.splice(0, indexInEnrouteSegment, turningPoint, turnEnd);
    this.incrementVersion();

    const turnEndLegIndexInPlan = this.allLegs.findIndex((it) => it === turnEnd);
    if (this.maybeElementAt(turnEndLegIndexInPlan + 1)?.isDiscontinuity === false) {
      this.enrouteSegment.allLegs.splice(2, 0, { isDiscontinuity: true });
      this.syncSegmentLegsChange(this.enrouteSegment);
      this.incrementVersion();

      // Since we added a discontinuity after the DIR TO leg, we want to make sure that the leg after it
      // is a leg that can be after a disco (not something like a CI) and convert it to IF
      this.cleanUpAfterDiscontinuity(turnEndLegIndexInPlan + 1);
    }

    this.setActiveLegIndex(turnEndLegIndexInPlan);
  }

  /**
   * Find next XF leg after a discontinuity and convert it to IF
   * Remove non-ground-referenced leg after the discontinuity before the XF leg
   * @param discontinuityIndex
   */
  private cleanUpAfterDiscontinuity(discontinuityIndex: number) {
    // Find next XF/HX leg
    const xFLegIndexInPlan = this.allLegs.findIndex(
      (it, index) => index > discontinuityIndex && it.isDiscontinuity === false && (it.isXF() || it.isHX()),
    );

    if (xFLegIndexInPlan !== -1) {
      // Remove elements to next XF leg
      this.removeRange(discontinuityIndex + 1, xFLegIndexInPlan);
      this.incrementVersion();

      // Replace next XF leg with IF leg if not already IF or CF
      const [segment, xfLegIndexInSegment] = this.segmentPositionForIndex(xFLegIndexInPlan);
      const xfLegAfterDiscontinuity = segment.allLegs[xfLegIndexInSegment] as FlightPlanLeg;

      if (
        xfLegAfterDiscontinuity.type !== LegType.IF &&
        xfLegAfterDiscontinuity.type !== LegType.CF &&
        xfLegAfterDiscontinuity.definition.waypoint
      ) {
        const iFLegAfterDiscontinuity = FlightPlanLeg.fromEnrouteFix(
          segment,
          xfLegAfterDiscontinuity.definition.waypoint,
          '',
          LegType.IF,
        )
          .withDefinitionFrom(xfLegAfterDiscontinuity)
          .withPilotEnteredDataFrom(xfLegAfterDiscontinuity);

        segment.allLegs.splice(xfLegIndexInSegment, 1, iFLegAfterDiscontinuity);
        this.syncSegmentLegsChange(segment);
        this.incrementVersion();
      }
    }
  }

  async enableAltn(atIndex: number, cruiseLevel: number) {
    if (!this.alternateDestinationAirport) {
      throw new Error('[FMS/FPM] Cannot enable alternate with no alternate destination defined');
    }

    this.redistributeLegsAt(atIndex);

    if (this.legCount > atIndex + 1) {
      this.removeRange(atIndex + 1, this.legCount);
    }

    // We call the segment methods because we only want to rebuild the arrival/approach when we've changed all the procedures
    await this.destinationSegment.setAirport(this.alternateDestinationAirport.ident);
    await this.destinationSegment.setRunway(this.alternateFlightPlan.destinationRunway?.ident ?? undefined);
    await this.approachSegment.setProcedure(this.alternateFlightPlan.approach?.databaseId ?? undefined);
    await this.approachViaSegment.setProcedure(this.alternateFlightPlan.approachVia?.databaseId ?? undefined);
    await this.arrivalSegment.setProcedure(this.alternateFlightPlan.arrival?.databaseId ?? undefined);
    await this.arrivalEnrouteTransitionSegment.setProcedure(
      this.alternateFlightPlan.arrivalEnrouteTransition?.databaseId ?? undefined,
    );

    const alternateLastEnrouteIndex =
      this.alternateFlightPlan.originSegment.legCount +
      this.alternateFlightPlan.departureRunwayTransitionSegment.legCount +
      this.alternateFlightPlan.departureSegment.legCount +
      this.alternateFlightPlan.departureEnrouteTransitionSegment.legCount +
      this.alternateFlightPlan.enrouteSegment.legCount;
    const alternateLegsToInsert = this.alternateFlightPlan.allLegs
      .slice(0, alternateLastEnrouteIndex)
      .map((it) => (it.isDiscontinuity === false ? it.clone(this.enrouteSegment) : it));

    if (
      this.enrouteSegment.allLegs[this.enrouteSegment.legCount - 1]?.isDiscontinuity === false &&
      alternateLegsToInsert[0]?.isDiscontinuity === false
    ) {
      this.enrouteSegment.allLegs.push({ isDiscontinuity: true });
    }

    this.enrouteSegment.allLegs.push(...alternateLegsToInsert);
    this.syncSegmentLegsChange(this.enrouteSegment);
    this.enrouteSegment.strung = false;

    this.setPerformanceData('cruiseFlightLevel', cruiseLevel);
    this.setPerformanceData('costIndex', 0);
    this.setPerformanceData('climbSpeedLimitSpeed', this.performanceData.alternateClimbSpeedLimitSpeed.get());
    this.setPerformanceData('climbSpeedLimitAltitude', this.performanceData.alternateClimbSpeedLimitAltitude.get());
    this.setPerformanceData(
      'isClimbSpeedLimitPilotEntered',
      this.performanceData.isAlternateClimbSpeedLimitPilotEntered.get(),
    );
    this.setPerformanceData('descentSpeedLimitSpeed', this.performanceData.alternateDescentSpeedLimitSpeed.get());
    this.setPerformanceData('descentSpeedLimitAltitude', this.performanceData.alternateDescentSpeedLimitAltitude.get());
    this.setPerformanceData(
      'isDescentSpeedLimitPilotEntered',
      this.performanceData.isAlternateDescentSpeedLimitPilotEntered.get(),
    );

    this.deleteAlternateFlightPlan();

    this.enqueueOperation(FlightPlanQueuedOperation.RebuildArrivalAndApproach);
    this.enqueueOperation(FlightPlanQueuedOperation.Restring);
    await this.flushOperationQueue();
  }

  override async newDest(index: number, airportIdent: string): Promise<void> {
    await super.newDest(index, airportIdent);

    await this.deleteAlternateFlightPlan();
  }

  override async setApproach(databaseId: string | undefined) {
    const currentApproachDatabaseId = this.approachSegment.procedure?.databaseId;
    await super.setApproach(databaseId);
    if (currentApproachDatabaseId !== databaseId) {
      this.setPerformanceData('approachBaroMinimum', null);
      this.setPerformanceData('approachRadioMinimum', null);
    }
  }

  setFixInfoEntry(index: 1 | 2 | 3 | 4, fixInfo: FixInfoData | null, notify = true): void {
    const planFixInfo = this.fixInfos as (FixInfoEntry | undefined)[];

    planFixInfo[index] = fixInfo ? new FixInfoEntry(fixInfo.fix, fixInfo?.radii, fixInfo?.radials) : undefined;

    if (notify) {
      this.sendEvent('flightPlan.setFixInfoEntry', {
        syncClientID: this.context.syncClientID,
        planIndex: this.index,
        batchStack: this.context.batchStack,
        forAlternate: false,
        index,
        fixInfo: planFixInfo[index] ? planFixInfo[index].clone() : null,
      });
    }

    this.incrementVersion();
  }

  editFixInfoEntry(index: 1 | 2 | 3 | 4, callback: (fixInfo: FixInfoEntry) => FixInfoEntry, notify = true): void {
    const planFixInfo = this.fixInfos as FixInfoEntry[];

    const res = callback(planFixInfo[index]);

    if (res) {
      planFixInfo[index] = res;
    }

    if (notify) {
      this.sendEvent('flightPlan.setFixInfoEntry', {
        syncClientID: this.context.syncClientID,
        planIndex: this.index,
        batchStack: this.context.batchStack,
        forAlternate: false,
        index,
        fixInfo: planFixInfo[index] ? planFixInfo[index].clone() : null,
      });
    }

    this.incrementVersion();
  }

  /**
   * Returns the active flight area for this flight plan
   */
  calculateActiveArea(): FlightArea {
    const activeLegIndex = this.activeLegIndex;

    if (activeLegIndex >= this.legCount) {
      return FlightArea.Enroute;
    }

    const [activeSegment] = this.segmentPositionForIndex(activeLegIndex);

    if (
      activeSegment === this.missedApproachSegment ||
      activeSegment === this.destinationSegment ||
      activeSegment === this.approachSegment ||
      activeSegment === this.approachViaSegment
    ) {
      const approachType = this.approach?.type ?? ApproachType.Unknown;

      switch (approachType) {
        case ApproachType.Ils:
          return FlightArea.PrecisionApproach;
        case ApproachType.Gps:
        case ApproachType.Rnav:
          return FlightArea.GpsApproach;
        case ApproachType.Vor:
        case ApproachType.VorDme:
          return FlightArea.VorApproach;
        default:
          return FlightArea.NonPrecisionApproach;
      }
    }

    if (activeSegment.class === SegmentClass.Arrival || activeSegment.class === SegmentClass.Departure) {
      return FlightArea.Terminal;
    }

    return FlightArea.Enroute;
  }

  async setOriginAirport(icao: string): Promise<void> {
    await super.setOriginAirport(icao);

    FlightPlan.setOriginDefaultPerformanceData(this, this.originAirport);
  }

  async setDestinationAirport(icao: string | undefined): Promise<void> {
    await super.setDestinationAirport(icao);

    if (this.destinationAirport) {
      FlightPlan.setDestinationDefaultPerformanceData(this, this.destinationAirport);
    }

    return this.alternateFlightPlan.setOriginAirport(icao);
  }

  /**
   * Sets performance data imported from uplink
   * @param data performance data available in uplink
   */
  setImportedPerformanceData(data: ImportedPerformanceData) {
    // Workaround for MSFS2020 not having transition alt/level in the navdata
    if (!isMsfs2024()) {
      this.setPerformanceData('databaseTransitionAltitude', data.departureTransitionAltitude);
      this.setPerformanceData('databaseTransitionLevel', data.destinationTransitionLevel);
    }
    this.setPerformanceData('costIndex', data.costIndex);
    this.setPerformanceData('cruiseFlightLevel', data.cruiseFlightLevel);
    this.setPerformanceData('pilotTropopause', data.pilotTropopause);
  }

  setFlightNumber(flightNumber: string, notify = true) {
    this.flightNumber.set(flightNumber);

    if (notify) {
      this.sendEvent('flightPlan.setFlightNumber', {
        syncClientID: this.context.syncClientID,
        planIndex: this.index,
        batchStack: this.context.batchStack,
        forAlternate: false,
        flightNumber,
      });
    }

    this.incrementVersion();
  }

  /**
   * Sets defaults for performance data parameters related to an origin
   *
   * @param plan the flight plan
   * @param airport the origin airport
   */
  private static setOriginDefaultPerformanceData<P extends FlightPlanPerformanceData>(
    plan: FlightPlan<P>,
    airport: Airport | undefined,
  ): void {
    const referenceAltitude = airport?.location.alt;

    if (referenceAltitude !== undefined) {
      plan.setPerformanceData(
        'defaultThrustReductionAltitude',
        referenceAltitude + parseInt(NXDataStore.getLegacy('CONFIG_THR_RED_ALT', '1500')),
      );
      plan.setPerformanceData(
        'defaultAccelerationAltitude',
        referenceAltitude + parseInt(NXDataStore.getLegacy('CONFIG_ACCEL_ALT', '1500')),
      );
      plan.setPerformanceData(
        'defaultEngineOutAccelerationAltitude',
        referenceAltitude + parseInt(NXDataStore.getLegacy('CONFIG_ENG_OUT_ACCEL_ALT', '1500')),
      );
      if (plan.performanceData.defaultGroundTemperature !== undefined) {
        plan.setPerformanceData(
          'defaultGroundTemperature',
          Math.round(AeroMath.isaTemperature(referenceAltitude * 0.3048)),
        );
      }
    } else {
      plan.setPerformanceData('defaultThrustReductionAltitude', null);
      plan.setPerformanceData('defaultAccelerationAltitude', null);
      plan.setPerformanceData('defaultEngineOutAccelerationAltitude', null);
    }

    plan.setPerformanceData('pilotThrustReductionAltitude', null);
    plan.setPerformanceData('pilotAccelerationAltitude', null);
    plan.setPerformanceData('pilotEngineOutAccelerationAltitude', null);

    plan.setPerformanceData('databaseTransitionAltitude', airport?.transitionAltitude ?? null);
  }

  /**
   * Sets defaults for performance data parameters related to a destination
   *
   * @param plan the flight plan
   * @param airport the destination airport
   */
  private static setDestinationDefaultPerformanceData<P extends FlightPlanPerformanceData>(
    plan: FlightPlan<P>,
    airport: Airport,
  ): void {
    const referenceAltitude = airport?.location.alt;

    if (referenceAltitude !== undefined) {
      plan.setPerformanceData(
        'defaultMissedThrustReductionAltitude',
        referenceAltitude + parseInt(NXDataStore.getLegacy('CONFIG_THR_RED_ALT', '1500')),
      );
      plan.setPerformanceData(
        'defaultMissedAccelerationAltitude',
        referenceAltitude + parseInt(NXDataStore.getLegacy('CONFIG_ACCEL_ALT', '1500')),
      );
      plan.setPerformanceData(
        'defaultMissedEngineOutAccelerationAltitude',
        referenceAltitude + parseInt(NXDataStore.getLegacy('CONFIG_ENG_OUT_ACCEL_ALT', '1500')),
      );
    } else {
      plan.setPerformanceData('defaultMissedThrustReductionAltitude', null);
      plan.setPerformanceData('defaultMissedAccelerationAltitude', null);
      plan.setPerformanceData('defaultMissedEngineOutAccelerationAltitude', null);
    }

    plan.setPerformanceData('pilotMissedThrustReductionAltitude', null);
    plan.setPerformanceData('pilotMissedAccelerationAltitude', null);
    plan.setPerformanceData('pilotMissedEngineOutAccelerationAltitude', null);

    plan.setPerformanceData('databaseTransitionLevel', airport?.transitionLevel ?? null);

    plan.deleteDescentWindEntries();
  }

  static async fromSerializedFlightPlan<P extends FlightPlanPerformanceData>(
    context: FlightPlanContext,
    index: number,
    serialized: SerializedFlightPlan,
    bus: EventBus,
    performanceDataInit: P,
    time: number,
    draftOnWindsOnWindEdit: boolean,
    maxClimbWindLevels: number,
    maxCruiseWindLevels: number,
    maxDescentWindLevels: number,
  ): Promise<FlightPlan<P>> {
    const newPlan = FlightPlan.empty<P>(
      context,
      index,
      bus,
      performanceDataInit,
      maxClimbWindLevels,
      maxCruiseWindLevels,
      maxDescentWindLevels,
      time,
      draftOnWindsOnWindEdit,
    );

    // TODO init performance data

    newPlan.activeLegIndex = serialized.activeLegIndex;
    newPlan.fixInfos = serialized.fixInfo;

    await newPlan.originSegment.setFromSerializedSegment(serialized.segments.originSegment);
    await newPlan.destinationSegment.setFromSerializedSegment(serialized.segments.destinationSegment);

    await newPlan.departureSegment.setFromSerializedSegment(serialized.segments.departureSegment);
    await newPlan.departureRunwayTransitionSegment.setFromSerializedSegment(
      serialized.segments.departureRunwayTransitionSegment,
    );
    await newPlan.departureEnrouteTransitionSegment.setFromSerializedSegment(
      serialized.segments.departureEnrouteTransitionSegment,
    );
    await newPlan.enrouteSegment.setFromSerializedSegment(serialized.segments.enrouteSegment);
    await newPlan.arrivalSegment.setFromSerializedSegment(serialized.segments.arrivalSegment);
    await newPlan.arrivalRunwayTransitionSegment.setFromSerializedSegment(
      serialized.segments.arrivalRunwayTransitionSegment,
    );
    await newPlan.arrivalEnrouteTransitionSegment.setFromSerializedSegment(
      serialized.segments.arrivalEnrouteTransitionSegment,
    );
    await newPlan.approachSegment.setFromSerializedSegment(serialized.segments.approachSegment);
    await newPlan.approachViaSegment.setFromSerializedSegment(serialized.segments.approachViaSegment);

    return newPlan;
  }

  // FIXME types
  /**
   * Sets a performance data parameter
   *
   * The union type in the signature is to work around https://github.com/microsoft/TypeScript/issues/28662.
   */
  setPerformanceData<k extends keyof (P & FlightPlanPerformanceDataProperties) & string>(
    key: k,
    value: any,
    notify = true,
  ) {
    (this.performanceData[key] as MutableSubscribable<typeof value>).set(value);

    if (this.performanceData.hasSubscription(key)) {
      console.log('[FMS/FPS] Setting performance data for a linked property, destroying subscriptions');
      this.performanceData.destroy();
    }

    if (notify) {
      this.sendPerfEvent(
        `flightPlan.setPerformanceData.${key}` as any,
        { planIndex: this.index, forAlternate: false, value } as any,
      );
    }

    this.incrementVersion();
  }

  /**
   * Check if the thrust reduction altitude is limited by a constraint and reduce it if so
   * @returns true if a reduction occured
   */
  reconcileThrustReductionWithConstraints(): boolean {
    const lowestClimbConstraint = MathUtils.round(this.lowestClimbConstraint(), 10);
    const thrRed = this.performanceData.thrustReductionAltitude.get();

    if (Number.isFinite(lowestClimbConstraint) && thrRed !== null && thrRed > lowestClimbConstraint) {
      const defaultThrRed = this.performanceData.defaultThrustReductionAltitude.get();

      this.setPerformanceData(
        'defaultThrustReductionAltitude',
        defaultThrRed !== null ? Math.min(defaultThrRed, lowestClimbConstraint) : null,
      );

      const pilotThrRed = this.performanceData.pilotThrustReductionAltitude.get();

      this.setPerformanceData(
        'pilotThrustReductionAltitude',
        pilotThrRed !== null ? Math.min(pilotThrRed, lowestClimbConstraint) : null,
      );

      return true;
    }

    return false;
  }

  /**
   * Check if the acceleration altitude is limited by a constraint and reduce it if so
   * @returns true if a reduction occured
   */
  reconcileAccelerationWithConstraints(): boolean {
    const lowestClimbConstraint = MathUtils.round(this.lowestClimbConstraint(), 10);
    const accAlt = this.performanceData.accelerationAltitude.get();

    if (Number.isFinite(lowestClimbConstraint) && accAlt !== null && accAlt > lowestClimbConstraint) {
      const defaultAccAlt = this.performanceData.defaultAccelerationAltitude.get();

      this.setPerformanceData(
        'defaultAccelerationAltitude',
        defaultAccAlt !== null ? Math.min(defaultAccAlt, lowestClimbConstraint) : null,
      );

      const pilotAccAlt = this.performanceData.pilotAccelerationAltitude.get();
      this.setPerformanceData(
        'pilotAccelerationAltitude',
        pilotAccAlt !== null ? Math.min(pilotAccAlt, lowestClimbConstraint) : null,
      );

      return true;
    }

    return false;
  }

  /**
   * Check if there is a TOO STEEP PATH segment on a leg after the active leg
   * @returns true if there is a TOO STEEP PATH segment
   */
  hasTooSteepPathAhead(): boolean {
    for (let i = this.activeLegIndex; i < this.firstMissedApproachLegIndex; i++) {
      const element = this.maybeElementAt(i);
      if (element?.isDiscontinuity === true) {
        continue;
      }

      if (element?.calculated?.endsInTooSteepPath) {
        return true;
      }
    }

    return false;
  }

  isActiveOrCopiedFromActive(): boolean {
    return (
      this.index === FlightPlanIndex.Active ||
      this.index === FlightPlanIndex.Temporary ||
      (this.flags & FlightPlanFlags.CopiedFromActive) === FlightPlanFlags.CopiedFromActive
    );
  }

  getFlightNumber(): Subject<string | null> {
    return this.flightNumber;
  }
  /**
   * Sets the climb wind entry at the specified altitude rounded to the nearest 100 feet.
   * If the provided entry is null, the entry is deleted.
   * @param altitude the altitude of the entry to set
   * @param entry the entry to set, or null to delete the entry
   * @param checkDraftConfig whether to enable draft winds if enabled by config
   */
  async setClimbWindEntry(
    altitude: number | undefined,
    entry: FlightPlanWindEntry | null,
    checkDraftConfig = true,
  ): Promise<void> {
    this.modifyClimbWindEntry(altitude, entry, checkDraftConfig);
  }

  async editClimbWindEntry(index: number, entry: FlightPlanWindEntry) {
    this.modifyClimbWindEntry(entry.altitude, entry, true, index);
  }

  /**
   * Sets the descent wind entry at the specified altitude rounded to the nearest 100 feet.
   * If the provided entry is null, the entry is deleted.
   * @param altitude the altitude of the entry to set
   * @param entry the entry to set, or null to delete the entry
   * @param planIndex which flight plan index to set the entry in
   * @param shouldUpdateTwrWind whether to update the wind on PERF APPR as well if the altitude of the wind entry is at
   * the destination altitude.
   * @param checkDraftConfig whether to prepare draft winds if enabled by config
   */
  async setDescentWindEntry(
    altitude: number | undefined,
    entry: FlightPlanWindEntry | null,
    shouldUpdateTwrWind: boolean = true,
    checkDraftConfig = true,
  ): Promise<void> {
    this.modifyDescentWindEntry(altitude, entry, shouldUpdateTwrWind, checkDraftConfig);
  }

  async editDescentWindEntry(index: number, entry: FlightPlanWindEntry) {
    this.modifyDescentWindEntry(entry.altitude, entry, true, true, index);
  }

  private modifyClimbWindEntry(
    altitude: number | undefined,
    entry: FlightPlanWindEntry | null,
    checkDraft: boolean,
    entryIndex: number | undefined = undefined,
  ) {
    if (altitude === undefined && entryIndex === undefined) {
      console.warn('Attempted to modify climb wind entry with no altitude without specifying index');
      return;
    }

    const entries = checkDraft
      ? this.prepareClimbWindDraftModification() ?? this.performanceData.climbWindEntries.get()
      : this.performanceData.climbWindEntries.get();
    const hasDraft = this.draftClimbWindExists;

    // Partial entries not allowed on non draft winds
    if (
      entry !== null &&
      !this.draftClimbWindExists &&
      (altitude === undefined || BaseFlightPlan.isPartlyFilledWindVector(entry.vector))
    ) {
      return;
    }
    const originElevation = this.originAirport?.location.alt ?? 0;
    const altitudeOrGround = altitude !== undefined && altitude <= originElevation + 400 ? originElevation : altitude;

    if (entry !== null && entry.altitude !== undefined) {
      entry.altitude = altitudeOrGround;
    }

    const existingEntryIndex =
      entryIndex !== undefined ? entryIndex : entries.findIndex((e) => e.altitude === altitudeOrGround);

    this.setClbDesWindEntry(entries, altitudeOrGround, entry, existingEntryIndex ?? -1, true);
    if (!hasDraft) {
      // Only send the event if we are not modifying the draft winds.
      // Do this so the RPC event is sent
      this.setPerformanceData('climbWindEntries', entries);
    } else {
      this.incrementVersion();
    }
  }

  private modifyDescentWindEntry(
    altitude: number | undefined,
    entry: FlightPlanWindEntry | null,
    shouldUpdateTwrWind: boolean = true,
    checkDraft: boolean,
    entryIndex: number | undefined = undefined,
  ) {
    if (altitude === undefined && entryIndex === undefined) {
      console.warn('Attempted to modify descent wind entry with no altitude without specifying index');
      return;
    }
    const entries = checkDraft
      ? this.prepareDescentWindDraftModification() ?? this.performanceData.descentWindEntries.get()
      : this.performanceData.descentWindEntries.get();
    const hasDraft = this.draftDescentWindExists;

    // Partial entries not allowed on non draft winds
    if (
      entry !== null &&
      !hasDraft &&
      (altitude === undefined || BaseFlightPlan.isPartlyFilledWindVector(entry.vector))
    ) {
      return;
    }
    const destinationElevation = this.destinationAirport?.location.alt ?? 0;
    const altitudeOrGround =
      altitude !== undefined && altitude <= destinationElevation + 400 ? destinationElevation : altitude;

    this.parseGroundWindEntryAndSetTwrWind(
      entry,
      shouldUpdateTwrWind && !this.draftDescentWindExists,
      destinationElevation,
    );

    const existingEntryIndex =
      entryIndex !== undefined ? entryIndex : entries.findIndex((e) => e.altitude === altitudeOrGround);

    this.setClbDesWindEntry(entries, altitudeOrGround, entry, existingEntryIndex ?? -1, false);
    // Do this so the RPC event is sent
    if (!hasDraft) {
      // Only send the event if we are not modifying the draft winds.
      this.setPerformanceData('descentWindEntries', entries);
    } else {
      this.incrementVersion();
    }
  }

  private parseGroundWindEntryAndSetTwrWind(
    entry: WindEntry | null,
    shouldUpdateTwrWind: boolean,
    destinationElevation: number,
  ): void {
    if (entry !== null && entry.altitude !== undefined && entry.altitude <= destinationElevation + 400) {
      entry.altitude = destinationElevation;
      if (shouldUpdateTwrWind && !BaseFlightPlan.isPartlyFilledWindVector(entry.vector)) {
        // If the entry is a GRND entry (i.e within 400 ft of the destination elevation, copy it to PERF APPR too)
        // TODO should we only do this if no pilot entry has been made?
        const destinationMagVar = this.destinationAirport
          ? Facilities.getMagVar(this.destinationAirport.location.lat, this.destinationAirport.location.long)
          : 0;

        this.setPerformanceData(
          'approachWindDirection',
          MagVar.trueToMagnetic(extractTheta(entry.vector) * MathUtils.RADIANS_TO_DEGREES, destinationMagVar),
        );
        this.setPerformanceData('approachWindMagnitude', entry.vector.magnitude ?? null);
        this.setPerformanceData('isApproachWindPilotEntered', false);
      }
    }
  }

  private setClbDesWindEntry(
    windEntries: WindEntry[],
    altitude: number | undefined,
    entry: FlightPlanWindEntry | null,
    existingEntryIndex: number,
    climb: boolean,
  ) {
    let sortEntries = false;

    if (entry === null) {
      // Delete
      if (existingEntryIndex < 0) {
        console.error('[FPM] Attempting to delete a wind entry that does not exist');
        return;
      } else {
        windEntries.splice(existingEntryIndex, 1);
        sortEntries = true;
      }
    } else {
      if (existingEntryIndex !== -1) {
        // Edit
        const old = windEntries[existingEntryIndex];
        if (
          (old.altitude !== undefined && entry.altitude === undefined) ||
          (old.vector.direction !== undefined &&
            old.vector.magnitude !== undefined &&
            (entry.vector.magnitude === undefined || entry.vector.direction === undefined))
        ) {
          // Invalidate both magnitude and direction if we are replacing an old entry which had the two defined.
          entry.vector.magnitude = undefined;
          entry.vector.direction = undefined;
          entry.altitude = undefined;
        }
        windEntries[existingEntryIndex] = entry;
      } else {
        // Add
        if (windEntries.length >= (climb ? this.maxClimbWindLevels : this.maxDescentWindLevels)) {
          // Special case is adding a PERF APPR wind when the maximum number of entries exists. In that case, we replace the lowest level
          if (altitude ?? 0 <= (windEntries[windEntries.length - 1].altitude ?? 0)) {
            console.info(
              `[FPM] Replacing ${debugFormatWindEntry(windEntries[windEntries.length - 1])} by ${debugFormatWindEntry(entry)}`,
            );
            windEntries[windEntries.length - 1] = entry;
            sortEntries = true;
          } else {
            console.error('[FPM] Attempting to add a wind entry when the maximum number of entries is reached');
          }
        } else {
          if (entry.altitude !== undefined && altitude !== undefined && altitude !== entry.altitude) {
            console.warn(
              `[FPM] Ambiguous wind entry altitudes. Adding wind entry at altitude ${entry.altitude.toFixed(0)} ft because no entry was found at ${altitude.toFixed(0)} ft`,
            );
          }
          sortEntries = true;
          windEntries.push(entry);
        }
      }
    }
    if (sortEntries) {
      const sortedEntries = this.sortWindEntriesByAltitude(windEntries);
      windEntries.splice(0, windEntries.length, ...sortedEntries);
    }
  }

  async deleteClimbWindEntries(): Promise<void> {
    this.deleteDraftClimbWindEntries();
    this.setPerformanceData('climbWindEntries', []);
  }

  async deleteDescentWindEntries(): Promise<void> {
    this.deleteDraftDescentWindEntries();
    this.setPerformanceData('descentWindEntries', []);
  }

  private deleteAllCruiseWindEntries(): void {
    this.deleteCruiseDraftWindEntries();
    for (let i = 0; i < this.allLegs.length; i++) {
      if (this.hasLegAt(i)) {
        const leg = this.legElementAt(i);

        leg.cruiseWindEntries.length = 0;
        this.syncCruiseWindChange(i);
      }
    }
  }

  async setAlternateWind(vector: WindVector, forceNoDraft = false): Promise<void> {
    if (!forceNoDraft && this.alternateDraftWind !== undefined) {
      this.alternateDraftWindExists = true;
      const oldDir = this.alternateDraftWind.direction;
      const oldMag = this.alternateDraftWind.magnitude;
      if (
        oldDir !== undefined &&
        oldMag !== undefined &&
        (vector.magnitude === undefined || vector.direction === undefined)
      ) {
        // Invalidate both magnitude and direction if we are replacing an old entry which had the two defined.
        vector.magnitude = undefined;
        vector.direction = undefined;
      }

      this.alternateDraftWind.direction = vector.direction;
      this.alternateDraftWind.magnitude = vector.magnitude;
      this.incrementVersion();
    } else {
      this.setPerformanceData('alternateWind', vector);
    }
  }

  async clearAlternateWind(): Promise<void> {
    if (
      this.alternateDraftWind !== undefined &&
      (this.alternateDraftWind.direction !== undefined || this.alternateDraftWind.magnitude !== undefined)
    ) {
      this.alternateDraftWindExists = true;
      this.alternateDraftWind.direction === undefined;
      this.alternateDraftWind.magnitude === undefined;
      this.incrementVersion();
    } else {
      this.setPerformanceData('alternateWind', WindUtils.undefinedWindVector);
    }
  }

  hasWindEntries() {
    return (
      this.performanceData.climbWindEntries.get().length > 0 ||
      this.performanceData.descentWindEntries.get().length > 0 ||
      this.allLegs.some((el) => isLeg(el) && el.cruiseWindEntries.length > 0)
    );
  }

  async insertWindUplink(): Promise<void> {
    if (!this.pendingWindUplink.isWindUplinkReadyToInsert()) {
      throw new Error('[FPM] Cannot insert wind uplink when it is not ready to insert');
    }

    if (this.pendingWindUplink.climbWinds) {
      await this.deleteClimbWindEntries();

      for (const wind of this.pendingWindUplink.climbWinds) {
        await this.setClimbWindEntry(wind.altitude!, wind, false);
      }
    }

    if (this.pendingWindUplink.cruiseWinds) {
      this.deleteAllCruiseWindEntries();

      for (const fix of this.pendingWindUplink.cruiseWinds) {
        const legIndex =
          fix.type === 'waypoint'
            ? this.findLegIndexByFixIdent(fix.fixIdent)
            : this.findLegIndexByCoordinates(fix.lat, fix.long);

        if (legIndex < 0) {
          continue;
        }

        for (const wind of fix.levels) {
          await this.addCruiseWindEntry(legIndex, wind, false);
        }
      }
    }

    if (this.pendingWindUplink.descentWinds) {
      await this.deleteDescentWindEntries();

      for (const wind of this.pendingWindUplink.descentWinds) {
        await this.setDescentWindEntry(wind.altitude!, wind, true, false);
      }
    }

    if (this.pendingWindUplink.alternateWind) {
      await this.setAlternateWind(this.pendingWindUplink.alternateWind.vector!, true);
    }

    this.pendingWindUplink.onUplinkInserted();
  }

  /**
   * Get the computed cruise level for the alternate.
   * @returns the cruise level in hundreds of feet, or undefined, if no alternate or destination exist.
   */
  public getAlternateCruiseLevel(): number | undefined {
    if (!this.destinationAirport || !this.alternateDestinationAirport) {
      return undefined;
    }

    // TODO use actual flight plan distance rather than great circle distance
    const distance = Avionics.Utils.computeGreatCircleDistance(
      this.destinationAirport.location,
      this.alternateDestinationAirport.location,
    );

    if (distance > 200) {
      return 310;
    } else if (distance > 100) {
      return 220;
    }

    return 100;
  }

  /**
   * Gets the climb wind entries from the flightplan.
   * @returns  The draft climb winds entries if they exist, otherwise the climb wind entries from the performance data
   */
  public getClimbWindEntries(): FlightPlanWindEntry[] {
    return this.draftClimbWindExists ? this.draftClimbWindEntries! : this.performanceData.climbWindEntries.get();
  }

  /**
   * Gets the descent wind entries from the flightplan.
   * @returns The draft descent winds entries if they exist, otherwise the descent wind entries from the performance data
   */
  public getDescentWindEntries(): FlightPlanWindEntry[] {
    return this.draftDescentWindExists ? this.draftDescentWindEntries! : this.performanceData.descentWindEntries.get();
  }

  /**
   * Gets the alternate wind entry from the flightplan.
   * @returns The draft alternate wind entry if it exists, otherwise the alternate wind entry from the performance data.
   */
  public getAlternateWind(): WindVector | null {
    return this.alternateDraftWindExists ? this.alternateDraftWind! : this.performanceData.alternateWind.get();
  }

  /**
   * Gets whether the flightplan has draft wind entries which are not yet inserted or deleted by the pilot.
   * @returns whether the flightplan has draft wind entries
   */
  public hasDraftWindEntries(): boolean {
    return (
      this.draftClimbWindExists ||
      this.draftCruiseWindExists ||
      this.draftDescentWindExists ||
      this.alternateDraftWindExists
    );
  }

  /**
   * Inserts the draft wind entries into the flight plan if they exist.
   */
  public insertDraftWindEntries() {
    if (
      !this.draftClimbWindExists &&
      !this.draftCruiseWindExists &&
      !this.draftDescentWindExists &&
      !this.alternateDraftWindExists
    ) {
      return;
    }

    if (this.draftClimbWindExists) {
      this.setPerformanceData(
        'climbWindEntries',
        this.filterDraftWindsByValidEntries(this.draftClimbWindEntries!, this.performanceData.climbWindEntries.get()),
      );
    }

    if (this.draftCruiseWindExists) {
      for (let i = this.activeLegIndex; i < this.firstMissedApproachLegIndex; i++) {
        const leg = this.maybeElementAt(i);
        if (isLeg(leg) && this.draftCruiseWindEntries!.has(i)) {
          const draftEntries = this.draftCruiseWindEntries!.get(i);
          if (draftEntries) {
            leg.cruiseWindEntries = this.filterDraftWindsByValidEntries(draftEntries, leg.cruiseWindEntries);
          }
          this.syncCruiseWindChange(i);
        }
      }
    }

    if (this.draftDescentWindExists) {
      const validEntries = this.filterDraftWindsByValidEntries(
        this.draftDescentWindEntries!,
        this.performanceData.descentWindEntries.get(),
      );
      for (let i = 0; i < validEntries.length; i++) {
        this.parseGroundWindEntryAndSetTwrWind(validEntries[i], true, this.destinationAirport?.location.alt ?? 0);
      }
      this.setPerformanceData('descentWindEntries', validEntries);
    }

    if (this.alternateDraftWindExists) {
      if (isWindVectorComplete(this.alternateDraftWind!)) {
        this.setAlternateWind(cloneWindVector(this.alternateDraftWind!), true);
      }
    }

    this.deleteDraftWindEntries();
  }

  /**
   * Filters the draft winds by only valid entries to be persisted to the flightplan.
    Entries with altitude not defined are not persisted, (considered a deletion)
    Partial entries with an altitude assigned, are reverted to the old value, deleted otherwise
   * @param draftWinds the flightplan draft winds
   * @param nonDraftWinds the flightplan loaded winds
   * @returns the winds which can be inserted into the flightplan
   */
  private filterDraftWindsByValidEntries(draftWinds: WindEntry[], nonDraftWinds: WindEntry[]) {
    return draftWinds
      .map((e) => {
        return BaseFlightPlan.isPartlyFilledWindVector(e.vector)
          ? nonDraftWinds.find((it) => it.altitude === e.altitude) ?? FlightPlan.emptyWindEntry
          : e;
      })
      .filter((v) => v.altitude !== undefined);
  }

  /**
   * Deletes the draft wind entries from the flight plan without inserting them, if they exist.
   */
  public deleteDraftWindEntries() {
    const climbDeleted = this.deleteDraftClimbWindEntries();
    const cruiseDeleted = this.deleteCruiseDraftWindEntries();
    const descentDeleted = this.deleteDraftDescentWindEntries();
    const alternateDeleted = this.deleteAlternateDraftWindEntries();
    if (climbDeleted || cruiseDeleted || descentDeleted || alternateDeleted) {
      this.incrementVersion();
    }
  }

  private prepareClimbWindDraftModification(): FlightPlanWindEntry[] | undefined {
    if (!this.draftClimbWindEntries) {
      return undefined;
    }

    if (!this.draftClimbWindExists) {
      this.draftClimbWindEntries.length = 0;
      const performanceDataClimbWindEntries = this.performanceData.climbWindEntries.get();
      for (let i = 0; i < performanceDataClimbWindEntries.length; i++) {
        const sourceEntry = performanceDataClimbWindEntries[i];
        this.draftClimbWindEntries.push(FlightPlan.cloneFlightPlanWindEntry(sourceEntry));
      }
      this.draftClimbWindExists = true;
    }

    return this.draftClimbWindEntries;
  }

  private deleteDraftClimbWindEntries(): boolean {
    if (this.draftClimbWindEntries !== undefined) {
      this.draftClimbWindEntries.length = 0;
      this.draftClimbWindExists = false;
      return true;
    }
    return false;
  }

  private prepareDescentWindDraftModification(): FlightPlanWindEntry[] | undefined {
    if (!this.draftDescentWindEntries) {
      return undefined;
    }
    if (!this.draftDescentWindExists) {
      this.draftDescentWindEntries.length = 0;
      const performanceDataDescentWindEntries = this.performanceData.descentWindEntries.get();
      for (let i = 0; i < performanceDataDescentWindEntries.length; i++) {
        const sourceEntry = performanceDataDescentWindEntries[i];
        this.draftDescentWindEntries.push(FlightPlan.cloneFlightPlanWindEntry(sourceEntry));
      }
      this.draftDescentWindExists = true;
    }

    return this.draftDescentWindEntries;
  }

  private deleteDraftDescentWindEntries(): boolean {
    if (this.draftDescentWindEntries !== undefined) {
      this.draftDescentWindEntries.length = 0;
      this.draftDescentWindExists = false;
      return true;
    }
    return false;
  }

  private deleteAlternateDraftWindEntries(): boolean {
    if (this.alternateDraftWind !== undefined) {
      this.alternateDraftWind.direction = undefined;
      this.alternateDraftWind.magnitude = undefined;
      this.alternateDraftWindExists = false;
      return true;
    }
    return false;
  }

  private static cloneFlightPlanWindEntry(entry: FlightPlanWindEntry): FlightPlanWindEntry {
    return {
      ...entry,
      vector: cloneWindVector(entry.vector),
    };
  }

  private sortWindEntriesByAltitude(entries: WindEntry[]) {
    const altitudeSorted = entries.filter((e) => e.altitude !== undefined).sort((a, b) => b.altitude! - a.altitude!);
    let sortIndex = 0;
    // Retain the order of undefined altitudes, others are sorted as is.
    return entries.map((v) => (v.altitude === undefined ? v : altitudeSorted[sortIndex++]));
  }
}
