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

interface A32NXEcpBusBaseEvents {
  /**
   * The ECP warning switch word containg button pressed state.
   * Transmitted to each FWC, DMC, TAWS, FDIMU, and ATSU.
   * Raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | CLR 1                             |
   * | 13  | STS                               |
   * | 14  | RCL                               |
   * | 16  | CLR 2                             |
   * | 17  | EMERGENCY CANCEL                  |
   * | 18  | TO CONFIG TEST                    |
   */
  a32nx_ecp_warning_switch_word: number;
  /**
   * The ECP system switch word containg button pressed state.
   * Transmitted to each FWC, DMC, TAWS, FDIMU, and ATSU.
   * Raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | ENG                               |
   * | 12  | BLEED                             |
   * | 13  | APU                               |
   * | 14  | HYD                               |
   * | 15  | ELEC                              |
   * | 17  | COND                              |
   * | 18  | PRESS                             |
   * | 19  | FUEL                              |
   * | 20  | FLT/CTL                           |
   * | 21  | DOOR                              |
   * | 22  | BRAKES                            |
   * | 23  | ALL                               |
   */
  a32nx_ecp_system_switch_word: number;
  /**
   * The ECP light status word containg button light state.
   * Transmitted to each FWC, DMC, TAWS, FDIMU, and ATSU.
   * Raw ARINC word.
   * | Bit |            Description            |
   * |:---:|:---------------------------------:|
   * | 11  | ENG                               |
   * | 12  | BLEED                             |
   * | 13  | APU                               |
   * | 14  | HYD                               |
   * | 15  | ELEC                              |
   * | 16  | STATUS                            |
   * | 17  | COND                              |
   * | 18  | PRESS                             |
   * | 19  | FUEL                              |
   * | 20  | FLT/CTL                           |
   * | 21  | DOOR                              |
   * | 22  | BRAKES                            |
   * | 23  | CLR 1                             |
   * | 24  | CLR 2                             |
   * | 26  | L. TEST                           |
   * | 27  | DIM                               |
   */
  a32nx_ecp_light_status_word: number;
  /** The hardwired discrete for STS button to each FWC. */
  a32nx_ecp_discrete_out_sts: boolean;
  /** The hardwired discrete for RCL button to each FWC. */
  a32nx_ecp_discrete_out_rcl: boolean;
  /** The hardwired discrete for CLR button to each FWC. */
  a32nx_ecp_discrete_out_clr: boolean;
  /** The hardwired discrete for emergency cancel/audio suppression to each FWC and the TAWS. */
  a32nx_ecp_discrete_out_emer_canc: boolean;
  /** The hardwired discrete for emergency cancel/audio suppression to each DMC. */
  a32nx_ecp_discrete_out_all: boolean;
}

type IndexedTopics = null;

type A32NXEcpBusIndexedEvents = {
  [P in keyof Pick<A32NXEcpBusBaseEvents, IndexedTopics> as IndexedEventType<P>]: A32NXEcpBusBaseEvents[P];
};

interface A32NXEcpBusPublisherEvents extends A32NXEcpBusBaseEvents, A32NXEcpBusIndexedEvents {}

/**
 * Events for A32NX ECP bus local vars.
 */
export interface A32NXEcpBusEvents extends Omit<A32NXEcpBusBaseEvents, IndexedTopics>, A32NXEcpBusIndexedEvents {}

/**
 * Publisher for A32NX ECP bus local vars.
 */
export class A32NXEcpBusPublisher extends SimVarPublisher<A32NXEcpBusPublisherEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<A32NXEcpBusPublisherEvents>) {
    const simvars = new Map<keyof A32NXEcpBusPublisherEvents, SimVarPublisherEntry<any>>([
      ['a32nx_ecp_warning_switch_word', { name: 'L:A32NX_ECP_WARNING_SWITCH_WORD', type: SimVarValueType.Enum }],
      ['a32nx_ecp_system_switch_word', { name: 'L:A32NX_ECP_SYSTEM_SWITCH_WORD', type: SimVarValueType.Enum }],
      ['a32nx_ecp_light_status_word', { name: 'L:A32NX_ECP_LIGHT_STATUS_WORD', type: SimVarValueType.Enum }],
      ['a32nx_ecp_discrete_out_sts', { name: 'L:A32NX_ECP_DISCRETE_OUT_STS', type: SimVarValueType.Bool }],
      ['a32nx_ecp_discrete_out_rcl', { name: 'L:A32NX_ECP_DISCRETE_OUT_RCL', type: SimVarValueType.Bool }],
      ['a32nx_ecp_discrete_out_clr', { name: 'L:A32NX_ECP_DISCRETE_OUT_CLR', type: SimVarValueType.Bool }],
      ['a32nx_ecp_discrete_out_emer_canc', { name: 'L:A32NX_ECP_DISCRETE_OUT_EMER_CANC', type: SimVarValueType.Bool }],
      ['a32nx_ecp_discrete_out_all', { name: 'L:A32NX_ECP_DISCRETE_OUT_ALL', type: SimVarValueType.Bool }],
    ]);

    super(simvars, bus, pacer);
  }
}
