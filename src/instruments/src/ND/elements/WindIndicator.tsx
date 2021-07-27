import React, { FC } from 'react';
import { Layer } from '@instruments/common/utils';
import { ADIRS } from '@instruments/common/adirs';
import { AdirsTasDrivenIndicatorProps } from '../index';

const mod = (x: number, n: number) => x - Math.floor(x / n) * n;

export const WindIndicator: FC<AdirsTasDrivenIndicatorProps> = ({ irs }) => {
    const windDirection = ADIRS.updateValue(`L:A32NX_ADIRS_IR_${irs}_WIND_DIRECTION`, 'Degrees', 500);
    const windVelocity = ADIRS.updateValue(`L:A32NX_ADIRS_IR_${irs}_WIND_VELOCITY`, 'Knots', 500);
    const planeHeading = ADIRS.updateValue(`L:A32NX_ADIRS_IR_${irs}_HEADING`, 'Degrees', 500);

    let windDirectionText: string;
    let windVelocityText: string;
    let windArrowShow = false;
    if (Number.isNaN(windVelocity) || Number.isNaN(windDirection)) {
        windDirectionText = '';
        windVelocityText = '';
        windArrowShow = false;
    } else if (windVelocity < 0.00001) {
        windDirectionText = '---';
        windVelocityText = '---';
    } else {
        windDirectionText = Math.round(windDirection).toString().padStart(3, '0');
        windVelocityText = Math.round(windVelocity).toString();
        if (windVelocity >= 2) {
            windArrowShow = true;
        }
    }

    let rotation;
    if (!Number.isNaN(planeHeading)) {
        rotation = mod(Math.round(windDirection) - Math.round(planeHeading) + 180, 360);
    }
    return (
        <Layer x={17} y={56}>
            <text x={25} y={0} fontSize={22} textAnchor="end" className="Green">
                {windDirectionText}
            </text>
            <text x={30} y={0} fontSize={22} className="White">/</text>
            <text x={48} y={0} fontSize={22} className="Green">
                {windVelocityText}
            </text>
            {windArrowShow && (
                <path
                    className="Green"
                    strokeWidth={2.25}
                    strokeLinecap="round"
                    d="M 0 30 v -20 m -7 8 l 7 -8 l 7 8"
                    transform={`rotate(${rotation} 0 20)`}
                    visibility="visible"
                />
            )}
        </Layer>
    );
};
