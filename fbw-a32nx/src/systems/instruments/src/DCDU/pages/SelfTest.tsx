// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';

export const SelfTest: React.FC = () => (
  <>
    <svg className="startup-text">
      <text x="1968" y="1360">
        SELF TEST IN PROGRESS
      </text>
      <text x="1968" y="1680">
        (MAX 10 SECONDS)
      </text>
    </svg>
  </>
);
