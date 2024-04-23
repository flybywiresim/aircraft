// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { render } from '@instruments/common/index';
import { EfbWrapper} from '@flybywiresim/flypad';
import { A380FailureDefinitions } from "../../../failures";

// TODO: Move failure definition into VFS
render(
    <EfbWrapper failures={A380FailureDefinitions} />
);
