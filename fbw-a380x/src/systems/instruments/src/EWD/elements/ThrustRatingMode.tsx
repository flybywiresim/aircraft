import { useArinc429Var } from '@instruments/common/arinc429';
import { splitDecimals } from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';
import { Arinc429Word } from '@shared/arinc429';
import React from 'react';

type N1LimitProps = {
    x: number,
    y: number,
    active: boolean,
};

const N1Limit: React.FC<N1LimitProps> = ({ x, y, active }) => {
    const [N1LimitType] = useSimVar('L:A32NX_AUTOTHRUST_THRUST_LIMIT_TYPE', 'enum', 500);
    const [N1ThrustLimit] = useSimVar('L:A32NX_AUTOTHRUST_THRUST_LIMIT', 'number', 100);
    const N1ThrustLimitSplit = splitDecimals(N1ThrustLimit);
    const thrustLimitTypeArray = ['', 'CLB', 'MCT', 'FLX', 'TOGA', 'MREV'];
    const [flexTemp] = useSimVar('L:AIRLINER_TO_FLEX_TEMP', 'number', 1000);
    const sat: Arinc429Word = useArinc429Var('L:A32NX_ADIRS_ADR_1_STATIC_AIR_TEMPERATURE', 500);
    const displayFlexTemp: boolean = flexTemp !== 0 && (flexTemp >= (sat.value - 10)) && N1LimitType === 3;

    return (
        <>
            <g id='Thrust-Rating-Mode'>
                {!active
                && (
                    <>
                        <text className='F26 Center Amber' x={x - 18} y={y}>XX</text>
                    </>
                )}
                {active
                && (
                    <>
                        <text className='Huge End Cyan' x={x} y={y}>{thrustLimitTypeArray[N1LimitType]}</text>
                        <text className='F26 End Green Spread' x={x + 69} y={y - 2}>{N1ThrustLimitSplit[0]}</text>
                        <text className='F26 End Green' x={x + 86} y={y - 2}>.</text>
                        <text className='F20 End Green' x={x + 101} y={y - 2}>{N1ThrustLimitSplit[1]}</text>
                        <text className='F20 End Cyan' x={x + 117} y={y - 2}>%</text>
                    </>
                )}
                {active && displayFlexTemp
                && (
                    <>
                        <text className='F20 Cyan' x={x + 154} y={y}>
                            {Math.round(flexTemp)}
                            &deg;C
                        </text>
                    </>
                )}
            </g>
        </>
    );
};

export default N1Limit;
