// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FpmConfig } from '@fmgc/flightplanning/new/FpmConfig';
import { NavigationDatabase } from '@fmgc/NavigationDatabase';
import { AltitudeDescriptor, Fix, Waypoint } from 'msfs-navdata';
import { Coordinates, Degrees } from 'msfs-geo';
import { HoldData } from '@fmgc/flightplanning/data/flightplan';
import { FlightPlanLegDefinition } from '@fmgc/flightplanning/new/legs/FlightPlanLegDefinition';
import { FixInfoEntry } from '@fmgc/flightplanning/new/plans/FixInfo';
import { FlightPlan } from '@fmgc/flightplanning/new/plans/FlightPlan';
import { FlightPlanIndex } from '@fmgc/flightplanning/new/FlightPlanManager';

export interface FlightPlanInterface {
    get(index: number): FlightPlan;

    has(index: number): boolean;

    get active(): FlightPlan;

    get temporary(): FlightPlan;

    get activeOrTemporary(): FlightPlan;

    get uplink(): FlightPlan;

    secondary(index: number): FlightPlan;

    get hasActive(): boolean;

    get hasTemporary(): boolean;

    hasSecondary(index: number): boolean;

    get hasUplink(): boolean;

    temporaryInsert(): Promise<void>;

    temporaryDelete(): Promise<void>;

    uplinkInsert(): Promise<void>;

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
     * @param runwayIdent the runway identifier (e.g., RW27C)
     * @param planIndex   which flight plan to make the change on
     * @param alternate   whether to edit the plan's alternate flight plan
     */
    setOriginRunway(runwayIdent: string, planIndex?: number, alternate?: boolean): Promise<void>;

    /**
     * Sets the departure procedure in the flight plan. Creates a temporary flight plan if target is active.
     *
     * @param procedureIdent the procedure identifier (e.g., BAVE6P)
     * @param planIndex      which flight plan to make the change on
     * @param alternate      whether to edit the plan's alternate flight plan
     */
    setDepartureProcedure(procedureIdent: string | undefined, planIndex?: number, alternate?: boolean): Promise<void>;

    /**
     * Sets the departure enroute transition procedure in the flight plan. Creates a temporary flight plan if target is active.
     *
     * @param transitionIdent the enroute transition identifier (e.g., KABIN)
     * @param planIndex       which flight plan to make the change on
     * @param alternate       whether to edit the plan's alternate flight plan
     */
    setDepartureEnrouteTransition(transitionIdent: string | undefined, planIndex?: number, alternate?: boolean): Promise<void>;

    /**
     * Sets the arrival enroute transition procedure in the flight plan. Creates a temporary flight plan if target is active.
     *
     * @param transitionIdent the enroute transition identifier (e.g., PLYMM)
     * @param planIndex       which flight plan to make the change on
     * @param alternate       whether to edit the plan's alternate flight plan
     */
    setArrivalEnrouteTransition(transitionIdent: string | undefined, planIndex?: number, alternate?: boolean): Promise<void>;

    /**
     * Sets the arrival procedure in the flight plan. Creates a temporary flight plan if target is active.
     *
     * @param procedureIdent the procedure identifier (e.g., BOXUM5)
     * @param planIndex      which flight plan to make the change on
     * @param alternate      whether to edit the plan's alternate flight plan
     */
    setArrival(procedureIdent: string | undefined, planIndex?: number, alternate?: boolean): Promise<void>;

    /**
     * Sets the approach via in the flight plan. Creates a temporary flight plan if target is active.
     *
     * @param procedureIdent the procedure identifier (e.g., DIREX)
     * @param planIndex      which flight plan to make the change on
     * @param alternate      whether to edit the plan's alternate flight plan
     */
    setApproachVia(procedureIdent: string | undefined, planIndex?: number, alternate?: boolean): Promise<void>;

    /**
     * Sets the approach procedure in the flight plan. Creates a temporary flight plan if target is active.
     *
     * @param procedureIdent the procedure identifier (e.g., R05-X)
     * @param planIndex      which flight plan to make the change on
     * @param alternate      whether to edit the plan's alternate flight plan
     */
    setApproach(procedureIdent: string | undefined, planIndex?: number, alternate?: boolean): Promise<void>;

    /**
     * Sets the origin runway in the flight plan. Creates a temporary flight plan if target is active.
     *
     * @param runwayIdent the runway identifier (e.g., RW27C)
     * @param planIndex   which flight plan to make the change on
     * @param alternate   whether to edit the plan's alternate flight plan
     */
    setDestinationRunway(runwayIdent: string, planIndex?: number, alternate?: boolean): Promise<void>;

    /**
     * Deletes an element (leg or discontinuity) at the specified index. Depending on the {@link FpmConfig} in use,
     * this can create a temporary flight plan if target is active.
     *
     * @param index the index of the element to delete
     * @param planIndex which flight plan to make the change on
     * @param alternate whether to edit the plan's alternate flight plan
     *
     * @returns `true` if the element could be removed, `false` if removal is not allowed
     */
    deleteElementAt(index: number, planIndex?: number, alternate?: boolean): Promise<boolean>;

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

    startAirwayEntry(at: number, planIndex: number): Promise<void>; // TODO alternate

    // TODO do not pass in fix object (rpc)
    directTo(ppos: Coordinates, trueTrack: Degrees, waypoint: Fix, withAbeam: boolean, planIndex: number): Promise<void>

    addOrEditManualHold(at: number, desiredHold: HoldData, modifiedHold: HoldData, defaultHold: HoldData, planIndex: number): Promise<number>; // TODO maybe alternate

    revertHoldToComputed(at: number, planIndex: number): Promise<void>; // TODO maybe alternate

    enableAltn(atIndexInAlternate: number, planIndex: number): Promise<void>;

    setAltitudeDescriptionAt(atIndex: number, altDesc: AltitudeDescriptor, isDescentConstraint: boolean, planIndex?: FlightPlanIndex, alternate?: boolean): Promise<void>;

    setAltitudeAt(atIndex: number, altitude: number, isDescentConstraint: boolean, planIndex?: FlightPlanIndex, alternate?: boolean): Promise<void>;

    setSpeedAt(atIndex: number, speed: number, isDescentConstraint: boolean, planIndex?: FlightPlanIndex, alternate?: boolean): Promise<void>;

    editLegDefinition(atIndex: number, changes: Partial<FlightPlanLegDefinition>, planIndex?: number, alternate?: boolean): Promise<void>;

    setFixInfoEntry(index: 1 | 2 | 3 | 4, fixInfo: FixInfoEntry | null, planIndex: number): Promise<void>;

    // TODO do not pass in callback (rpc)
    editFixInfoEntry(index: 1 | 2 | 3 | 4, callback: (fixInfo: FixInfoEntry) => FixInfoEntry, planIndex: number): Promise<void>;

    // TODO do not pass in waypoint object (rpc)
    isWaypointInUse(waypoint: Waypoint): Promise<boolean>;
}
