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
        switch (metar.color_codes[index]) {
        case ColorCode.Highlight:
            return (
                <span className="text-teal-regular">
                    {metarPart}
                    {' '}
                </span>
            );
        case ColorCode.Info:
            return (
                <span className="text-gray-500">
                    {metarPart}
                    {' '}
                </span>
            );
        case ColorCode.Caution:
            return (
                <span className="text-yellow-500">
                    {metarPart}
                    {' '}
                </span>
            );
        case ColorCode.Warning:
            return (
                <span className="text-red-400">
                    {metarPart}
                    {' '}
                </span>
            );
        case ColorCode.TrendMarker:
            return (
                <>
                    <span className="font-bold text-gray-500">
                        {metarPart}
                    </span>
                    {' '}
                </>
            );
        default:
            return (
                <span>
                    {metarPart}
                    {' '}
                </span>
            );
        }
    });

    return (
        <span>{ partsList }</span>
    );
};
