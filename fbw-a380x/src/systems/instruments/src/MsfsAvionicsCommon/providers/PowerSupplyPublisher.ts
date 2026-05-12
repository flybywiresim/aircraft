// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarValueType, SimVarPublisher, PublishPacer, SimVarPublisherEntry } from '@microsoft/msfs-sdk';

type BasePowerSupplySimvars = {
  ac_bus_powered: boolean;
  ac_ess_bus_powered: boolean;
  dc_bus_powered: boolean;
  dc_ess_bus_powered: boolean;
};

type IndexedTopics = 'ac_bus_powered' | 'dc_bus_powered';

type PowerSupplyIndexedEventType<T extends string> = `${T}_${1 | 2 | 3 | 4}`;

type PowerSupplyIndexedEvents = {
  [P in keyof Pick<BasePowerSupplySimvars, IndexedTopics> as PowerSupplyIndexedEventType<P>]: BasePowerSupplySimvars[P];
};

interface PowerSupplyPublisherEvents extends BasePowerSupplySimvars, PowerSupplyIndexedEvents {}

export interface PowerSupplySimvars extends Omit<BasePowerSupplySimvars, IndexedTopics>, PowerSupplyIndexedEvents {}

export class PowerSupplySimvarPublisher extends SimVarPublisher<PowerSupplyPublisherEvents> {
  public constructor(bus: EventBus, pacer?: PublishPacer<PowerSupplyPublisherEvents>) {
    const simvars = new Map<keyof PowerSupplyPublisherEvents, SimVarPublisherEntry<any>>([
      [
        'ac_bus_powered',
        {
          name: 'A32NX_ELEC_AC_#index#_BUS_IS_POWERED',
          type: SimVarValueType.Bool,
          indexed: [1, 2, 3, 4],
        },
      ],
      ['ac_ess_bus_powered', { name: 'A32NX_ELEC_AC_ESS_BUS_IS_POWERED', type: SimVarValueType.Bool }],
      [
        'dc_bus_powered',
        {
          name: 'A32NX_ELEC_DC_#index#_BUS_IS_POWERED',
          type: SimVarValueType.Bool,
          indexed: [1, 2, 3, 4],
        },
      ],
      ['dc_ess_bus_powered', { name: 'A32NX_ELEC_DC_ESS_BUS_IS_POWERED', type: SimVarValueType.Bool }],
    ]);

    super(simvars, bus, pacer);
  }
}
