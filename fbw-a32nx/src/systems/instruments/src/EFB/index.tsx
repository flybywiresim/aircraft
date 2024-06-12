// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';

import { render } from '@instruments/common/index';
import { EfbWrapper } from '@flybywiresim/flypad';
import { A320FailureDefinitions } from '@failures';
import { EventBusContextProvider } from '../../../../../../fbw-common/src/systems/instruments/src/EFB/event-bus-provider';

// TODO: Move failure definition into VFS
render(
  <EventBusContextProvider>
    <EfbWrapper failures={A320FailureDefinitions} />
  </EventBusContextProvider>,
  true,
  true,
);
