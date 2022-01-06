import { fuelForDisplay } from '@instruments/common/FuelFunctions';
import { useSimVar } from '@instruments/common/simVars';
import React from 'react';

type FFProps = {
    unit: string,
    engine: 1 | 2,
    x: number,
    y: number,
    active: boolean,
};

const FF: React.FC<FFProps> = ({ unit, x, y, engine, active }) => {
    const [fuelFlow] = useSimVar(`L:A32NX_ENGINE_FF:${engine}`, 'number', 1000); // KG/HR
    // const fuelFlow = 320;

    return (
        <>
            <g id={`FF-indicator-${engine}`}>
                {!active
                    && <text className="Large End Amber" x={x - 20} y={y}>XX</text>}
                {active
                && <text className="Large End Green" x={x} y={y}>{fuelForDisplay(fuelFlow, unit)}</text>}
            </g>
        </>
    );
};

export default FF;
