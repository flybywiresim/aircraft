// @ts-strict-ignore
// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanIndex, FlightPlanManager } from '@fmgc/flightplanning/FlightPlanManager';
import { FpmConfigs } from '@fmgc/flightplanning/FpmConfig';
import { FlightPlanLeg, FlightPlanLegFlags } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { AltitudeConstraint, Fix, NXDataStore, Waypoint } from '@flybywiresim/fbw-sdk';
import { NavigationDatabase } from '@fmgc/NavigationDatabase';
import { Coordinates, Degrees } from 'msfs-geo';
import { BitFlags, EventBus } from '@microsoft/msfs-sdk';
import { FixInfoEntry } from '@fmgc/flightplanning/plans/FixInfo';
import { HoldData } from '@fmgc/flightplanning/data/flightplan';
import { FlightPlanLegDefinition } from '@fmgc/flightplanning/legs/FlightPlanLegDefinition';
import { FlightPlanInterface } from '@fmgc/flightplanning/FlightPlanInterface';
import { CopyOptions } from '@fmgc/flightplanning/plans/CloningOptions';
import {
  DefaultPerformanceData,
  FlightPlanPerformanceData,
} from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';
import { FlightPlanFlags } from './plans/FlightPlanFlags';
import { WindEntry, PropagatedWindEntry, WindVector } from './data/wind';

