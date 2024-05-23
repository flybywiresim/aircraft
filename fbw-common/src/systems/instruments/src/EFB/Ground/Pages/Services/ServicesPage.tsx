// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-console */
import React from 'react';
import { AirframeType } from '@flybywiresim/fbw-sdk';
import { useAppSelector } from '@flybywiresim/flypad';
import { A380Services } from './A380_842/A380Services';
import { A320Services } from './A320_251N/A320Services';

export const ServicesPage = () => {
  // TODO: Configurable Services Page vs A380/A320
  const airframeInfo = useAppSelector((state) => state.config.airframeInfo);

  switch (airframeInfo.variant) {
    case AirframeType.A380_842:
      return <A380Services />;
    case AirframeType.A320_251N:
    default:
      return <A320Services />;
  }
};
