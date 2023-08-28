// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanInterface } from '@fmgc/flightplanning/new/FlightPlanInterface';
import { AltitudeDescriptor, Waypoint } from 'msfs-navdata';
import { FlightPlanIndex, FlightPlanManager } from '@fmgc/flightplanning/new/FlightPlanManager';
import { EventBus } from '@microsoft/msfs-sdk';
import { v4 } from 'uuid';
import { HoldData } from '@fmgc/flightplanning/data/flightplan';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Fix } from '../segments/enroute/WaypointLoading';
import { FlightPlanLegDefinition } from '../legs/FlightPlanLegDefinition';
import { FixInfoEntry } from '../plans/FixInfo';
import { FlightPlan } from '../plans/FlightPlan';

export type FunctionsOnlyAndUnwrapPromises<T> =
    { [k in keyof T as T[k] extends (...args: any) => Promise<any> ? k : never]: T[k] extends (...args: infer U) => Promise<infer V> ? (...args: U) => V : never }

type PromiseFn = (result: any) => void

export interface FlightPlanRemoteClientRpcEvents {
    'flightPlanRemoteClient_rpcCommand': [keyof FlightPlanInterface, string, ...any],
}

export class FlightPlanRpcClient implements FlightPlanInterface {
    constructor(private readonly bus: EventBus) {
    }

    private readonly flightPlanManager = new FlightPlanManager(this.bus, Math.round(Math.random() * 10_000), false);

    private readonly pub = this.bus.getPublisher<FlightPlanRemoteClientRpcEvents>();

    private rpcCommandsSent = new Map<string, [PromiseFn, PromiseFn]>();

    private async callFunctionViaRpc<T extends keyof FunctionsOnlyAndUnwrapPromises<FlightPlanInterface> & string>(
        funcName: T, ...args: Parameters<FunctionsOnlyAndUnwrapPromises<FlightPlanInterface>[T]>
    ): Promise<ReturnType<FunctionsOnlyAndUnwrapPromises<FlightPlanInterface>[T]>> {
        const id = v4();

        this.pub.pub('flightPlanRemoteClient_rpcCommand', [funcName, id, ...args]);

        const result = await this.waitForRpcCommandResponse<ReturnType<FunctionsOnlyAndUnwrapPromises<FlightPlanInterface>[T]>>(id);

        return result;
    }

    private waitForRpcCommandResponse<T>(id: string): Promise<T> {
        return new Promise((resolve, reject) => {
            this.rpcCommandsSent.set(id, [resolve, reject]);
        });
    }

    get(index: number): FlightPlan {
        return this.flightPlanManager.get(index);
    }

    has(index: number): boolean {
        return this.flightPlanManager.has(index);
    }

    get active(): FlightPlan {
        return this.flightPlanManager.get(FlightPlanIndex.Active);
    }

    get temporary(): FlightPlan {
        return this.flightPlanManager.get(FlightPlanIndex.Temporary);
    }

    get activeOrTemporary(): FlightPlan {
        return this.hasTemporary ? this.temporary : this.active;
    }

    get uplink(): FlightPlan {
        return this.flightPlanManager.get(FlightPlanIndex.Uplink);
    }

    secondary(index: number): FlightPlan {
        return this.flightPlanManager.get(FlightPlanIndex.FirstSecondary + index);
    }

    get hasActive(): boolean {
        return this.has(FlightPlanIndex.Active);
    }

    hasSecondary(index: number): boolean {
        return this.has(FlightPlanIndex.FirstSecondary + index);
    }

    get hasTemporary(): boolean {
        return this.has(FlightPlanIndex.Temporary);
    }

    get hasUplink(): boolean {
        return this.has(FlightPlanIndex.Uplink);
    }

    temporaryInsert(): Promise<void> {
        return this.callFunctionViaRpc('temporaryInsert');
    }

    temporaryDelete(): Promise<void> {
        return this.callFunctionViaRpc('temporaryDelete');
    }

    uplinkInsert(): Promise<void> {
        return this.callFunctionViaRpc('uplinkInsert');
    }

    reset(): Promise<void> {
        return this.callFunctionViaRpc('reset');
    }

    newCityPair(fromIcao: string, toIcao: string, altnIcao?: string, planIndex?: number): Promise<void> {
        return this.callFunctionViaRpc('newCityPair', fromIcao, toIcao, altnIcao, planIndex);
    }

    setAlternate(altnIcao: string, planIndex: number): Promise<void> {
        return this.callFunctionViaRpc('setAlternate', altnIcao, planIndex);
    }

    setOriginRunway(runwayIdent: string, planIndex?: number, alternate?: boolean): Promise<void> {
        return this.callFunctionViaRpc('setOriginRunway', runwayIdent, planIndex, alternate);
    }

    setDepartureProcedure(procedureIdent: string | undefined, planIndex?: number, alternate?: boolean): Promise<void> {
        return this.callFunctionViaRpc('setDepartureProcedure', procedureIdent, planIndex, alternate);
    }

    setDepartureEnrouteTransition(transitionIdent: string | undefined, planIndex?: number, alternate?: boolean): Promise<void> {
        return this.callFunctionViaRpc('setDepartureEnrouteTransition', transitionIdent, planIndex, alternate);
    }

    setArrivalEnrouteTransition(transitionIdent: string | undefined, planIndex?: number, alternate?: boolean): Promise<void> {
        return this.callFunctionViaRpc('setArrivalEnrouteTransition', transitionIdent, planIndex, alternate);
    }

