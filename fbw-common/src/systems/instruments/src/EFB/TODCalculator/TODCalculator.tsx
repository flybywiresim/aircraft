// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { GroundSpeed } from './GroundSpeed/GroundSpeed';
import { Data } from './Data/Data';
import { Result } from './Result/Result';

export const TODCalculator = () => (
  <div className="mt-6 flex w-full">
    <div className="mr-4 w-4/12">
      <GroundSpeed className="flex h-full flex-col" />
    </div>

    <div className="mr-4 w-4/12">
      <Data className="flex h-full flex-col" />
    </div>

    <div className="w-4/12">
      <Result className="flex h-full flex-col" />
    </div>
  </div>
);
