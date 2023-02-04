import React, { FC } from 'react';
import { Layer } from '@instruments/common/utils';
import { useArinc429Var } from '@instruments/common/arinc429';
import { Arinc429Word } from '@shared/arinc429';
import { AdirsTasDrivenIndicatorProps } from '../index';

const mod = (x: number, n: number) => x - Math.floor(x / n) * n;

export const WindIndicator: FC<AdirsTasDrivenIndicatorProps> = ({ irs }) => {
    const windDirection: Arinc429Word = useArinc429Var(`L:A32NX_ADIRS_IR_${irs}_WIND_DIRECTION_BNR`, 500);
    const windSpeed: Arinc429Word = useArinc429Var(`L:A32NX_ADIRS_IR_${irs}_WIND_SPEED_BNR`, 500);
    const planeHeading: Arinc429Word = useArinc429Var(`L:A32NX_ADIRS_IR_${irs}_TRUE_HEADING`, 500);

    const windDirection360 = windDirection.value < 0 ? windDirection.value + 360 : windDirection.value;

    let windDirectionText: string;
    let windSpeedText: string;
    let windArrowShow: boolean = false;
    if (windSpeed.isFailureWarning() || windDirection.isFailureWarning()) {
        windDirectionText = '';
        windSpeedText = '';
        windArrowShow = false;
    } else if (windSpeed.isNoComputedData() || windDirection.isNoComputedData()) {
        windDirectionText = '---';
        windSpeedText = '---';
    } else {
        windDirectionText = Math.round(windDirection360).toString().padStart(3, '0');
        windSpeedText = Math.round(windSpeed.value).toString();
        if (windSpeed.value >= 2) {
            windArrowShow = true;
        }
    }

    let rotation;
    if (planeHeading.isNormalOperation() && windDirection.isNormalOperation()) {
        rotation = mod(Math.round(windDirection360) - Math.round(planeHeading.value) + 180, 360);
    }
    return (
        <Layer x={17} y={56}>
            <text x={25} y={0} fontSize={22} textAnchor="end" className="Green">
                {windDirectionText}
            </text>
            <text x={30} y={0} fontSize={22} className="White">/</text>
            <text x={48} y={0} fontSize={22} className="Green">
                {windSpeedText}
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
