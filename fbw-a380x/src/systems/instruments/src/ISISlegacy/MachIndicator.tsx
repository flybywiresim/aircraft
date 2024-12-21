// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { useSimVar } from '@flybywiresim/fbw-sdk';
import React, { useState, useEffect } from 'react';

export const MachIndicator: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [mach] = useSimVar('AIRSPEED MACH', 'mach');

  useEffect(() => {
    if (mach > 0.5 && !visible) {
      setVisible(true);
    } else if (mach < 0.45 && visible) {
      setVisible(false);
    }
  }, [mach]);

  return (
    <>
      {visible && (
        <text x={68} y={445} className="TextGreen FontMedium">
          {mach.toFixed(2).slice(1)}
        </text>
      )}
    </>
  );
};
