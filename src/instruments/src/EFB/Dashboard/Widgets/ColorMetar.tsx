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
                <span className="text-2xl text-theme-highlight">
                    {metarPart}
                    {' '}
                </span>
            );
        case ColorCode.Info:
            return ( // TODO utility color
                <span className="text-2xl text-gray-500">
                    {metarPart}
                    {' '}
                </span>
            );
        case ColorCode.Caution:
            return (
                <span className="text-2xl text-utility-amber">
                    {metarPart}
                    {' '}
                </span>
            );
        case ColorCode.Warning:
            return (
                <span className="text-2xl text-utility-salmon">
                    {metarPart}
                    {' '}
                </span>
            );
        case ColorCode.TrendMarker:
            return (
                <>
                    <span className="text-2xl font-bold text-gray-500">
                        {metarPart}
                    </span>
                    {' '}
                </>
            );
        default:
            return (
                <span className="text-2xl">
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
