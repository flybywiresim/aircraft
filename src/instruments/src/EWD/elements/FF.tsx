import { fuelForDisplay } from '@instruments/common/fuel';
import { useSimVar } from '@instruments/common/simVars';
import { Layer } from '@instruments/common/utils';
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

    return (
        <>
            <Layer x={x} y={y} id={`FF-indicator-${engine}`}>
                {!active
                    && <text className="Large End Amber" x={-20} y={0}>XX</text>}
                {active
                && <text className="Large End Green" x={0} y={0}>{fuelForDisplay(fuelFlow, unit)}</text>}
            </Layer>
        </>
    );
};

export default FF;
