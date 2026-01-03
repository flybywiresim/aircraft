// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { AltitudeConstraint, Fix, Waypoint } from '@flybywiresim/fbw-sdk';
import { Coordinates, Degrees } from 'msfs-geo';
import { HoldData } from '@fmgc/flightplanning/data/flightplan';
import { FlightPlanLegDefinition } from '@fmgc/flightplanning/legs/FlightPlanLegDefinition';
import { FixInfoEntry } from '@fmgc/flightplanning/plans/FixInfo';
import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { ReadonlyFlightPlan } from '@fmgc/flightplanning/plans/ReadonlyFlightPlan';
import { FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { WindEntry, PropagatedWindEntry, WindVector } from './data/wind';

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

  secondaryInit(index: number): Promise<void>;

  /**
   * Copies the active flight plan into a secondary flight plan
   *
   * @param index the 1-indexed index of the secondary flight plan
   */
  secondaryCopyFromActive(index: number, isBeforeEngineStart: boolean): Promise<void>;

  secondaryDelete(index: number): Promise<void>;

  secondaryReset(index: number): Promise<void>;

  secondaryActivate(index: number, isBeforeEngineStart: boolean): Promise<void>;

  activeAndSecondarySwap(secIndex: number, isBeforeEngineStart: boolean): Promise<void>;

  temporaryInsert(): Promise<void>;

  temporaryDelete(): Promise<void>;

  uplinkInsert(intoPlan: number): Promise<void>;

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

  /**
   * Sets a pilot entry speed value on the climb speed limit of the performance data.
   * If no altitude is previously defined, a default value is applied to it.
   * @param value which speed in knots to apply
   * @param planIndex which flightplan index to apply to speed limit
   * @param alternate whether to apply the speedlimit to the alternate flightplan performance data
   */
  setPilotEntryClimbSpeedLimitSpeed(value: number, planIndex: FlightPlanIndex, alternate: boolean): Promise<void>;

  /**
   * Sets a pilot entry altitude value on the climb speed limit of the performance data.
   * If no speed is previously defined, a default value is applied to it
   * @param value which altitude in feet to apply
   * @param planIndex which flightplan index to apply to speed limit
   * @param alternate whether to apply the speedlimit to the alternate flightplan performance data
   */
  setPilotEntryClimbSpeedLimitAltitude(value: number, planIndex: FlightPlanIndex, alternate: boolean): Promise<void>;

  /**
   * Deletes the climb speed limit from the performance data
   * @param planIndex which flightplan index to delete the climb speed limit from
   * @param alternate whether to delete the speed limit from the alternate performance data
   */
  deleteClimbSpeedLimit(planIndex: FlightPlanIndex, alternate: boolean): Promise<void>;

  /**
   * Sets a pilot entry speed value on the descent speed limit of the performance data.
   * If no altitude is previously defined, a default value is applied to it.
   * @param value which speed in knots to apply
   * @param planIndex which flightplan index to apply to speed limit
   * @param alternate whether to apply the speedlimit to the alternate flightplan performance data
   */
  setPilotEntryDescentSpeedLimitSpeed(value: number, planIndex: FlightPlanIndex, alternate: boolean): Promise<void>;

  /**
   * Sets a pilot entry altitude value on the descent speed limit performance data.
   * If no speed is previously defined, a default value is applied to it
   * @param value which altitude in feet to apply
   * @param planIndex which flightplan index to apply to speed limit
   * @param alternate whether to apply the speedlimit to the alternate flightplan performance data
   */
  setPilotEntryDescentSpeedLimitAltitude(value: number, planIndex: FlightPlanIndex, alternate: boolean): Promise<void>;

  /**
   * Deletes the descent speed limit from the performance data
   * @param planIndex which flightplan index to delete the climb speed limit from
   * @param alternate whether to delete the speed limit from the alternate performance data
   */
  deleteDescentSpeedLimit(planIndex: FlightPlanIndex, alternate: boolean): Promise<void>;

  // TODO do not pass in waypoint object (rpc)
  isWaypointInUse(waypoint: Waypoint): Promise<boolean>;

  setFlightNumber(flightNumber: string, planIndex: number): Promise<void>;

  // FIXME types
  setPerformanceData<T extends keyof P & string>(key: T, value: any, planIndex: number): Promise<void>;

  stringMissedApproach(onConstraintsDeleted?: (map: FlightPlanLeg) => void, planIndex?: number): Promise<void>;

  /**
   * Propagates the cruise wind entries forwards and backwards to the specified leg. The resulting array is sorted by
   * altitude in descending order.
   * @param atIndex the index of the leg ot propagate winds to
   * @param result the array to write the propagated winds to
   * @param planIndex which flight plan index to do the propagation on
   */
  propagateWindsAt(atIndex: number, result: PropagatedWindEntry[], planIndex: number): PropagatedWindEntry[];

  /**
   * Adds a cruise wind entry at the specified leg.
   * @param atIndex the index of the leg to add the entry at
   * @param entry the entry to add
   * @param planIndex which flight plan index to add the entry to
   */
  addCruiseWindEntry(atIndex: number, entry: WindEntry, planIndex: number): Promise<void>;

  /**
   * Deletes a cruise wind entry at the specified leg. The entry to delete is determined by the altitude rounded to the
   * nearest 100 feet.
   * Writes an error the console and does nothing if no entry with the specified altitude exists.
   * @param atIndex the index of the leg to delete the entry at
   * @param altitude the altitude of the entry to delete
   * @param planIndex which flight plan index to delete the entry from
   */
  deleteCruiseWindEntry(atIndex: number, altitude: number, planIndex: number): Promise<void>;

  /**
   * Edits an existing cruise wind entry at the specified leg. The entry to edit is determined by the altitude rounded to
   * the nearest 100 feet.
   * Writes an error the console and does nothing if no entry with the specified altitude exists.
   * @param atIndex the index of the leg to edit the entry at
   * @param altitude the altitude of the entry to edit
   * @param newEntry the new entry to set
   * @param planIndex which flight plan index to edit the entry in
   */
  editCruiseWindEntry(atIndex: number, altitude: number, newEntry: WindEntry, planIndex: number): Promise<void>;

  /**
   * Sets the climb wind entry at the specified altitude rounded to the nearest 100 feet.
   * If the provided entry is null, the entry is deleted.
   * @param altitude the altitude of the entry to set
   * @param entry the entry to set, or null to delete the entry
   * @param planIndex which flight plan index to set the entry in
   */
  setClimbWindEntry(altitude: number, entry: WindEntry | null, planIndex: number): Promise<void>;

  /**
   * Sets the descent wind entry at the specified altitude rounded to the nearest 100 feet.
   * If the provided entry is null, the entry is deleted.
   * @param altitude the altitude of the entry to set
   * @param entry the entry to set, or null to delete the entry
   * @param planIndex which flight plan index to set the entry in
   * @param shouldUpdateTwrWind whether to copy the wind to the perf approach page if the altitude is the destination altitude
   */
  setDescentWindEntry(
    altitude: number,
    entry: WindEntry | null,
    planIndex: number,
    shouldUpdateTwrWind: boolean,
  ): Promise<void>;

  /**
   * Deletes all climb wind entries
   * @param planIndex which flight plan index to delete the entries from
   */
  deleteClimbWindEntries(planIndex: number): Promise<void>;

  /**
   * Deletes all descent wind entries
   * @param planIndex which flight plan index to delete the entries from
   */
  deleteDescentWindEntries(planIndex: number): Promise<void>;

  /**
   * Sets the average wind vector to the alternate destination. If the provided vector is null, the entry is deleted.
   * @param entry the entry to set, or null to delete the entry
   * @param planIndex which flight plan index to set the entry in
   */
  setAlternateWind(entry: WindVector | null, planIndex: number): Promise<void>;

  /**
   * Inserts a wind uplink entry into the flight plan
   * @param planIndex which flight plan index to insert the wind uplink into
   */
  insertWindUplink(planIndex: number): Promise<void>;
}
