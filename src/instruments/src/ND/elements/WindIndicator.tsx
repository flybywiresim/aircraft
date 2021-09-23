import React, { FC } from 'react';
import { Layer } from '@instruments/common/utils';
import { Arinc429Word, useArinc429Var } from '@instruments/common/arinc429';
import { AdirsTasDrivenIndicatorProps } from '../index';

const mod = (x: number, n: number) => x - Math.floor(x / n) * n;

export const WindIndicator: FC<AdirsTasDrivenIndicatorProps> = ({ irs }) => {
    const windDirection: Arinc429Word = useArinc429Var(`L:A32NX_ADIRS_IR_${irs}_WIND_DIRECTION`, 500);
    const windVelocity: Arinc429Word = useArinc429Var(`L:A32NX_ADIRS_IR_${irs}_WIND_VELOCITY`, 500);
    const planeHeading: Arinc429Word = useArinc429Var(`L:A32NX_ADIRS_IR_${irs}_HEADING`, 500);

    let windDirectionText: string;
    let windVelocityText: string;
    let windArrowShow: boolean = false;
    if (!windVelocity.isNormalOperation() || !windDirection.isNormalOperation()) {
        windDirectionText = '';
        windVelocityText = '';
        windArrowShow = false;
    } else if (windVelocity.value < 0.00001) {
        windDirectionText = '---';
        windVelocityText = '---';
    } else {
        windDirectionText = Math.round(windDirection.value).toString().padStart(3, '0');
        windVelocityText = Math.round(windVelocity.value).toString();
        if (windVelocity.value >= 2) {
            windArrowShow = true;
        }
    }

    let rotation;
    if (planeHeading.isNormalOperation() && windDirection.isNormalOperation()) {
        rotation = mod(Math.round(windDirection.value) - Math.round(planeHeading.value) + 180, 360);
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
