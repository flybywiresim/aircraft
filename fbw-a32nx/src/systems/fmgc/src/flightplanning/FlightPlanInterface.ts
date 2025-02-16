// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Fix, Waypoint } from '@flybywiresim/fbw-sdk';
import { Coordinates, Degrees } from 'msfs-geo';
import { HoldData } from '@fmgc/flightplanning/data/flightplan';
import { FlightPlanLegDefinition } from '@fmgc/flightplanning/legs/FlightPlanLegDefinition';
import { FixInfoEntry } from '@fmgc/flightplanning/plans/FixInfo';
import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { AltitudeConstraint } from '@fmgc/flightplanning/data/constraint';
import { ReadonlyFlightPlan } from '@fmgc/flightplanning/plans/ReadonlyFlightPlan';
import { FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';

/**
 * Interface for querying, modifying and creating flight plans.
 *
 * This should be the only API used to modify flight plans - the implementations of the methods here take care of managing
 * temporary flight plan creation based on the FMS configuration, among other things.
 *
 * There are two main implementations of this interface:
 *
 * - {@link FlightPlanService} - a local implementation for use where the FMS software is located
 * - {@link FlightPlanRpcClient} - a remote implementation using RPC calls to a distant `FlightPlanService` - for use in remote FMS UIs
 */
export interface FlightPlanInterface<P extends FlightPlanPerformanceData = FlightPlanPerformanceData> {
  get(index: number): FlightPlan<P>;

  has(index: number): boolean;

  get active(): ReadonlyFlightPlan;

  get temporary(): ReadonlyFlightPlan;

  get activeOrTemporary(): ReadonlyFlightPlan;

  get uplink(): ReadonlyFlightPlan;

  secondary(index: number): ReadonlyFlightPlan;

  get hasActive(): boolean;

  get hasTemporary(): boolean;

  hasSecondary(index: number): boolean;

  get hasUplink(): boolean;

  secondaryDelete(index: number): Promise<void>;

  secondaryReset(index: number): Promise<void>;

  temporaryInsert(): Promise<void>;

  temporaryDelete(): Promise<void>;

  uplinkInsert(): Promise<void>;

  uplinkDelete(): Promise<void>;

  reset(): Promise<void>;

  /**
   * Resets the flight plan with a new FROM/TO/ALTN city pair
   *
   * @param fromIcao  ICAO of the FROM airport
   * @param toIcao    ICAO of the TO airport
   * @param altnIcao  ICAO of the ALTN airport
   * @param planIndex which flight plan (excluding temporary) to make the change on
   */
  newCityPair(fromIcao: string, toIcao: string, altnIcao?: string, planIndex?: number): Promise<void>;

  /**
   * Sets the alternate destination in the flight plan.
   *
   * @param altnIcao  ICAo of the ALTN airport
   * @param planIndex which flight plan (excluding temporary) to make the change on
   */
  setAlternate(altnIcao: string, planIndex: number): Promise<void>;

  /**
   * Sets the origin runway in the flight plan. Creates a temporary flight plan if target is active.
   *
   * @param runwayIdent the runway identifier (e.g., EDDF25C)
   * @param planIndex   which flight plan to make the change on
   * @param alternate   whether to edit the plan's alternate flight plan
   */
  setOriginRunway(runwayIdent: string, planIndex?: number, alternate?: boolean): Promise<void>;

  /**
   * Sets the departure procedure in the flight plan. Creates a temporary flight plan if target is active.
   *
   * @param databaseId     the unique database identifier of this procedure, not the ident
   * @param planIndex      which flight plan to make the change on
   * @param alternate      whether to edit the plan's alternate flight plan
   */
  setDepartureProcedure(databaseId: string | undefined, planIndex?: number, alternate?: boolean): Promise<void>;

  /**
   * Sets the departure enroute transition procedure in the flight plan. Creates a temporary flight plan if target is active.
   *
   * @param databaseId      the unique databse identifier of this procedure, not the ident
   * @param planIndex       which flight plan to make the change on
   * @param alternate       whether to edit the plan's alternate flight plan
   */
  setDepartureEnrouteTransition(databaseId: string | undefined, planIndex?: number, alternate?: boolean): Promise<void>;

  /**
   * Sets the arrival enroute transition procedure in the flight plan. Creates a temporary flight plan if target is active.
   *
   * @param databaseId      the unique databse identifier of this procedure, not the ident
   * @param planIndex       which flight plan to make the change on
   * @param alternate       whether to edit the plan's alternate flight plan
   */
  setArrivalEnrouteTransition(databaseId: string | undefined, planIndex?: number, alternate?: boolean): Promise<void>;

  /**
   * Sets the arrival procedure in the flight plan. Creates a temporary flight plan if target is active.
   *
   * @param databaseId     the unique database identifier of this procedure, not the ident
   * @param planIndex      which flight plan to make the change on
   * @param alternate      whether to edit the plan's alternate flight plan
   */
  setArrival(databaseId: string | undefined, planIndex?: number, alternate?: boolean): Promise<void>;

  /**
   * Sets the approach via in the flight plan. Creates a temporary flight plan if target is active.
   *
   * @param databaseId     the unique database identifier of this procedure, not the ident
   * @param planIndex      which flight plan to make the change on
   * @param alternate      whether to edit the plan's alternate flight plan
   */
  setApproachVia(databaseId: string | undefined, planIndex?: number, alternate?: boolean): Promise<void>;

  /**
   * Sets the approach procedure in the flight plan. Creates a temporary flight plan if target is active.
   *
   * @param databaseId     the unique database identifier of this procedure, not the ident
   * @param planIndex      which flight plan to make the change on
   * @param alternate      whether to edit the plan's alternate flight plan
   */
  setApproach(databaseId: string | undefined, planIndex?: number, alternate?: boolean): Promise<void>;

  /**
   * Sets the origin runway in the flight plan. Creates a temporary flight plan if target is active.
   *
   * @param runwayIdent the runway identifier (e.g., EDDF25C)
   * @param planIndex   which flight plan to make the change on
   * @param alternate   whether to edit the plan's alternate flight plan
   */
  setDestinationRunway(runwayIdent: string, planIndex?: number, alternate?: boolean): Promise<void>;

  /**
   * Deletes an element (leg or discontinuity) at the specified index. Depending on the {@link FpmConfig} in use,
   * this can create a temporary flight plan if target is active.
   *
   * @param index the index of the element to delete
   * @param insertDiscontinuity whether to insert a discontinuity at the deleted element's position
   * @param planIndex which flight plan to make the change on
   * @param alternate whether to edit the plan's alternate flight plan
   *
   * @returns `true` if the element could be removed, `false` if removal is not allowed
   */
  deleteElementAt(
    index: number,
    insertDiscontinuity?: boolean,
    planIndex?: number,
    alternate?: boolean,
  ): Promise<boolean>;

  /**
   * Inserts a waypoint before a leg at an index.
   *
   * @param atIndex the index of the leg to insert the waypoint before
   * @param waypoint the waypoint to insert
   * @param planIndex which flight plan to make the change on
   * @param alternate whether to edit the plan's alternate flight plan
   */
  insertWaypointBefore(atIndex: number, waypoint: Fix, planIndex?: number, alternate?: boolean): Promise<void>;

  /**
   *
   * @param atIndex the index of the leg to insert the waypoint after
   * @param planIndex which flight plan to make the change on
   * @param alternate whether to edit the plan's alternate flight plan
   */
  insertDiscontinuityAfter(atIndex: number, planIndex?: number, alternate?: boolean): Promise<void>;

  /**
   * NEXT WPT revision. Inserts a waypoint after a leg at an index, adding a discontinuity if the waypoint isn't downstream in the plan.
   *
   * @param atIndex the index of the leg to insert the waypoint after
   * @param waypoint the waypoint to insert
   * @param planIndex which flight plan to make the change on
   * @param alternate whether to edit the plan's alternate flight plan
   */
  nextWaypoint(atIndex: number, waypoint: Fix, planIndex?: number, alternate?: boolean): Promise<void>;

  /**
   * NEW DEST revision. Changes the destination airport and removes all routing ahead of an index, with a discontinuity in between.
   *
   * @param atIndex the index of the leg to insert the waypoint after
   * @param airportIdent the airport to use as the new destination
   * @param planIndex which flight plan to make the change on
   * @param alternate whether to edit the plan's alternate flight plan
   */
  newDest(atIndex: number, airportIdent: string, planIndex?: number, alternate?: boolean): Promise<void>;

  /**
   * AIRWAYS revision. Begins a pending airway entry at an index.
   *
   * @param atIndex the index of the leg to start the pending airway entry at
   * @param planIndex which flight plan to make the change on
   * @param alternate whether to edit the plan's alternate flight plan
   */
  startAirwayEntry(atIndex: number, planIndex: number, alternate?: boolean): Promise<void>;

  directToLeg(
    ppos: Coordinates,
    trueTrack: Degrees,
    targetLegIndex: number,
    withAbeam: boolean,
    planIndex: number,
  ): Promise<void>;

  // TODO do not pass in fix object (rpc)
  directToWaypoint(
    ppos: Coordinates,
    trueTrack: Degrees,
    waypoint: Fix,
    withAbeam: boolean,
    planIndex: number,
  ): Promise<void>;

  /**
   * HOLD AT revision. Inserts or edits a manual hold parented to the leg.
   *
   * @param atIndex the index of the leg to start the pending airway entry at
   * @param desiredHold the desired hold
   * @param modifiedHold the modified hold
   * @param defaultHold the default hold
   * @param planIndex which flight plan to make the change on
   * @param alternate whether to edit the plan's alternate flight plan
   */
  addOrEditManualHold(
    atIndex: number,
    desiredHold: HoldData,
    modifiedHold: HoldData,
    defaultHold: HoldData,
    planIndex: number,
    alternate?: boolean,
  ): Promise<number>;

  /**
   * Reverts a hold parented to a leg to a computed hold.
   *
   * @param atIndex the index of the leg to start the pending airway entry at
   * @param planIndex which flight plan to make the change on
   * @param alternate whether to edit the plan's alternate flight plan
   */
  revertHoldToComputed(atIndex: number, planIndex: number, alternate?: boolean): Promise<void>;

  enableAltn(atIndexInAlternate: number, cruiseLevel: number, planIndex: number): Promise<void>;

  setPilotEnteredSpeedConstraintAt(
    atIndex: number,
    isDescentConstraint: boolean,
    speed?: number,
    planIndex?: FlightPlanIndex,
    alternate?: boolean,
  ): Promise<void>;

  setPilotEnteredAltitudeConstraintAt(
    atIndex: number,
    isDescentConstraint: boolean,
    constraint?: AltitudeConstraint,
    planIndex?: FlightPlanIndex,
    alternate?: boolean,
  ): Promise<void>;

  addOrUpdateCruiseStep(atIndex: number, toAltitude: number, planIndex?: FlightPlanIndex): Promise<void>;

  removeCruiseStep(atIndex: number, planIndex?: FlightPlanIndex): Promise<void>;

  editLegDefinition(
    atIndex: number,
    changes: Partial<FlightPlanLegDefinition>,
    planIndex?: number,
    alternate?: boolean,
  ): Promise<void>;

  setFixInfoEntry(index: 1 | 2 | 3 | 4, fixInfo: FixInfoEntry | null, planIndex: number): Promise<void>;

  // TODO do not pass in callback (rpc)
  editFixInfoEntry(
    index: 1 | 2 | 3 | 4,
    callback: (fixInfo: FixInfoEntry) => FixInfoEntry,
    planIndex: number,
  ): Promise<void>;

  setPilotEntryClimbSpeedLimitSpeed(value: number, planIndex: FlightPlanIndex, alternate: boolean): Promise<void>;

  setPilotEntryClimbSpeedLimitAltitude(value: number, planIndex: FlightPlanIndex, alternate: boolean): Promise<void>;

  deleteClimbSpeedLimit(planIndex: FlightPlanIndex, alternate: boolean): Promise<void>;

  setPilotEntryDescentSpeedLimitSpeed(value: number, planIndex: FlightPlanIndex, alternate: boolean): Promise<void>;

  setPilotEntryDescentSpeedLimitAltitude(value: number, planIndex: FlightPlanIndex, alternate: boolean): Promise<void>;

  deleteDescentSpeedLimit(planIndex: FlightPlanIndex, alternate: boolean): Promise<void>;

  // TODO do not pass in waypoint object (rpc)
  isWaypointInUse(waypoint: Waypoint): Promise<boolean>;

  setFlightNumber(flightNumber: string, planIndex: number): Promise<void>;

  setPerformanceData<T extends keyof P & string>(key: T, value: P[T], planIndex: number): Promise<void>;

  stringMissedApproach(onConstraintsDeleted?: (map: FlightPlanLeg) => void, planIndex?: number): Promise<void>;
}