export class FlightPlanService<P extends FlightPlanPerformanceData = FlightPlanPerformanceData>
  implements FlightPlanInterface<P>
{
  private readonly flightPlanManager: FlightPlanManager<P>;

  navigationDatabase: NavigationDatabase;

  constructor(
    private readonly bus: EventBus,
    private readonly performanceDataInit: P,
    private config = FpmConfigs.A320_HONEYWELL_H3,
  ) {
    this.flightPlanManager = new FlightPlanManager<P>(
      this.bus,
      this.performanceDataInit,
      Math.round(Math.random() * 10_000),
      true,
    );
  }

  createFlightPlans() {
    this.flightPlanManager.create(FlightPlanIndex.Active);
    this.flightPlanManager.create(FlightPlanIndex.Uplink);
  }

  get(index: number) {
    return this.flightPlanManager.get(index);
  }

  has(index: number) {
    return this.flightPlanManager.has(index);
  }

  get active() {
    return this.flightPlanManager.get(FlightPlanIndex.Active);
  }

  get temporary() {
    return this.flightPlanManager.get(FlightPlanIndex.Temporary);
  }

  get activeOrTemporary() {
    if (this.hasTemporary) {
      return this.flightPlanManager.get(FlightPlanIndex.Temporary);
    }
    return this.flightPlanManager.get(FlightPlanIndex.Active);
  }

  get uplink() {
    return this.flightPlanManager.get(FlightPlanIndex.Uplink);
  }

  /**
   * Obtains the specified secondary flight plan, 1-indexed
   */
  secondary(index: number) {
    return this.flightPlanManager.get(FlightPlanIndex.FirstSecondary + index - 1);
  }

  get hasActive() {
    return this.flightPlanManager.has(FlightPlanIndex.Active);
  }

  get hasTemporary() {
    return this.flightPlanManager.has(FlightPlanIndex.Temporary);
  }

  hasSecondary(index: number) {
    return this.flightPlanManager.has(FlightPlanIndex.FirstSecondary + index - 1);
  }

  get hasUplink() {
    return this.flightPlanManager.has(FlightPlanIndex.Uplink);
  }

  async secondaryInit(index: number) {
    this.flightPlanManager.create(FlightPlanIndex.FirstSecondary + index - 1);
  }

  async secondaryCopyFromActive(index: number, isBeforeEngineStart: boolean) {
    // TODO copy predictions
    // We don't copy predictions for now because we don't have the computation of predictions for the secondary flight plan
    // To keep things consistent, we don't show predictions anywhere and we don't want to show any computed turn radii
    this.flightPlanManager.copy(
      FlightPlanIndex.Active,
      FlightPlanIndex.FirstSecondary + (index - 1),
      // CopyOptions.CopyPredictions,
    );

    const active = this.active;
    const sec = this.secondary(index);

    active.performanceData.pipeTo(sec.performanceData, isBeforeEngineStart);

    sec.flags |= FlightPlanFlags.CopiedFromActive;
  }

  async secondaryDelete(index: number) {
    if (!this.hasSecondary(index)) {
      throw new Error('[FMS/FPS] Cannot delete secondary flight plan if none exists');
    }

    this.flightPlanManager.delete(FlightPlanIndex.FirstSecondary + index - 1);
  }

  async secondaryReset(index: number) {
    if (this.hasSecondary(index)) {
      this.secondaryDelete(index);
    }

    this.flightPlanManager.create(FlightPlanIndex.FirstSecondary + index - 1);
  }

  async secondaryActivate(index: number, isBeforeEngineStart: boolean) {
    this.persistActivePerfDataAcrossModification(isBeforeEngineStart, () => {
      this.flightPlanManager.copy(FlightPlanIndex.FirstSecondary + index - 1, FlightPlanIndex.Active);
    });
  }

  async activeAndSecondarySwap(secIndex: number, isBeforeEngineStart: boolean): Promise<void> {
    this.persistActivePerfDataAcrossModification(isBeforeEngineStart, () => {
      this.flightPlanManager.swap(FlightPlanIndex.FirstSecondary + secIndex - 1, FlightPlanIndex.Active);
    });
  }

  private persistActivePerfDataAcrossModification(isBeforeEngineStart: boolean, activeModification: () => void) {
    const oldZfw = this.active?.performanceData.zeroFuelWeight.get() ?? null;
    const oldZfwCg = this.active?.performanceData.zeroFuelWeightCenterOfGravity.get() ?? null;
    const oldBlockFuel = this.active?.performanceData.blockFuel.get() ?? null;
    const oldTaxiFuel = this.active?.performanceData.taxiFuel.get() ?? null;
    const oldCostIndex = this.active?.performanceData.costIndex.get() ?? null;
    const oldFlightNumber = this.active?.flightNumber;

    const fixInfos = this.active?.fixInfos.map((it) => it?.clone()) ?? [];

    activeModification();

    // The ZFW/ZFWCG/BLOCK FUEL values are actually not copied to the active plan if we activate after engine start or before engine
    // start but with the values in the SEC being empty.
    // We only show the CHECK WEIGHT scratchpad message if the weights differ by more than 5 tonnes.
    if (oldZfw !== null && (!isBeforeEngineStart || this.active.performanceData.zeroFuelWeight.get() === null)) {
      this.setPerformanceData('zeroFuelWeight', oldZfw, FlightPlanIndex.Active);
    }
    if (
      oldZfwCg !== null &&
      (!isBeforeEngineStart || this.active.performanceData.zeroFuelWeightCenterOfGravity.get() === null)
    ) {
      this.setPerformanceData('zeroFuelWeightCenterOfGravity', oldZfwCg, FlightPlanIndex.Active);
    }
    if (oldBlockFuel !== null && (!isBeforeEngineStart || this.active.performanceData.blockFuel.get() === null)) {
      this.setPerformanceData('blockFuel', oldBlockFuel, FlightPlanIndex.Active);
    }

    // If CI and flight number are set in the active but not in the SEC before we swap, we keep the active plan values.
    // The same is true for the taxi fuel, but only on the A380
    if (
      this.config.PERSIST_TAXI_FUEL_ON_SEC_SWAP &&
      oldTaxiFuel !== null &&
      this.active.performanceData.pilotTaxiFuel.get() === null
    ) {
      this.setPerformanceData('pilotTaxiFuel', oldTaxiFuel, FlightPlanIndex.Active);
    }

    if (oldCostIndex !== null && this.active.performanceData.costIndex.get() === null) {
      this.setPerformanceData('costIndex', oldCostIndex, FlightPlanIndex.Active);
    }

    if (oldFlightNumber !== undefined && this.active.flightNumber === undefined) {
      this.setFlightNumber(oldFlightNumber, FlightPlanIndex.Active);
    }

    // FIX INFOs are preserved when swapping active and secondary
    // FIXME they should probabably not be part of the flight plan at all since you can only set them for the active plan
    this.active.fixInfos = fixInfos;
  }

  async temporaryInsert(): Promise<void> {
    const temporaryPlan = this.flightPlanManager.get(FlightPlanIndex.Temporary);

    if (temporaryPlan.pendingAirways) {
      temporaryPlan.pendingAirways.finalize();
    }

    if (temporaryPlan.alternateFlightPlan.pendingAirways) {
      temporaryPlan.alternateFlightPlan.pendingAirways.finalize();
    }

    const tmpyFromLeg = temporaryPlan.maybeElementAt(temporaryPlan.activeLegIndex - 1);

    const directToInTmpy =
      tmpyFromLeg?.isDiscontinuity === false && tmpyFromLeg.flags & FlightPlanLegFlags.DirectToTurningPoint;

    const directToBeingInserted =
      directToInTmpy && BitFlags.isAny(tmpyFromLeg.flags, FlightPlanLegFlags.PendingDirectToTurningPoint);

    // Update T-P
    if (directToBeingInserted) {
      temporaryPlan.editLegFlags(
        temporaryPlan.activeLegIndex - 1,
        (tmpyFromLeg.flags &= ~FlightPlanLegFlags.PendingDirectToTurningPoint),
      );

      const magneticCourse: number = SimVar.GetSimVarValue('GPS GROUND MAGNETIC TRACK', 'Degrees');
      const lat: number = SimVar.GetSimVarValue('PLANE LATITUDE', 'Degrees');
      const long: number = SimVar.GetSimVarValue('PLANE LONGITUDE', 'Degrees');

      temporaryPlan.editLegDefinition(temporaryPlan.activeLegIndex - 1, {
        magneticCourse,
        waypoint: {
          ...tmpyFromLeg.definition.waypoint,
          location: {
            // TODO fm pos
            lat,
            long,
          },
        } as Waypoint, // Needed to avoid type error with ElevatedCoordinates on Airport.
      });
    }

    this.flightPlanManager.copy(FlightPlanIndex.Temporary, FlightPlanIndex.Active, CopyOptions.IncludeFixInfos);
    this.flightPlanManager.delete(FlightPlanIndex.Temporary);
  }

  async temporaryDelete(): Promise<void> {
    if (!this.hasTemporary) {
      throw new Error('[FMS/FPS] Cannot delete temporary flight plan if none exists');
    }

    this.flightPlanManager.delete(FlightPlanIndex.Temporary);
  }

  async uplinkInsert(intoPlan = FlightPlanIndex.Active): Promise<void> {
    if (!this.hasUplink) {
      throw new Error('[FMS/FPS] Cannot insert uplink flight plan if none exists');
    }

    this.flightPlanManager.copy(FlightPlanIndex.Uplink, intoPlan);
    this.flightPlanManager.delete(FlightPlanIndex.Uplink);

    if (this.hasTemporary) {
      this.flightPlanManager.delete(FlightPlanIndex.Temporary);
    }
  }

  async uplinkDelete(): Promise<void> {
    if (!this.hasUplink) {
      throw new Error('[FMS/FPS] Cannot delete uplink flight plan if none exists');
    }

    this.flightPlanManager.delete(FlightPlanIndex.Uplink);
  }

  async reset(): Promise<void> {
    this.flightPlanManager.reset();

    this.createFlightPlans();
  }

  private prepareDestructiveModification(planIndex: FlightPlanIndex) {
    let finalIndex = planIndex;
    if (planIndex === FlightPlanIndex.Active) {
      this.ensureTemporaryExists();

      finalIndex = FlightPlanIndex.Temporary;
    }

    return finalIndex;
  }

  async newCityPair(fromIcao: string, toIcao: string, altnIcao?: string, planIndex = FlightPlanIndex.Active) {
    if (planIndex === FlightPlanIndex.Temporary) {
      throw new Error('[FMS/FPM] Cannot enter new city pair on temporary flight plan');
    }

    if (planIndex === FlightPlanIndex.Active && this.flightPlanManager.has(FlightPlanIndex.Temporary)) {
      this.flightPlanManager.delete(FlightPlanIndex.Temporary);
    }

    if (this.flightPlanManager.has(planIndex)) {
      this.flightPlanManager.delete(planIndex);
    }
    this.flightPlanManager.create(planIndex);

    await this.flightPlanManager.get(planIndex).setOriginAirport(fromIcao);
    await this.flightPlanManager.get(planIndex).setDestinationAirport(toIcao);

    if (altnIcao) {
      await this.flightPlanManager.get(planIndex).setAlternateDestinationAirport(altnIcao);
    }

    // Support code for TELEX API, should move somewhere else
    NXDataStore.setLegacy('PLAN_ORIGIN', fromIcao);
    NXDataStore.setLegacy('PLAN_DESTINATION', toIcao);
  }

  async setAlternate(altnIcao: string, planIndex = FlightPlanIndex.Active) {
    if (planIndex === FlightPlanIndex.Temporary) {
      throw new Error('[FMS/FPM] Cannot set alternate on temporary flight plan');
    }

    const plan = this.flightPlanManager.get(planIndex);

    if (altnIcao === undefined) {
      return plan.deleteAlternateFlightPlan();
    }

    return plan.setAlternateDestinationAirport(altnIcao);
  }

  setOriginRunway(runwayIdent: string, planIndex = FlightPlanIndex.Active, alternate = false) {
    const finalIndex = this.prepareDestructiveModification(planIndex);

    const plan = alternate
      ? this.flightPlanManager.get(finalIndex).alternateFlightPlan
      : this.flightPlanManager.get(finalIndex);

    return plan.setOriginRunway(runwayIdent);
  }

  setDepartureProcedure(databaseId: string | undefined, planIndex = FlightPlanIndex.Active, alternate = false) {
    const finalIndex = this.prepareDestructiveModification(planIndex);

    const plan = alternate
      ? this.flightPlanManager.get(finalIndex).alternateFlightPlan
      : this.flightPlanManager.get(finalIndex);

    return plan.setDeparture(databaseId);
  }

  setDepartureEnrouteTransition(databaseId: string | undefined, planIndex = FlightPlanIndex.Active, alternate = false) {
    const finalIndex = this.prepareDestructiveModification(planIndex);

    const plan = alternate
      ? this.flightPlanManager.get(finalIndex).alternateFlightPlan
      : this.flightPlanManager.get(finalIndex);

    return plan.setDepartureEnrouteTransition(databaseId);
  }

  setArrivalEnrouteTransition(databaseId: string | undefined, planIndex = FlightPlanIndex.Active, alternate = false) {
    const finalIndex = this.prepareDestructiveModification(planIndex);

    const plan = alternate
      ? this.flightPlanManager.get(finalIndex).alternateFlightPlan
      : this.flightPlanManager.get(finalIndex);

    return plan.setArrivalEnrouteTransition(databaseId);
  }

  setArrival(databaseId: string | undefined, planIndex = FlightPlanIndex.Active, alternate = false) {
    const finalIndex = this.prepareDestructiveModification(planIndex);

    const plan = alternate
      ? this.flightPlanManager.get(finalIndex).alternateFlightPlan
      : this.flightPlanManager.get(finalIndex);

    return plan.setArrival(databaseId);
  }

  setApproachVia(databaseId: string | undefined, planIndex = FlightPlanIndex.Active, alternate = false) {
    const finalIndex = this.prepareDestructiveModification(planIndex);

    const plan = alternate
      ? this.flightPlanManager.get(finalIndex).alternateFlightPlan
      : this.flightPlanManager.get(finalIndex);

    return plan.setApproachVia(databaseId);
  }

  setApproach(databaseId: string | undefined, planIndex = FlightPlanIndex.Active, alternate = false) {
    const finalIndex = this.prepareDestructiveModification(planIndex);

    const plan = alternate
      ? this.flightPlanManager.get(finalIndex).alternateFlightPlan
      : this.flightPlanManager.get(finalIndex);

    return plan.setApproach(databaseId);
  }

  setDestinationRunway(runwayIdent: string, planIndex = FlightPlanIndex.Active, alternate = false) {
    const finalIndex = this.prepareDestructiveModification(planIndex);

    const plan = alternate
      ? this.flightPlanManager.get(finalIndex).alternateFlightPlan
      : this.flightPlanManager.get(finalIndex);

    return plan.setDestinationRunway(runwayIdent);
  }

  async deleteElementAt(
    index: number,
    insertDiscontinuity: boolean = false,
    planIndex = FlightPlanIndex.Active,
    alternate = false,
  ): Promise<boolean> {
    if (!this.config.ALLOW_REVISIONS_ON_TMPY && planIndex === FlightPlanIndex.Temporary) {
      throw new Error('[FMS/FPS] Cannot delete element in temporary flight plan');
    }

    let finalIndex: number = planIndex;
    if (this.config.TMPY_ON_DELETE_WAYPOINT) {
      finalIndex = this.prepareDestructiveModification(planIndex);
    }

    const plan = alternate
      ? this.flightPlanManager.get(finalIndex).alternateFlightPlan
      : this.flightPlanManager.get(finalIndex);

    return plan.removeElementAt(index, insertDiscontinuity);
  }

  async insertWaypointBefore(atIndex: number, waypoint: Fix, planIndex = FlightPlanIndex.Active, alternate = false) {
    let finalIndex: number = planIndex;
    if (this.config.TMPY_ON_INSERT_WAYPOINT) {
      finalIndex = this.prepareDestructiveModification(planIndex);
    }

    const plan = alternate
      ? this.flightPlanManager.get(finalIndex).alternateFlightPlan
      : this.flightPlanManager.get(finalIndex);

    await plan.insertWaypointBefore(atIndex, waypoint);
  }

  async insertDiscontinuityAfter(atIndex: number, planIndex = FlightPlanIndex.Active, alternate = false) {
    const finalIndex = this.prepareDestructiveModification(planIndex);

    const plan = alternate
      ? this.flightPlanManager.get(finalIndex).alternateFlightPlan
      : this.flightPlanManager.get(finalIndex);

    await plan.insertDiscontinuityAfter(atIndex);
  }

  async nextWaypoint(atIndex: number, waypoint: Fix, planIndex = FlightPlanIndex.Active, alternate = false) {
    const finalIndex = this.prepareDestructiveModification(planIndex);

    const plan = alternate
      ? this.flightPlanManager.get(finalIndex).alternateFlightPlan
      : this.flightPlanManager.get(finalIndex);

    await plan.nextWaypoint(atIndex, waypoint);
  }

  async newDest(atIndex: number, airportIdent: string, planIndex = FlightPlanIndex.Active, alternate = false) {
    const finalIndex = this.prepareDestructiveModification(planIndex);

    const plan = alternate
      ? this.flightPlanManager.get(finalIndex).alternateFlightPlan
      : this.flightPlanManager.get(finalIndex);

    await plan.newDest(atIndex, airportIdent);
  }

  async startAirwayEntry(at: number, planIndex = FlightPlanIndex.Active, alternate = false) {
    const finalIndex = this.prepareDestructiveModification(planIndex);

    const plan = alternate
      ? this.flightPlanManager.get(finalIndex).alternateFlightPlan
      : this.flightPlanManager.get(finalIndex);

    plan.startAirwayEntry(at);
  }

  async directToWaypoint(
    ppos: Coordinates,
    trueTrack: Degrees,
    waypoint: Fix,
    withAbeam = false,
    planIndex = FlightPlanIndex.Active,
  ) {
    const finalIndex = this.prepareDestructiveModification(planIndex);

    const plan = this.flightPlanManager.get(finalIndex);

    plan.directToWaypoint(ppos, trueTrack, waypoint, withAbeam);
  }

  async directToLeg(
    ppos: Coordinates,
    trueTrack: Degrees,
    targetLegIndex: number,
    withAbeam = false,
    planIndex = FlightPlanIndex.Active,
  ) {
    const finalIndex = this.prepareDestructiveModification(planIndex);

    const plan = this.flightPlanManager.get(finalIndex);

    plan.directToLeg(ppos, trueTrack, targetLegIndex, withAbeam);
  }

  async addOrEditManualHold(
    at: number,
    desiredHold: HoldData,
    modifiedHold: HoldData | undefined,
    defaultHold: HoldData,
    planIndex = FlightPlanIndex.Active,
    alternate = false,
  ): Promise<number> {
    const finalIndex = this.prepareDestructiveModification(planIndex);

    const plan = alternate
      ? this.flightPlanManager.get(finalIndex).alternateFlightPlan
      : this.flightPlanManager.get(finalIndex);

    return plan.addOrEditManualHold(at, desiredHold, modifiedHold, defaultHold);
  }

  async revertHoldToComputed(at: number, planIndex = FlightPlanIndex.Active, alternate = false) {
    const finalIndex = this.prepareDestructiveModification(planIndex);

    const plan = alternate
      ? this.flightPlanManager.get(finalIndex).alternateFlightPlan
      : this.flightPlanManager.get(finalIndex);

    plan.revertHoldToComputed(at);
  }

  async enableAltn(atIndexInAlternate: number, cruiseLevel: number = 100, planIndex = FlightPlanIndex.Active) {
    const finalIndex = this.prepareDestructiveModification(planIndex);

    const plan = this.flightPlanManager.get(finalIndex);

    await plan.enableAltn(atIndexInAlternate, cruiseLevel);
  }

  async setPilotEnteredAltitudeConstraintAt(
    atIndex: number,
    isDescentConstraint: boolean,
    constraint?: AltitudeConstraint,
    planIndex?: FlightPlanIndex,
    alternate?: boolean,
  ): Promise<void> {
    const finalIndex = this.config.TMPY_ON_CONSTRAINT_EDIT ? this.prepareDestructiveModification(planIndex) : planIndex;

    const plan = alternate
      ? this.flightPlanManager.get(finalIndex).alternateFlightPlan
      : this.flightPlanManager.get(finalIndex);

    plan.setPilotEnteredAltitudeConstraintAt(atIndex, isDescentConstraint, constraint);
  }

  async setPilotEnteredSpeedConstraintAt(
    atIndex: number,
    isDescentConstraint: boolean,
    speed?: number,
    planIndex?: FlightPlanIndex,
    alternate?: boolean,
  ): Promise<void> {
    const finalIndex = this.config.TMPY_ON_CONSTRAINT_EDIT ? this.prepareDestructiveModification(planIndex) : planIndex;

    const plan = alternate
      ? this.flightPlanManager.get(finalIndex).alternateFlightPlan
      : this.flightPlanManager.get(finalIndex);

    plan.setPilotEnteredSpeedConstraintAt(atIndex, isDescentConstraint, speed);
  }

  async addOrUpdateCruiseStep(atIndex: number, toAltitude: number, planIndex = FlightPlanIndex.Active): Promise<void> {
    const finalIndex = this.config.TMPY_ON_CONSTRAINT_EDIT ? this.prepareDestructiveModification(planIndex) : planIndex;

    const plan = this.flightPlanManager.get(finalIndex);

    plan.addOrUpdateCruiseStep(atIndex, toAltitude);
  }

  async removeCruiseStep(atIndex: number, planIndex: FlightPlanIndex = FlightPlanIndex.Active): Promise<void> {
    const finalIndex = this.config.TMPY_ON_CONSTRAINT_EDIT ? this.prepareDestructiveModification(planIndex) : planIndex;

    const plan = this.flightPlanManager.get(finalIndex);

    plan.removeCruiseStep(atIndex);
  }

  async editLegDefinition(
    atIndex: number,
    changes: Partial<FlightPlanLegDefinition>,
    planIndex = FlightPlanIndex.Active,
    alternate = false,
  ) {
    const finalIndex = this.prepareDestructiveModification(planIndex);

    const plan = alternate
      ? this.flightPlanManager.get(finalIndex).alternateFlightPlan
      : this.flightPlanManager.get(finalIndex);

    return plan.editLegDefinition(atIndex, changes);
  }

  async setOverfly(atIndex: number, overfly: boolean, planIndex = FlightPlanIndex.Active, alternate = false) {
    let finalIndex: number = planIndex;
    if (this.config.TMPY_ON_OVERFLY) {
      finalIndex = this.prepareDestructiveModification(planIndex);
    }

    const plan = alternate
      ? this.flightPlanManager.get(finalIndex).alternateFlightPlan
      : this.flightPlanManager.get(finalIndex);

    return plan.setOverflyAt(atIndex, overfly);
  }

  async toggleOverfly(atIndex: number, planIndex = FlightPlanIndex.Active, alternate = false) {
    let finalIndex: number = planIndex;
    if (this.config.TMPY_ON_OVERFLY) {
      finalIndex = this.prepareDestructiveModification(planIndex);
    }

    const plan = alternate
      ? this.flightPlanManager.get(finalIndex).alternateFlightPlan
      : this.flightPlanManager.get(finalIndex);

    return plan.toggleOverflyAt(atIndex);
  }

  async setFixInfoEntry(index: 1 | 2 | 3 | 4, fixInfo: FixInfoEntry | null, planIndex = FlightPlanIndex.Active) {
    if (!this.config.ALLOW_NON_ACTIVE_FIX_INFOS && planIndex !== FlightPlanIndex.Active) {
      throw new Error('FIX INFO can only be modified on the active flight plan');
    }

    const plan = this.flightPlanManager.get(planIndex);

    plan.setFixInfoEntry(index, fixInfo);
  }

  async editFixInfoEntry(
    index: 1 | 2 | 3 | 4,
    callback: (fixInfo: FixInfoEntry) => FixInfoEntry,
    planIndex = FlightPlanIndex.Active,
  ) {
    if (!this.config.ALLOW_NON_ACTIVE_FIX_INFOS && planIndex !== FlightPlanIndex.Active) {
      throw new Error('FIX INFO can only be modified on the active flight plan');
    }

    const plan = this.flightPlanManager.get(planIndex);

    plan.editFixInfoEntry(index, callback);
  }

  async setPilotEntryClimbSpeedLimitSpeed(value: number, planIndex = FlightPlanIndex.Active, alternate = false) {
    const finalIndex = this.config.TMPY_ON_CONSTRAINT_EDIT ? this.prepareDestructiveModification(planIndex) : planIndex;

    const plan = this.flightPlanManager.get(finalIndex);

    const performanceDataAltitudeKey = alternate ? 'alternateClimbSpeedLimitAltitude' : 'climbSpeedLimitAltitude';

    if (plan.performanceData[performanceDataAltitudeKey] === null) {
      plan.setPerformanceData(performanceDataAltitudeKey, DefaultPerformanceData.ClimbSpeedLimitAltitude);
    }

    plan.setPerformanceData(alternate ? 'alternateClimbSpeedLimitSpeed' : 'climbSpeedLimitSpeed', value);
    plan.setPerformanceData(
      alternate ? 'isAlternateClimbSpeedLimitPilotEntered' : 'isClimbSpeedLimitPilotEntered',
      true,
    );

    plan.incrementVersion();
  }

  async setPilotEntryClimbSpeedLimitAltitude(value: number, planIndex = FlightPlanIndex.Active, alternate = false) {
    const finalIndex = this.config.TMPY_ON_CONSTRAINT_EDIT ? this.prepareDestructiveModification(planIndex) : planIndex;

    const plan = this.flightPlanManager.get(finalIndex);

    const performanceDataSpeedKey = alternate ? 'alternateClimbSpeedLimitSpeed' : 'climbSpeedLimitSpeed';

    if (plan.performanceData[performanceDataSpeedKey] === null) {
      plan.setPerformanceData(performanceDataSpeedKey, DefaultPerformanceData.ClimbSpeedLimitSpeed);
    }

    plan.setPerformanceData(alternate ? 'alternateClimbSpeedLimitAltitude' : 'climbSpeedLimitAltitude', value);
    plan.setPerformanceData(
      alternate ? 'isAlternateClimbSpeedLimitPilotEntered' : 'isClimbSpeedLimitPilotEntered',
      true,
    );

    plan.incrementVersion();
  }

  async deleteClimbSpeedLimit(planIndex = FlightPlanIndex.Active, alternate = false) {
    const finalIndex = this.config.TMPY_ON_CONSTRAINT_EDIT ? this.prepareDestructiveModification(planIndex) : planIndex;

    const plan = this.flightPlanManager.get(finalIndex);

    plan.setPerformanceData(alternate ? 'alternateClimbSpeedLimitSpeed' : 'climbSpeedLimitSpeed', null);
    plan.setPerformanceData(alternate ? 'alternateClimbSpeedLimitAltitude' : 'climbSpeedLimitAltitude', null);
    plan.setPerformanceData(
      alternate ? 'isAlternateClimbSpeedLimitPilotEntered' : 'isClimbSpeedLimitPilotEntered',
      true,
    );

    plan.incrementVersion();
  }

  async setPilotEntryDescentSpeedLimitSpeed(value: number, planIndex = FlightPlanIndex.Active, alternate = false) {
    const finalIndex = this.config.TMPY_ON_CONSTRAINT_EDIT ? this.prepareDestructiveModification(planIndex) : planIndex;

    const plan = this.flightPlanManager.get(finalIndex);

    const performanceDataAltitudeKey = alternate ? 'alternateDescentSpeedLimitAltitude' : 'descentSpeedLimitAltitude';

    if (plan.performanceData[performanceDataAltitudeKey] === null) {
      plan.setPerformanceData(performanceDataAltitudeKey, DefaultPerformanceData.DescentSpeedLimitAltitude);
    }

    plan.setPerformanceData(alternate ? 'alternateDescentSpeedLimitSpeed' : 'descentSpeedLimitSpeed', value);
    plan.setPerformanceData(
      alternate ? 'isAlternateDescentSpeedLimitPilotEntered' : 'isDescentSpeedLimitPilotEntered',
      true,
    );

    plan.incrementVersion();
  }

  async setPilotEntryDescentSpeedLimitAltitude(value: number, planIndex = FlightPlanIndex.Active, alternate = false) {
    const finalIndex = this.config.TMPY_ON_CONSTRAINT_EDIT ? this.prepareDestructiveModification(planIndex) : planIndex;

    const plan = this.flightPlanManager.get(finalIndex);

    const performanceDataSpeedKey = alternate ? 'alternateDescentSpeedLimitSpeed' : 'descentSpeedLimitSpeed';

    if (plan.performanceData[performanceDataSpeedKey] === null) {
      plan.setPerformanceData(performanceDataSpeedKey, DefaultPerformanceData.DescentSpeedLimitSpeed);
    }

    plan.setPerformanceData(alternate ? 'alternateDescentSpeedLimitAltitude' : 'descentSpeedLimitAltitude', value);
    plan.setPerformanceData(
      alternate ? 'isAlternateDescentSpeedLimitPilotEntered' : 'isDescentSpeedLimitPilotEntered',
      true,
    );

    plan.incrementVersion();
  }

  async deleteDescentSpeedLimit(planIndex = FlightPlanIndex.Active, alternate = false) {
    const finalIndex = this.config.TMPY_ON_CONSTRAINT_EDIT ? this.prepareDestructiveModification(planIndex) : planIndex;

    const plan = this.flightPlanManager.get(finalIndex);

    plan.setPerformanceData(alternate ? 'alternateDescentSpeedLimitSpeed' : 'descentSpeedLimitSpeed', null);
    plan.setPerformanceData(alternate ? 'alternateDescentSpeedLimitAltitude' : 'descentSpeedLimitAltitude', null);
    plan.setPerformanceData(
      alternate ? 'isAlternateDescentSpeedLimitPilotEntered' : 'isDescentSpeedLimitPilotEntered',
      true,
    );

    plan.incrementVersion();
  }

  get activeLegIndex(): number {
    return this.active.activeLegIndex;
  }

  async isWaypointInUse(waypoint: Waypoint) {
    const activePlan = this.active;

    for (const leg of activePlan.allLegs) {
      if (leg.isDiscontinuity === false && leg.terminatesWithWaypoint(waypoint)) {
        return true;
      }
    }

    if (this.hasTemporary) {
      const temporaryPlan = this.temporary;

      for (const leg of temporaryPlan.allLegs) {
        if (leg.isDiscontinuity === false && leg.terminatesWithWaypoint(waypoint)) {
          return true;
        }
      }
    }

    if (this.hasSecondary(1)) {
      const secondaryPlan = this.secondary(1);

      for (const leg of secondaryPlan.allLegs) {
        if (leg.isDiscontinuity === false && leg.terminatesWithWaypoint(waypoint)) {
          return true;
        }
      }
    }

    return false;
  }

  private async ensureTemporaryExists() {
    if (this.hasTemporary) {
      return;
    }

    this.flightPlanManager.copy(FlightPlanIndex.Active, FlightPlanIndex.Temporary, CopyOptions.IncludeFixInfos);
  }

  async setFlightNumber(flightNumber: string, planIndex = FlightPlanIndex.Active) {
    const plan = this.flightPlanManager.get(planIndex);

    plan.setFlightNumber(flightNumber);
  }

  // FIXME types
  async setPerformanceData<k extends keyof (P & FlightPlanPerformanceData) & string>(
    key: k,
    value: any,
    planIndex = FlightPlanIndex.Active,
  ) {
    const plan = this.flightPlanManager.get(planIndex);

    plan.setPerformanceData(key, value);
  }

  async stringMissedApproach(
    onConstraintsDeleted = (_: FlightPlanLeg): void => {},
    planIndex = FlightPlanIndex.Active,
  ) {
    const plan = this.flightPlanManager.get(planIndex);

    return plan.stringMissedApproach(onConstraintsDeleted);
  }

  propagateWindsAt(atIndex: number, result: PropagatedWindEntry[], planIndex = FlightPlanIndex.Active) {
    const plan = this.flightPlanManager.get(planIndex);

    return plan.propagateWindsAt(atIndex, result, this.config.NUM_CRUISE_WIND_LEVELS);
  }

  addCruiseWindEntry(atIndex: number, entry: WindEntry, planIndex: number): Promise<void> {
    const plan = this.flightPlanManager.get(planIndex);

    return plan.addCruiseWindEntry(atIndex, entry, this.config.NUM_CRUISE_WIND_LEVELS);
  }

  deleteCruiseWindEntry(atIndex: number, altitude: number, planIndex: number): Promise<void> {
    const plan = this.flightPlanManager.get(planIndex);

    return plan.deleteCruiseWindEntry(atIndex, altitude);
  }

  editCruiseWindEntry(atIndex: number, altitude: number, newEntry: WindEntry, planIndex: number): Promise<void> {
    const plan = this.flightPlanManager.get(planIndex);

    return plan.editCruiseWindEntry(atIndex, altitude, newEntry, this.config.NUM_CRUISE_WIND_LEVELS);
  }

  setClimbWindEntry(altitude: number, entry: WindEntry | null, planIndex: number): Promise<void> {
    const plan = this.flightPlanManager.get(planIndex);

    return plan.setClimbWindEntry(altitude, entry, this.config.NUM_CLIMB_WIND_LEVELS);
  }

  setDescentWindEntry(
    altitude: number,
    entry: WindEntry | null,
    planIndex: number,
    shouldUpdateTwrWind: boolean = true,
  ): Promise<void> {
    const plan = this.flightPlanManager.get(planIndex);

    return plan.setDescentWindEntry(altitude, entry, this.config.NUM_DESCENT_WIND_LEVELS, shouldUpdateTwrWind);
  }

  deleteClimbWindEntries(planIndex: number) {
    const plan = this.flightPlanManager.get(planIndex);

    return plan.deleteClimbWindEntries();
  }

  deleteDescentWindEntries(planIndex: number) {
    const plan = this.flightPlanManager.get(planIndex);

    return plan.deleteDescentWindEntries();
  }

  setAlternateWind(entry: WindVector | null, planIndex: number): Promise<void> {
    const plan = this.flightPlanManager.get(planIndex);

    return plan.setAlternateWind(entry);
  }

  insertWindUplink(planIndex: number): Promise<void> {
    const plan = this.flightPlanManager.get(planIndex);

    return plan.insertWindUplink(
      this.config.NUM_CLIMB_WIND_LEVELS,
      this.config.NUM_CRUISE_WIND_LEVELS,
      this.config.NUM_DESCENT_WIND_LEVELS,
    );
  }
}
