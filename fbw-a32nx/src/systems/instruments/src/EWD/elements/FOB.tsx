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
            <text className="Huge Center" x={-1} y={0}>FOB</text>
            <text className="Huge Center" x={52} y={0}>:</text>

            <text className="Huge End Green" x={172} y={0}>{fuelForDisplay(fob, unit, 1, 2)}</text>

            <text className="Standard Center Cyan" x={212} y={-1}>{unit === '1' ? 'KG' : 'LBS'}</text>
        </Layer>
    );
};

export default FOB;
