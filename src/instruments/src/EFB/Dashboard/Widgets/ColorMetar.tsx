// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { ColorCode, MetarParserType } from '@instruments/common/metarTypes';

/**
 * Returns HTML with coloring for METAR parts marked with coloring hints.
 * ColorCode: src/instruments/src/Common/metarTypes.ts
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
            <span className={`text-2xl ${style}`}>
                {metarPart}
                {' '}
            </span>
        );
    });

    return (
        <span>{ partsList }</span>
    );
};
