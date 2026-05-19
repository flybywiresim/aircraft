// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  EventBus,
  SimVarValueType,
  SimVarPublisher,
  PublishPacer,
  SimVarPublisherEntry,
  IndexedEventType,
} from '@microsoft/msfs-sdk';

type A380XElectricalSystemBaseEvents = {
  /** whether the AC bus 1 is powered */
  ac_bus_1_powered: boolean;
  /** whether the AC bus 2 is powered */
  ac_bus_2_powered: boolean;
  /** whether the AC bus 3 is powered */
  ac_bus_3_powered: boolean;
  /** whether the AC bus 4 is powered */
  ac_bus_4_powered: boolean;
  /** whether the AC essential bus is powered */
  ac_ess_bus_powered: boolean;
  /** whether the AC essential scheduled bus is powered */
  ac_ess_sched_bus_powered: boolean;
  /** whether the AC 247XP bus is powered */
  ac_247xp_bus_powered: boolean;
  /** whether the AC ground/flight service bus is powered */
  ac_gnd_flt_svc_bus_powered: boolean;
  /** whether the DC bus 1 is powered */
  dc_bus_1_powered: boolean;
  /** whether the DC bus 2 is powered */
  dc_bus_2_powered: boolean;
  /** whether the DC essential bus is powered */
  dc_ess_bus_powered: boolean;
  /** whether the DC 247PP (EHA) bus is powered */
  dc_247pp_bus_powered: boolean;
  /** whether the DC hot bus 1 is powered */
  dc_hot_1_bus_powered: boolean;
  /** whether the DC hot bus 2 is powered */
  dc_hot_2_bus_powered: boolean;
  /** whether the DC hot bus 3 is powered */
  dc_hot_3_bus_powered: boolean;
  /** whether the DC hot bus 4 is powered */
  dc_hot_4_bus_powered: boolean;
  /** whether the DC ground/flight service bus is powered */
  dc_gnd_flt_svc_bus_powered: boolean;
  /** whether the DC 108PH bus is powered */
  dc_bus_108ph_powered: boolean;
  /** whether the DC 309PP bus is powered */
  dc_bus_309pp_powered: boolean;
};

type IndexedTopics = never;

type A380XElectricalSystemIndexedEvents = {
  [P in keyof Pick<
    A380XElectricalSystemBaseEvents,
    IndexedTopics
  > as IndexedEventType<P>]: A380XElectricalSystemBaseEvents[P];
};

export interface A380XElectricalSystemEvents
  extends A380XElectricalSystemBaseEvents,
    A380XElectricalSystemIndexedEvents {}

/**
 * Publisher for A380X electrical system local vars.
 */
export class A380XElectricalSystemPublisher extends SimVarPublisher<A380XElectricalSystemEvents> {
  public constructor(bus: EventBus, pacer?: PublishPacer<A380XElectricalSystemEvents>) {
    const simvars = new Map<keyof A380XElectricalSystemEvents, SimVarPublisherEntry<any>>([
      [
        'ac_bus_1_powered',
        {
          name: 'A32NX_ELEC_AC_1_BUS_IS_POWERED',
          type: SimVarValueType.Bool,
        },
      ],
      [
        'ac_bus_2_powered',
        {
          name: 'A32NX_ELEC_AC_2_BUS_IS_POWERED',
          type: SimVarValueType.Bool,
        },
      ],
      [
        'ac_bus_3_powered',
        {
          name: 'A32NX_ELEC_AC_3_BUS_IS_POWERED',
          type: SimVarValueType.Bool,
        },
      ],
      [
        'ac_bus_4_powered',
        {
          name: 'A32NX_ELEC_AC_4_BUS_IS_POWERED',
          type: SimVarValueType.Bool,
        },
      ],
      ['ac_ess_bus_powered', { name: 'A32NX_ELEC_AC_ESS_BUS_IS_POWERED', type: SimVarValueType.Bool }],
      [
        'ac_ess_sched_bus_powered',
        {
          name: 'A32NX_ELEC_AC_ESS_SCHED_BUS_IS_POWERED',
          type: SimVarValueType.Bool,
        },
      ],
      [
        'ac_247xp_bus_powered',
        {
          name: 'A32NX_ELEC_247XP_BUS_IS_POWERED',
          type: SimVarValueType.Bool,
        },
      ],
      [
        'ac_gnd_flt_svc_bus_powered',
        {
          name: 'A32NX_ELEC_AC_GND_FLT_SVC_BUS_IS_POWERED',
          type: SimVarValueType.Bool,
        },
      ],
      [
        'dc_bus_1_powered',
        {
          name: 'A32NX_ELEC_DC_1_BUS_IS_POWERED',
          type: SimVarValueType.Bool,
        },
      ],
      [
        'dc_bus_2_powered',
        {
          name: 'A32NX_ELEC_DC_2_BUS_IS_POWERED',
          type: SimVarValueType.Bool,
        },
      ],
      ['dc_ess_bus_powered', { name: 'A32NX_ELEC_DC_ESS_BUS_IS_POWERED', type: SimVarValueType.Bool }],
      [
        'dc_247pp_bus_powered',
        {
          name: 'A32NX_ELEC_247PP_BUS_IS_POWERED',
          type: SimVarValueType.Bool,
        },
      ],
      [
        'dc_hot_1_bus_powered',
        {
          name: 'A32NX_ELEC_DC_HOT_1_BUS_IS_POWERED',
          type: SimVarValueType.Bool,
        },
      ],
      [
        'dc_hot_2_bus_powered',
        {
          name: 'A32NX_ELEC_DC_HOT_2_BUS_IS_POWERED',
          type: SimVarValueType.Bool,
        },
      ],
      [
        'dc_hot_3_bus_powered',
        {
          name: 'A32NX_ELEC_DC_HOT_3_BUS_IS_POWERED',
          type: SimVarValueType.Bool,
        },
      ],
      [
        'dc_hot_4_bus_powered',
        {
          name: 'A32NX_ELEC_DC_HOT_4_BUS_IS_POWERED',
          type: SimVarValueType.Bool,
        },
      ],
      [
        'dc_gnd_flt_svc_bus_powered',
        {
          name: 'A32NX_ELEC_DC_GND_FLT_SVC_BUS_IS_POWERED',
          type: SimVarValueType.Bool,
        },
      ],
      [
        'dc_bus_108ph_powered',
        {
          name: 'A32NX_ELEC_108PH_BUS_IS_POWERED',
          type: SimVarValueType.Bool,
        },
      ],
      [
        'dc_bus_309pp_powered',
        {
          name: 'A32NX_ELEC_309PP_BUS_IS_POWERED',
          type: SimVarValueType.Bool,
        },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