    setArrival(procedureIdent: string | undefined, planIndex?: number, alternate?: boolean): Promise<void> {
        return this.callFunctionViaRpc('setArrival', procedureIdent, planIndex, alternate);
    }

    setApproachVia(procedureIdent: string | undefined, planIndex?: number, alternate?: boolean): Promise<void> {
        return this.callFunctionViaRpc('setApproachVia', procedureIdent, planIndex, alternate);
    }

    setApproach(procedureIdent: string | undefined, planIndex?: number, alternate?: boolean): Promise<void> {
        return this.callFunctionViaRpc('setApproach', procedureIdent, planIndex, alternate);
    }

    setDestinationRunway(runwayIdent: string, planIndex?: number, alternate?: boolean): Promise<void> {
        return this.callFunctionViaRpc('setDestinationRunway', runwayIdent, planIndex, alternate);
    }

    deleteElementAt(index: number, planIndex?: number, alternate?: boolean): Promise<boolean> {
        return this.callFunctionViaRpc('deleteElementAt', index, planIndex, alternate);
    }

    insertWaypointBefore(atIndex: number, waypoint: Fix, planIndex?: number, alternate?: boolean): Promise<void> {
        return this.callFunctionViaRpc('insertWaypointBefore', atIndex, waypoint, planIndex, alternate);
    }

    nextWaypoint(atIndex: number, waypoint: Fix, planIndex?: number, alternate?: boolean): Promise<void> {
        return this.callFunctionViaRpc('nextWaypoint', atIndex, waypoint, planIndex, alternate);
    }

    newDest(atIndex: number, airportIdent: string, planIndex?: number, alternate?: boolean): Promise<void> {
        return this.callFunctionViaRpc('newDest', atIndex, airportIdent, planIndex, alternate);
    }

    startAirwayEntry(at: number, planIndex: number, alternate: boolean): Promise<void> {
        return this.callFunctionViaRpc('startAirwayEntry', at, planIndex, alternate);
    }

    directTo(ppos: Coordinates, trueTrack: Degrees, waypoint: Fix, withAbeam: boolean, planIndex: number): Promise<void> {
        return this.callFunctionViaRpc('directTo', ppos, trueTrack, waypoint, withAbeam, planIndex);
    }

    addOrEditManualHold(at: number, desiredHold: HoldData, modifiedHold: HoldData, defaultHold: HoldData, planIndex: number, alternate: boolean): Promise<number> {
        return this.callFunctionViaRpc('addOrEditManualHold', at, desiredHold, modifiedHold, desiredHold, planIndex, alternate);
    }

    revertHoldToComputed(at: number, planIndex: number, alternate: boolean): Promise<void> {
        return this.callFunctionViaRpc('revertHoldToComputed', at, planIndex, alternate);
    }

    enableAltn(atIndexInAlternate: number, planIndex: number): Promise<void> {
        return this.callFunctionViaRpc('enableAltn', atIndexInAlternate, planIndex);
    }

    setAltitudeDescriptionAt(atIndex: number, altDesc: AltitudeDescriptor, isDescentConstraint: boolean, planIndex?: FlightPlanIndex, alternate?: boolean): Promise<void> {
        return this.callFunctionViaRpc('setAltitudeDescriptionAt', atIndex, altDesc, isDescentConstraint, planIndex, alternate);
    }

    setAltitudeAt(atIndex: number, altitude: number, isDescentConstraint: boolean, planIndex?: FlightPlanIndex, alternate?: boolean): Promise<void> {
        return this.callFunctionViaRpc('setAltitudeAt', atIndex, altitude, isDescentConstraint, planIndex, alternate);
    }

    setSpeedAt(atIndex: number, speed: number, isDescentConstraint: boolean, planIndex?: FlightPlanIndex, alternate?: boolean): Promise<void> {
        return this.callFunctionViaRpc('setSpeedAt', atIndex, speed, isDescentConstraint, planIndex, alternate);
    }

    addOrUpdateCruiseStep(atIndex: number, toAltitude: number, planIndex?: FlightPlanIndex): Promise<void> {
        return this.callFunctionViaRpc('addOrUpdateCruiseStep', atIndex, toAltitude, planIndex);
    }

    removeCruiseStep(atIndex: number, planIndex?: FlightPlanIndex): Promise<void> {
        return this.callFunctionViaRpc('removeCruiseStep', atIndex, planIndex);
    }

    editLegDefinition(atIndex: number, changes: Partial<FlightPlanLegDefinition>, planIndex?: number, alternate?: boolean): Promise<void> {
        return this.callFunctionViaRpc('editLegDefinition', atIndex, changes, planIndex, alternate);
    }

    setFixInfoEntry(index: 1 | 2 | 3 | 4, fixInfo: FixInfoEntry | null, planIndex: number): Promise<void> {
        return this.callFunctionViaRpc('setFixInfoEntry', index, fixInfo, planIndex);
    }

    editFixInfoEntry(index: 1 | 2 | 3 | 4, callback: (fixInfo: FixInfoEntry) => FixInfoEntry, planIndex: number): Promise<void> {
        return this.callFunctionViaRpc('editFixInfoEntry', index, callback, planIndex);
    }

    isWaypointInUse(waypoint: Waypoint): Promise<boolean> {
        return this.callFunctionViaRpc('isWaypointInUse', waypoint);
    }
}
