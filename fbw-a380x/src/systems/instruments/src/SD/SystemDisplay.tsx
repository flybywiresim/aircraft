// @ts-strict-ignore
// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { DisplayUnitID, LegacyCdsDisplayUnit } from '@instruments/common/LegacyCdsDisplayUnit';

import { EngPage } from './Pages/Engine/EngPage';
import { BleedPage } from './Pages/Bleed/BleedPage';
import { HydPage } from './Pages/Hyd/HydPage';
import { PressPage } from './Pages/Press/PressPage';
import { ElecAcPage } from './Pages/ElecAc/ElecAcPage';
import { FuelPage } from './Pages/FuelPage';
import { CbPage } from './Pages/CbPage';
import { ApuPage } from './Pages/Apu/ApuPage';
import { CondPage } from './Pages/Cond/CondPage';
import { DoorPage } from './Pages/Doors/DoorPage';
import { ElecDcPage } from './Pages/ElecDc/ElecDcPage';
import { WheelPage } from './Pages/Wheel/WheelPage';
import { FctlPage } from './Pages/Fctl/FctlPage';
import { VideoPage } from './Pages/Video/VideoPage';

import '../index.scss';
import { useSimVar } from '@flybywiresim/fbw-sdk';

export const SystemDisplay = () => {
  // make sure this is in line with the enum in EcamSystemPages.ts
  const PAGES = {
    0: <EngPage />,
    1: <ApuPage />,
    2: <BleedPage />,
    3: <CondPage />,
    4: <PressPage />,
    5: <DoorPage />,
    6: <ElecAcPage />,
    7: <ElecDcPage />,
    8: <FuelPage />,
    9: <WheelPage />,
    10: <HydPage />,
    11: <FctlPage />,
    12: <CbPage />,
    13: <></>,
    14: <></>,
    15: <VideoPage />,
  };

  const [pageToShow, _setPageToShow] = useSimVar('L:A32NX_ECAM_SD_PAGE_TO_SHOW', 'number');

  return (
    <LegacyCdsDisplayUnit displayUnitId={DisplayUnitID.Sd} hideBootTestScreens={true}>
      <g>{PAGES[pageToShow]}</g>
    </LegacyCdsDisplayUnit>
  );
};
