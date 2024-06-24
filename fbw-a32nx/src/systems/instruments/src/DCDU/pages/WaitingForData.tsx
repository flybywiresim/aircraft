// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';

export const WaitingForData: React.FC = () => (
  <>
    <svg className="startup-text">
      <text x="1968" y="1360">
        WAITING FOR DATA
      </text>
      <text x="1968" y="1680">
        (MAX 30 SECONDS)
      </text>
    </svg>
  </>
);
