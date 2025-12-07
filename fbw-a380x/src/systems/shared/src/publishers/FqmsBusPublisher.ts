// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  EventBus,
  IndexedEventType,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

interface FqmsBusBaseEvents {
  /**
   * Discrete status word for the FQMS, raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | FMS Data unavailable              |
   * | 12  | FMS Data disagrees                |
   */
  fqms_status_word: number;
  /**
   * FQMS fuel on board in kilograms.
   * Raw ARINC word.
   */
  fqms_total_fuel_on_board: number;
  /**
   * FQMS gross weight in kilograms.
   * Raw ARINC word.
   */
  fqms_gross_weight: number;
  /**
   * FQMS center of gravity in percent.
   * Raw ARINC word.
   */
  fqms_center_of_gravity_mac: number;
  /**
   * Discrete status word for the left fuel pump status, raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | Main Feed Pump 1 running        |
   * | 12  | Standby Feed Pump 1 running     |
   * | 13  | Main Feed Pump 2 running        |
   * | 14  | Standby Feed Pump 2 running     |
   * | 15  | Left Outer Pump running         |
   * | 16  | Left Mid Fwd Pump running       |
   * | 17  | Left Mid Aft Pump running       |
   * | 18  | Left Inner Fwd Pump running     |
   * | 19  | Left Inner Aft Pump running     |
   * | 20  | Left Trim Pump running          |
   */
  fqms_fuel_pump_running_left: number;
  /**
   * Discrete status word for the right fuel pump status, raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | Main Feed Pump 3 running        |
   * | 12  | Standby Feed Pump 3 running     |
   * | 13  | Main Feed Pump 4 running        |
   * | 14  | Standby Feed Pump 4 running     |
   * | 15  | Right Outer Pump running         |
   * | 16  | Right Mid Fwd Pump running       |
   * | 17  | Right Mid Aft Pump running       |
   * | 18  | Right Inner Fwd Pump running     |
   * | 19  | Right Inner Aft Pump running     |
   * | 20  | Right Trim Pump running          |
   */
  fqms_fuel_pump_running_right: number;
}

type IndexedTopics = null;

type FqmsBusIndexedEvents = {
  [P in keyof Pick<FqmsBusBaseEvents, IndexedTopics> as IndexedEventType<P>]: FqmsBusBaseEvents[P];
};

interface FqmsBusPublisherEvents extends FqmsBusBaseEvents, FqmsBusIndexedEvents {}

/**
 * Events for FQMS bus local vars.
 */
export interface FqmsBusEvents extends Omit<FqmsBusBaseEvents, IndexedTopics>, FqmsBusIndexedEvents {}

/**
 * Publisher for FQMS bus local vars.
 */
export class FqmsBusPublisher extends SimVarPublisher<FqmsBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<FqmsBusPublisherEvents>) {
    const simvars = new Map<keyof FqmsBusPublisherEvents, SimVarPublisherEntry<any>>([
      ['fqms_status_word', { name: 'L:A32NX_FQMS_STATUS_WORD', type: SimVarValueType.Enum }],
      ['fqms_total_fuel_on_board', { name: 'L:A32NX_FQMS_TOTAL_FUEL_ON_BOARD', type: SimVarValueType.Enum }],
      ['fqms_gross_weight', { name: 'L:A32NX_FQMS_GROSS_WEIGHT', type: SimVarValueType.Enum }],
      ['fqms_center_of_gravity_mac', { name: 'L:A32NX_FQMS_CENTER_OF_GRAVITY_MAC', type: SimVarValueType.Enum }],
      ['fqms_fuel_pump_running_left', { name: 'L:A32NX_FQMS_LEFT_FUEL_PUMPS_RUNNING', type: SimVarValueType.Enum }],
      ['fqms_fuel_pump_running_right', { name: 'L:A32NX_FQMS_RIGHT_FUEL_PUMPS_RUNNING', type: SimVarValueType.Enum }],
    ]);

    super(simvars, bus, pacer);
  }
}
