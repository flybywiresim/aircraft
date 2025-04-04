// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanIndex, FlightPlanManager } from '@fmgc/flightplanning/FlightPlanManager';
import { FpmConfigs } from '@fmgc/flightplanning/FpmConfig';
import { FlightPlanLeg, FlightPlanLegFlags } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { Fix, NXDataStore, Waypoint } from '@flybywiresim/fbw-sdk';
import { NavigationDatabase } from '@fmgc/NavigationDatabase';
import { Coordinates, Degrees } from 'msfs-geo';
import { BitFlags, EventBus } from '@microsoft/msfs-sdk';
import { FixInfoEntry } from '@fmgc/flightplanning/plans/FixInfo';
import { HoldData } from '@fmgc/flightplanning/data/flightplan';
import { FlightPlanLegDefinition } from '@fmgc/flightplanning/legs/FlightPlanLegDefinition';
import { FlightPlanInterface } from '@fmgc/flightplanning/FlightPlanInterface';
import { AltitudeConstraint } from '@fmgc/flightplanning/data/constraint';
import { CopyOptions } from '@fmgc/flightplanning/plans/CloningOptions';
import { FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';

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
    if (this.flightPlanManager.has(FlightPlanIndex.FirstSecondary + index - 1)) {
      console.error('[FMS/FPS] Cannot create secondary flight plan if one already exists');
      return;
    }

    this.flightPlanManager.create(FlightPlanIndex.FirstSecondary + index - 1);
  }

  async secondaryCopyFromActive(index: number) {
    this.flightPlanManager.copy(
      FlightPlanIndex.Active,
      FlightPlanIndex.FirstSecondary + (index - 1),
      CopyOptions.CopyPredictions,
    );
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

  async secondaryActivate(index: number) {
    this.flightPlanManager.copy(FlightPlanIndex.FirstSecondary + index - 1, FlightPlanIndex.Active);
  }

  async activeAndSecondarySwap(secIndex: number): Promise<void> {
    this.flightPlanManager.swap(FlightPlanIndex.FirstSecondary + secIndex - 1, FlightPlanIndex.Active);
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
    this.flightPlanManager.deleteAll();

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
    NXDataStore.set('PLAN_ORIGIN', fromIcao);
    NXDataStore.set('PLAN_DESTINATION', toIcao);
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

  async setPerformanceData<k extends keyof P & string>(key: k, value: P[k], planIndex = FlightPlanIndex.Active) {
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
}
