import React from 'react';
import { ColorCode } from '@instruments/common/metarTypes';

type ColoredMetarProps = {
    rawParts: string[],
    colorCodes: ColorCode[],
}

/**
 * Returns HTML with coloring for METAR parts marked with coloring hints.
 * ColorCode: src/instruments/src/Common/metarTypes.ts
 * @param props
 */
const ColoredMetar = (props: ColoredMetarProps) => {
    const partsList = props.rawParts.map((metarPart, index) => {
        switch (props.colorCodes[index]) {
        case ColorCode.Highlight:
            return (
                <span className="text-teal-regular">
                    {props.rawParts[index]}
                    {' '}
                </span>
            );
        case ColorCode.Info:
            return (
                <span className="text-gray-500">
                    {props.rawParts[index]}
                    {' '}
                </span>
            );
        case ColorCode.Caution:
            return (
                <span className="text-yellow-500">
                    {props.rawParts[index]}
                    {' '}
                </span>
            );
        case ColorCode.Warning:
            return (
                <span className="text-red-600">
                    {props.rawParts[index]}
                    {' '}
                </span>
            );
        case ColorCode.TrendMarker:
            return (
                <span>
                    <span className="underline font-bold text-gray-500">
                        {props.rawParts[index]}
                    </span>
                    {' '}
                </span>

            );
        default:
            return (
                <span>
                    {props.rawParts[index]}
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
