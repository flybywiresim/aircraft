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
            <g id="N1-Limit">
                {!active
                && (
                    <>
                        <text className="Large Center Amber" x={x} y={y}>XX</text>
                        <text className="Large Center Amber" x={x} y={y + 28}>XX</text>
                    </>
                )}
                {active
                && (
                    <>
                        <text className="Huge Center Cyan" x={x} y={y}>{thrustLimitTypeArray[N1LimitType]}</text>
                        <text className="Large End Green Spread" x={x + 5} y={y + 28}>{N1ThrustLimitSplit[0]}</text>
                        <text className="Large End Green" x={x + 22} y={y + 28}>.</text>
                        <text className="Medium End Green" x={x + 38} y={y + 28}>{N1ThrustLimitSplit[1]}</text>
                        <text className="Medium End Cyan" x={x + 53} y={y + 28}>%</text>
                    </>
                )}
                {active && displayFlexTemp
                && (
                    <>
                        <text className="Medium Cyan" x={x - 20} y={y + 55}>
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
