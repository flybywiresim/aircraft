// @ts-strict-ignore
// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { useSimVar } from '@flybywiresim/fbw-sdk-react';
import { EngPage } from './Pages/Eng/Eng';
import { BleedPage } from './Pages/Bleed/Bleed';
import { PressPage } from './Pages/Press/Press';
import { ElecPage } from './Pages/Elec/Elec';
import { HydPage } from './Pages/Hyd/Hyd';
import { FuelPage } from './Pages/Fuel/Fuel';
import { ApuPage } from './Pages/Apu/Apu';
import { CondPage } from './Pages/Cond/Cond';
import { DoorPage } from './Pages/Door/Door';
import { WheelPage } from './Pages/Wheel/Wheel';
import { CrzPage } from './Pages/Crz/Crz';

export const PagesContainer = () => {
  const [currentPage, _] = useSimVar('L:A32NX_ECAM_SD_PAGE_TO_DISPLAY', 'number');

  const pages = {
    0: <EngPage />,
    1: <BleedPage />,
    2: <PressPage />,
    3: <ElecPage />,
    4: <HydPage />,
    5: <FuelPage />,
    6: <ApuPage />,
    7: <CondPage />,
    8: <DoorPage />,
    9: <WheelPage />,
    10: <></>,
    11: <CrzPage />,
    12: <></>,
  };

  return (
    pages[currentPage] || (
      <text x={300} y={300} fill="white" fontSize={18} textAnchor="middle">
        invalid page
      </text>
    )
  );
};
