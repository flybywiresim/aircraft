import { useSimVar } from '@instruments/common/simVars';
import { fuelForDisplay } from '@instruments/common/fuel';
import React from 'react';
import { Layer } from '@instruments/common/utils';

interface FOBProps {
    unit: string,
    x: number,
    y: number,
}

const FOB: React.FC<FOBProps> = ({ unit, x, y }) => {
    const [fob] = useSimVar('FUEL TOTAL QUANTITY WEIGHT', 'kg', 1000);

    return (
        <Layer x={x} y={y}>
            <text id="FobLabel" x={0} y={0}>FOB</text>
            <text id="FobColon" x={69} y={0}>:</text>

            <text id="FobValue" x={198} y={0}>{fuelForDisplay(fob, unit, 1, 2)}</text>

            <text id="FobUnit" x={227} y={0}>{unit === '1' ? 'KG' : 'LBS'}</text>
        </Layer>
    );
};

export default FOB;
