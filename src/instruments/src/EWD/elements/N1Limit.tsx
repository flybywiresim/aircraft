import { useArinc429Var } from '@instruments/common/arinc429';
import { splitDecimals } from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';
import { Layer } from '@instruments/common/utils';
import { Arinc429Word } from '@shared/arinc429';
import React from 'react';

interface N1LimitProps {
    x: number,
    y: number,
    active: boolean,
}

const N1Limit: React.FC<N1LimitProps> = ({ x, y, active }) => {
    const [N1LimitType] = useSimVar('L:A32NX_AUTOTHRUST_THRUST_LIMIT_TYPE', 'enum', 500);
    const [N1ThrustLimit] = useSimVar('L:A32NX_AUTOTHRUST_THRUST_LIMIT', 'number', 100);
    const N1ThrustLimitSplit = splitDecimals(N1ThrustLimit);
    const thrustLimitTypeArray = ['', 'CLB', 'MCT', 'FLX', 'TOGA', 'MREV'];
    const [flexTemp] = useSimVar('L:AIRLINER_TO_FLEX_TEMP', 'number', 1000);
    const sat: Arinc429Word = useArinc429Var('L:A32NX_ADIRS_ADR_1_STATIC_AIR_TEMPERATURE', 500);
    const displayFlexTemp: boolean = flexTemp !== 0 && (flexTemp >= (sat.value - 10)) && N1LimitType === 3;

    return (
        <Layer x={x} y={y} id="N1-Limit">
            {!active
                && (
                    <>
                        <text className="Large Center Amber" x={0} y={0}>XX</text>
                        <text className="Large Center Amber" x={0} y={28}>XX</text>
                    </>
                )}
            {active
                && (
                    <>
                        <text className="Huge Center Cyan" x={0} y={-1}>{thrustLimitTypeArray[N1LimitType]}</text>
                        <text className="Huge End Green" x={5} y={28}>{N1ThrustLimitSplit[0]}</text>
                        <text className="Large End Green" x={18} y={28}>.</text>
                        <text className="Standard End Green" x={34} y={28}>{N1ThrustLimitSplit[1]}</text>
                        <text className="Medium End Cyan" x={49} y={27}>%</text>
                    </>
                )}
            {active && displayFlexTemp
                && (
                    <>
                        <text className="Standard Cyan" x={-23} y={57}>
                            {Math.round(flexTemp)}
                            &deg;C
                        </text>
                    </>
                )}
        </Layer>
    );
};

export default N1Limit;
