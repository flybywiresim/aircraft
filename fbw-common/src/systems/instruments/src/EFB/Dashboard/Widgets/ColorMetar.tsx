// @ts-strict-ignore
// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { ColorCode, MetarParserType } from '@flybywiresim/fbw-sdk';

/**
 * Returns HTML with coloring for METAR parts marked with coloring hints.
 * ColorCode: src/systems/instruments/src/Common/metarTypes.ts
 */
export const ColoredMetar = ({ metar }: { metar: MetarParserType }) => {
  const partsList = metar.raw_parts.map((metarPart, index) => {
    let style = '';

    switch (metar.color_codes[index]) {
      case ColorCode.Highlight:
        style = 'text-theme-highlight';
        break;
      case ColorCode.Info:
        style = 'text-gray-500';
        break;
      case ColorCode.Caution:
        style = 'text-yellow-500';
        break;
      case ColorCode.Warning:
        style = 'text-red-400';
        break;
      case ColorCode.TrendMarker:
        style = 'font-bold text-gray-500';
        break;
      default:
    }

    return (
      <span key={metarPart} className={`text-2xl ${style}`}>
        {metarPart}{' '}
      </span>
    );
  });

  return <span>{partsList}</span>;
};
