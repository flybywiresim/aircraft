import React from 'react';
import { ColorCode, MetarParserType } from '@instruments/common/metarTypes';

/**
 * Returns HTML with coloring for METAR parts marked with coloring hints.
 * ColorCode: src/instruments/src/Common/metarTypes.ts
 * @param props
 */
const ColoredMetar = (props: { metar: MetarParserType }) => {
    const partsList = props.metar.raw_parts.map((metarPart, index) => {
        switch (props.metar.color_codes[index]) {
        case ColorCode.Highlight:
            return (
                <span className="text-teal-regular">
                    {props.metar.raw_parts[index]}
                    {' '}
                </span>
            );
        case ColorCode.Info:
            return (
                <span className="text-gray-500">
                    {props.metar.raw_parts[index]}
                    {' '}
                </span>
            );
        case ColorCode.Caution:
            return (
                <span className="text-yellow-500">
                    {props.metar.raw_parts[index]}
                    {' '}
                </span>
            );
        case ColorCode.Warning:
            return (
                <span className="text-red-600">
                    {props.metar.raw_parts[index]}
                    {' '}
                </span>
            );
        case ColorCode.TrendMarker:
            return (
                <span>
                    <span className="underline font-bold text-gray-500">
                        {props.metar.raw_parts[index]}
                    </span>
                    {' '}
                </span>

            );
        default:
            return (
                <span>
                    {props.metar.raw_parts[index]}
                    {' '}
                </span>
            );
        }
    });

    return (
        <span>{ partsList }</span>
    );
};

export default ColoredMetar;
