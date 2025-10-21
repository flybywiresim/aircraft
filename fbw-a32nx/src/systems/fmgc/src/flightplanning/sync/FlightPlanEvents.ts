// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanLegDefinition } from '@fmgc/flightplanning/legs/FlightPlanLegDefinition';
import { FixInfoData } from '@fmgc/flightplanning/plans/FixInfo';
import { SerializedFlightPlan } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { CruiseStepEntry } from '@fmgc/flightplanning/CruiseStep';
import { FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';
import { SerializedFlightPlanSegment } from '@fmgc/flightplanning/segments/FlightPlanSegment';
import { FlightPlanBatch } from '@fmgc/flightplanning/plans/FlightPlanBatch';
import { PendingAirwayEntry } from '@fmgc/flightplanning/plans/ReadonlyPendingAirways';

export interface FlightPlanSyncEvent {
  syncClientID: number;
}

export interface FlightPlanSyncResponsePacket extends FlightPlanSyncEvent {
  plans: Record<number, SerializedFlightPlan>;
}

export interface FlightPlanSpecificSyncEvent extends FlightPlanSyncEvent {
  planIndex: number;
}

export interface FlightPlanManagerEvent extends FlightPlanSpecificSyncEvent {
  targetPlanIndex?: number;
}

export interface FlightPlanCopyEvent extends FlightPlanManagerEvent {
  options: number;
}

export interface FlightPlanEditSyncEvent extends FlightPlanSpecificSyncEvent {
  batchStack: readonly FlightPlanBatch[];
  forAlternate: boolean;
}

export interface FlightPlanBatchChangeEvent extends FlightPlanSyncEvent {
  type: 'open' | 'close';
  batch: FlightPlanBatch;
  batchStack: readonly FlightPlanBatch[];
}

export interface FlightPlanSetActiveLegIndexEvent extends FlightPlanEditSyncEvent {
  activeLegIndex: number;
}

export interface FlightPlanSetSegmentEvent extends FlightPlanEditSyncEvent {
  segmentIndex: number;
  serialized: SerializedFlightPlanSegment;
}

export interface FlightPlanLegFlagsEditEvent extends FlightPlanEditSyncEvent {
  atIndex: number;
  newFlags: number;
}

export interface FlightPlanLegDefinitionEditEvent extends FlightPlanEditSyncEvent {
  atIndex: number;
  newDefinition: FlightPlanLegDefinition;
}

export interface FlightPlanLegCruiseStepEditEvent extends FlightPlanEditSyncEvent {
  atIndex: number;
  cruiseStep: CruiseStepEntry | undefined;
}

export interface FlightPlanSetFixInfoEntryEvent extends FlightPlanEditSyncEvent {
  index: 1 | 2 | 3 | 4;
  fixInfo: FixInfoData | null;
}

export interface PerformanceDataSetEvent<T> extends FlightPlanEditSyncEvent {
  value: T;
}

export interface FlightPlanFlightNumberEditEvent extends FlightPlanEditSyncEvent {
  flightNumber: string;
}

export interface FlightPlanPendingAirwaysEditEvent extends FlightPlanEditSyncEvent {
  type: 'edit' | 'create' | 'delete';
  elements: PendingAirwayEntry[];
}

export type PerformanceDataFlightPlanSyncEvents<P extends FlightPlanPerformanceData> = {
  [k in keyof Omit<P, 'clone'> as `flightPlan.setPerformanceData.${k & string}`]: PerformanceDataSetEvent<P[k]>;
};

/**
 * Flight plan change events. Those are for local use only, and are not synced across instruments.
 */
export interface FlightPlanEvents {
  'flightPlanManager.syncRequest': undefined;
  'flightPlanManager.syncResponse': FlightPlanSyncResponsePacket;

  'flightPlanManager.create': FlightPlanManagerEvent;
  'flightPlanManager.delete': FlightPlanManagerEvent;
  'flightPlanManager.deleteAll': undefined;
  'flightPlanManager.copy': FlightPlanCopyEvent;
  'flightPlanManager.swap': FlightPlanManagerEvent;

  'flightPlanService.batchChange': FlightPlanBatchChangeEvent;

  'flightPlan.setActiveLegIndex': FlightPlanSetActiveLegIndexEvent;
  'flightPlan.setSegment': FlightPlanSetSegmentEvent;
  'flightPlan.legFlagsEdit': FlightPlanLegFlagsEditEvent;
  'flightPlan.legDefinitionEdit': FlightPlanLegDefinitionEditEvent;
  'flightPlan.setLegCruiseStep': FlightPlanLegCruiseStepEditEvent;
  'flightPlan.setFixInfoEntry': FlightPlanSetFixInfoEntryEvent;
  'flightPlan.setFlightNumber': FlightPlanFlightNumberEditEvent;
  'flightPlan.pendingAirwaysEdit': FlightPlanPendingAirwaysEditEvent;
}

/**
 * Flight plan change sync events. Those are for cross-instrument use only
 */
export type SyncFlightPlanEvents = {
  [k in keyof FlightPlanEvents & string as `SYNC_${k}`]: FlightPlanEvents[k];
};
