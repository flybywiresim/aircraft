// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanInterface } from '@fmgc/flightplanning/FlightPlanInterface';
import { Fix, Waypoint } from '@flybywiresim/fbw-sdk';
import { FlightPlanIndex, FlightPlanManager } from '@fmgc/flightplanning/FlightPlanManager';
import { EventBus, EventSubscriber, Publisher, Subscription } from '@microsoft/msfs-sdk';
import { v4 } from 'uuid';
import { HoldData, OffsetData } from '@fmgc/flightplanning/data/flightplan';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { AltitudeConstraint } from '@fmgc/flightplanning/data/constraint';
import { FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';
import { FlightPlanServerRpcEvents } from '@fmgc/flightplanning/rpc/FlightPlanRpcServer';
import { FlightPlanLegDefinition } from '../legs/FlightPlanLegDefinition';
import { FixInfoEntry } from '../plans/FixInfo';
import { FlightPlan } from '../plans/FlightPlan';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';

export type FunctionsOnlyAndUnwrapPromises<T> = {
  [k in keyof T as T[k] extends (...args: any) => Promise<any> ? k : never]: T[k] extends (
    ...args: infer U
  ) => Promise<infer V>
    ? (...args: U) => V
    : never;
};

type PromiseFn = (result: any) => void;

export interface FlightPlanRemoteClientRpcEvents<P extends FlightPlanPerformanceData> {
  flightPlanRemoteClient_rpcCommand: [keyof FlightPlanInterface<P>, string, ...any];
}

export class FlightPlanRpcClient<P extends FlightPlanPerformanceData> implements FlightPlanInterface<P> {
  private subs: Subscription[] = [];

  private readonly flightPlanManager: FlightPlanManager<P>;

  private readonly pub: Publisher<FlightPlanRemoteClientRpcEvents<P>>;

  private readonly sub: EventSubscriber<FlightPlanServerRpcEvents>;

  constructor(
    private readonly bus: EventBus,
    private readonly performanceDataInit: P,
  ) {
    this.pub = this.bus.getPublisher<FlightPlanRemoteClientRpcEvents<P>>();
    this.sub = this.bus.getSubscriber<FlightPlanServerRpcEvents>();

    this.subs.push(
      this.sub.on('flightPlanServer_rpcCommandResponse').handle(([responseId, response]) => {
        if (this.rpcCommandsSent.has(responseId)) {
          const [resolve] = this.rpcCommandsSent.get(responseId) ?? [];

          if (resolve) {
            resolve(response);
            this.rpcCommandsSent.delete(responseId);
          }
        }
      }),
    );
    this.flightPlanManager = new FlightPlanManager<P>(
      this.bus,
      this
        .performanceDataInit as P /*  TODO, is this comment still valid? "This flight plan manager will never create plans, so this is fine" */,
      Math.round(Math.random() * 10_000),
      false,
    );
  }

  private rpcCommandsSent = new Map<string, [PromiseFn, PromiseFn]>();

  private async callFunctionViaRpc<T extends keyof FunctionsOnlyAndUnwrapPromises<FlightPlanInterface<P>> & string>(
    funcName: T,
    ...args: Parameters<FunctionsOnlyAndUnwrapPromises<FlightPlanInterface<P>>[T]>
  ): Promise<ReturnType<FunctionsOnlyAndUnwrapPromises<FlightPlanInterface<P>>[T]>> {
    const id = v4();

    this.pub.pub('flightPlanRemoteClient_rpcCommand', [funcName, id, ...args], true);

    const result =
      await this.waitForRpcCommandResponse<ReturnType<FunctionsOnlyAndUnwrapPromises<FlightPlanInterface<P>>[T]>>(id);

    return result;
  }

  private waitForRpcCommandResponse<T>(id: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.rpcCommandsSent.set(id, [resolve, reject]);
      setTimeout(() => {
        if (this.rpcCommandsSent.has(id)) {
          this.rpcCommandsSent.delete(id);
          reject(new Error(`Timeout waiting for response from server for request ${id}`));
        }
      }, 5000);
    });
  }

  public destroy() {
    this.flightPlanManager.destroy();
    this.subs.forEach((sub) => sub.destroy());
  }

  get(index: number): FlightPlan<P> {
    return this.flightPlanManager.get(index);
  }

  has(index: number): boolean {
    return this.flightPlanManager.has(index);
  }

  get active(): FlightPlan<P> {
    return this.flightPlanManager.get(FlightPlanIndex.Active);
  }

  get temporary(): FlightPlan<P> {
    return this.flightPlanManager.get(FlightPlanIndex.Temporary);
  }

  get activeOrTemporary(): FlightPlan<P> {
    return this.hasTemporary ? this.temporary : this.active;
  }

  get uplink(): FlightPlan<P> {
    return this.flightPlanManager.get(FlightPlanIndex.Uplink);
  }

  secondary(index: number): FlightPlan<P> {
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

  secondaryDelete(index: number): Promise<void> {
    return this.callFunctionViaRpc('secondaryDelete', index);
  }

  secondaryReset(index: number): Promise<void> {
    return this.callFunctionViaRpc('secondaryReset', index);
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

  uplinkDelete(): Promise<void> {
    return this.callFunctionViaRpc('uplinkDelete');
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

  setDepartureProcedure(databaseId: string | undefined, planIndex?: number, alternate?: boolean): Promise<void> {
    return this.callFunctionViaRpc('setDepartureProcedure', databaseId, planIndex, alternate);
  }

  setDepartureEnrouteTransition(
    transitionIdent: string | undefined,
    planIndex?: number,
    alternate?: boolean,
  ): Promise<void> {
    return this.callFunctionViaRpc('setDepartureEnrouteTransition', transitionIdent, planIndex, alternate);
  }

  setArrivalEnrouteTransition(databaseId: string | undefined, planIndex?: number, alternate?: boolean): Promise<void> {
    return this.callFunctionViaRpc('setArrivalEnrouteTransition', databaseId, planIndex, alternate);
  }

  setArrival(databaseId: string | undefined, planIndex?: number, alternate?: boolean): Promise<void> {
    return this.callFunctionViaRpc('setArrival', databaseId, planIndex, alternate);
  }

  setApproachVia(databaseId: string | undefined, planIndex?: number, alternate?: boolean): Promise<void> {
    return this.callFunctionViaRpc('setApproachVia', databaseId, planIndex, alternate);
  }

  setApproach(databaseId: string | undefined, planIndex?: number, alternate?: boolean): Promise<void> {
    return this.callFunctionViaRpc('setApproach', databaseId, planIndex, alternate);
  }

  setDestinationRunway(databaseId: string, planIndex?: number, alternate?: boolean): Promise<void> {
    return this.callFunctionViaRpc('setDestinationRunway', databaseId, planIndex, alternate);
  }

  deleteElementAt(
    index: number,
    insertDiscontinuity?: boolean,
    planIndex?: number,
    alternate?: boolean,
  ): Promise<boolean> {
    return this.callFunctionViaRpc('deleteElementAt', index, insertDiscontinuity, planIndex, alternate);
  }

  insertWaypointBefore(atIndex: number, waypoint: Fix, planIndex?: number, alternate?: boolean): Promise<void> {
    return this.callFunctionViaRpc('insertWaypointBefore', atIndex, waypoint, planIndex, alternate);
  }

  insertDiscontinuityAfter(atIndex: number, planIndex?: number, alternate?: boolean): Promise<void> {
    return this.callFunctionViaRpc('insertDiscontinuityAfter', atIndex, planIndex, alternate);
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

  directToLeg(
    ppos: Coordinates,
    trueTrack: Degrees,
    targetLegIndex: number,
    withAbeam: boolean,
    planIndex: number,
  ): Promise<void> {
    return this.callFunctionViaRpc('directToLeg', ppos, trueTrack, targetLegIndex, withAbeam, planIndex);
  }

  directToWaypoint(
    ppos: Coordinates,
    trueTrack: Degrees,
    waypoint: Fix,
    withAbeam: boolean,
    planIndex: number,
  ): Promise<void> {
    return this.callFunctionViaRpc('directToWaypoint', ppos, trueTrack, waypoint, withAbeam, planIndex);
  }

  addOrEditManualHold(
    at: number,
    desiredHold: HoldData,
    modifiedHold: HoldData,
    defaultHold: HoldData,
    planIndex: number,
    alternate: boolean,
  ): Promise<number> {
    return this.callFunctionViaRpc(
      'addOrEditManualHold',
      at,
      desiredHold,
      modifiedHold,
      desiredHold,
      planIndex,
      alternate,
    );
  }

  revertHoldToComputed(at: number, planIndex: number, alternate: boolean): Promise<void> {
    return this.callFunctionViaRpc('revertHoldToComputed', at, planIndex, alternate);
  }

  enableAltn(atIndexInAlternate: number, cruiseLevel: number, planIndex: number): Promise<void> {
    return this.callFunctionViaRpc('enableAltn', atIndexInAlternate, cruiseLevel, planIndex);
  }

  setOffsetParams(
    startIndex: number,
    endIndex: number,
    desiredOffset: OffsetData,
    planIndex: FlightPlanIndex,
    alternate?: boolean,
  ): Promise<void> {
    return this.callFunctionViaRpc('setOffsetParams', startIndex, endIndex, desiredOffset, planIndex, alternate);
  }

  setPilotEnteredAltitudeConstraintAt(
    atIndex: number,
    isDescentConstraint: boolean,
    constraint?: AltitudeConstraint,
    planIndex?: FlightPlanIndex,
    alternate?: boolean,
  ): Promise<void> {
    return this.callFunctionViaRpc(
      'setPilotEnteredAltitudeConstraintAt',
      atIndex,
      isDescentConstraint,
      constraint,
      planIndex,
      alternate,
    );
  }

  setPilotEnteredSpeedConstraintAt(
    atIndex: number,
    isDescentConstraint: boolean,
    speed?: number,
    planIndex?: FlightPlanIndex,
    alternate?: boolean,
  ): Promise<void> {
    return this.callFunctionViaRpc(
      'setPilotEnteredSpeedConstraintAt',
      atIndex,
      isDescentConstraint,
      speed,
      planIndex,
      alternate,
    );
  }

  addOrUpdateCruiseStep(atIndex: number, toAltitude: number, planIndex?: FlightPlanIndex): Promise<void> {
    return this.callFunctionViaRpc('addOrUpdateCruiseStep', atIndex, toAltitude, planIndex);
  }

  removeCruiseStep(atIndex: number, planIndex?: FlightPlanIndex): Promise<void> {
    return this.callFunctionViaRpc('removeCruiseStep', atIndex, planIndex);
  }

  editLegDefinition(
    atIndex: number,
    changes: Partial<FlightPlanLegDefinition>,
    planIndex?: number,
    alternate?: boolean,
  ): Promise<void> {
    return this.callFunctionViaRpc('editLegDefinition', atIndex, changes, planIndex, alternate);
  }

  setFixInfoEntry(index: 1 | 2 | 3 | 4, fixInfo: FixInfoEntry | null, planIndex: number): Promise<void> {
    return this.callFunctionViaRpc('setFixInfoEntry', index, fixInfo, planIndex);
  }

  editFixInfoEntry(
    index: 1 | 2 | 3 | 4,
    callback: (fixInfo: FixInfoEntry) => FixInfoEntry,
    planIndex: number,
  ): Promise<void> {
    return this.callFunctionViaRpc('editFixInfoEntry', index, callback, planIndex);
  }

  isWaypointInUse(waypoint: Waypoint): Promise<boolean> {
    return this.callFunctionViaRpc('isWaypointInUse', waypoint);
  }

  setFlightNumber(flightNumber: string, planIndex: number): Promise<void> {
    return this.callFunctionViaRpc('setFlightNumber', flightNumber, planIndex);
  }

  setPerformanceData<k extends keyof P & string>(key: k, value: P[k], planIndex: number): Promise<void> {
    return this.callFunctionViaRpc('setPerformanceData', key, value, planIndex);
  }

  stringMissedApproach(onConstraintsDeleted?: (_: FlightPlanLeg) => void, planIndex?: number): Promise<void> {
    return this.callFunctionViaRpc('stringMissedApproach', onConstraintsDeleted, planIndex);
  }
}
