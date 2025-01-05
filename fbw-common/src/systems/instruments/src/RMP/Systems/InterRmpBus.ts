// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { IndexedEvents } from '@microsoft/msfs-sdk';

import { FrequencyMode, VhfComIndices } from '../../../../shared/src/RadioTypes';

interface InterRmpBusComIndexedEventsRoot {
  /** VHFn active frequency sync event, BCD32. */
  inter_rmp_set_vhf_active: number;
  /** VHFn standby frequency sync event, BCD32. */
  inter_rmp_set_vhf_standby: number;
  /** VHFn active mode sync event. */
  inter_rmp_set_vhf_active_mode: FrequencyMode;
  /** VHFn standby mode sync event. */
  inter_rmp_set_vhf_standby_mode: FrequencyMode;
}

type InterRmpBusComEvents = IndexedEvents<InterRmpBusComIndexedEventsRoot, VhfComIndices>;

export type InterRmpBusEvents = InterRmpBusComEvents;
