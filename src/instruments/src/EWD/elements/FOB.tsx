import { useSimVar } from '@instruments/common/simVars';
import { fuelForDisplay } from '@instruments/common/FuelFunctions';
import React from 'react';

type FOBProps = {
    unit: string,
    x: number,
    y: number,
};

const FOB: React.FC<FOBProps> = ({ unit, x, y }) => {
    const [fob] = useSimVar('FUEL TOTAL QUANTITY WEIGHT', 'kg', 1000);

    return (
        <>
            <text id="FobLabel" x={x} y={y}>FOB</text>
            <text id="FobColon" x={x + 54} y={y}>:</text>

            <text id="FobValue" x={x + 152} y={y}>{fuelForDisplay(fob, unit, 1, 2)}</text>

            <text id="FobUnit" x={x + 172} y={y}>{unit === '1' ? 'KG' : 'LBS'}</text>
        </>
    );
};

export default FOB;
