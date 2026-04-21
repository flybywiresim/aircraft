// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  EventBus,
  IndexedEventType,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

interface A32NXElectricalSystemBaseEvents {
  /** Whether AC bus 1 is currently connected to a supply. */
  a32nx_elec_ac_1_bus_is_powered: boolean;
  /** Whether AC bus 2 is currently connected to a supply. */
  a32nx_elec_ac_2_bus_is_powered: boolean;
  /** Whether AC ESS bus is currently connected to a supply. */
  a32nx_elec_ac_ess_bus_is_powered: boolean;
  /** Whether sheddable AC ESS bus is currently connected to a supply. */
  a32nx_elec_ac_ess_shed_bus_is_powered: boolean;
  /** Whether AC static inverter bus is currently connected to a supply. */
  a32nx_elec_ac_stat_inv_bus_is_powered: boolean;
  /** Whether AC ground service bus is currently connected to a supply. */
  a32nx_elec_ac_gnd_flt_svc_is_powered: boolean;
  /** Whether DC bus 1 is currently connected to a supply. */
  a32nx_elec_dc_1_bus_is_powered: boolean;
  /** Whether DC bus 2 is currently connected to a supply. */
  a32nx_elec_dc_2_bus_is_powered: boolean;
  /** Whether DC ESS bus is currently connected to a supply. */
  a32nx_elec_dc_ess_bus_is_powered: boolean;
  /** Whether sheddable DC ESS bus is currently connected to a supply. */
  a32nx_elec_dc_ess_shed_bus_is_powered: boolean;
  /** Whether DC common battery bus is currently connected to a supply. */
  a32nx_elec_dc_batt_bus_is_powered: boolean;
  /** Whether DC battery 1 hot bus is currently connected to a supply. */
  a32nx_elec_dc_hot_1_bus_is_powered: boolean;
  /** Whether DC battery 2 hot bus is currently connected to a supply. */
  a32nx_elec_dc_hot_2_bus_is_powered: boolean;
  /** Whether DC ground service bus bus is currently connected to a supply. */
  a32nx_elec_dc_gnd_flt_svc_bus_is_powered: boolean;
}

type IndexedTopics = never;

type A32NXElectricalSystemIndexedEvents = {
  [P in keyof Pick<
    A32NXElectricalSystemBaseEvents,
    IndexedTopics
  > as IndexedEventType<P>]: A32NXElectricalSystemBaseEvents[P];
};

/**
 * Events for A32NX electrical system local vars.
 * Event names are the same as the local var names (including a32nx_elec_ prefix).
 */
export interface A32NXElectricalSystemEvents
  extends A32NXElectricalSystemBaseEvents,
    A32NXElectricalSystemIndexedEvents {}

/**
 * Publisher for A32NX electrical system local vars.
 */
export class A32NXElectricalSystemPublisher extends SimVarPublisher<A32NXElectricalSystemEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<A32NXElectricalSystemEvents>) {
    const simvars = new Map<keyof A32NXElectricalSystemEvents, SimVarPublisherEntry<any>>([
      ['a32nx_elec_ac_1_bus_is_powered', { name: 'L:A32NX_ELEC_AC_1_BUS_IS_POWERED', type: SimVarValueType.Bool }],
      ['a32nx_elec_ac_2_bus_is_powered', { name: 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED', type: SimVarValueType.Bool }],
      ['a32nx_elec_ac_ess_bus_is_powered', { name: 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED', type: SimVarValueType.Bool }],
      [
        'a32nx_elec_ac_ess_shed_bus_is_powered',
        { name: 'L:A32NX_ELEC_AC_ESS_SHED_BUS_IS_POWERED', type: SimVarValueType.Bool },
      ],
      [
        'a32nx_elec_ac_stat_inv_bus_is_powered',
        { name: 'L:A32NX_ELEC_AC_STAT_INV_BUS_IS_POWERED', type: SimVarValueType.Bool },
      ],
      [
        'a32nx_elec_ac_gnd_flt_svc_is_powered',
        { name: 'L:A32NX_ELEC_AC_GND_FLT_SVC_BUS_IS_POWERED', type: SimVarValueType.Bool },
      ],
      ['a32nx_elec_dc_1_bus_is_powered', { name: 'L:A32NX_ELEC_DC_1_BUS_IS_POWERED', type: SimVarValueType.Bool }],
      ['a32nx_elec_dc_2_bus_is_powered', { name: 'L:A32NX_ELEC_DC_2_BUS_IS_POWERED', type: SimVarValueType.Bool }],
      ['a32nx_elec_dc_ess_bus_is_powered', { name: 'L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED', type: SimVarValueType.Bool }],
      [
        'a32nx_elec_dc_ess_shed_bus_is_powered',
        { name: 'L:A32NX_ELEC_DC_ESS_SHED_BUS_IS_POWERED', type: SimVarValueType.Bool },
      ],
      [
        'a32nx_elec_dc_batt_bus_is_powered',
        { name: 'L:A32NX_ELEC_DC_BATT_BUS_IS_POWERED', type: SimVarValueType.Bool },
      ],
      [
        'a32nx_elec_dc_hot_1_bus_is_powered',
        { name: 'L:A32NX_ELEC_DC_HOT_1_BUS_IS_POWERED', type: SimVarValueType.Bool },
      ],
      [
        'a32nx_elec_dc_hot_2_bus_is_powered',
        { name: 'L:A32NX_ELEC_DC_HOT_2_BUS_IS_POWERED', type: SimVarValueType.Bool },
      ],
      [
        'a32nx_elec_dc_gnd_flt_svc_bus_is_powered',
        { name: 'L:A32NX_ELEC_DC_GND_FLT_SVC_BUS_IS_POWERED', type: SimVarValueType.Bool },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
