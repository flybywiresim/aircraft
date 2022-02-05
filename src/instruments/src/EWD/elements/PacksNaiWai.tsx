import { useSimVar } from '@instruments/common/simVars';
import React from 'react';

type PacksNaiWaiProps = {
    x: number,
    y: number,
    flightPhase: number,
};

const PacksNaiWai: React.FC<PacksNaiWaiProps> = ({ x, y, flightPhase }) => {
    const [fob] = useSimVar('FUEL TOTAL QUANTITY WEIGHT', 'kg', 1000);
    const textString = 'PACKS/NAI/WAI';

    return (
        <>
            <text className="Green" x={x} y={y}>{textString}</text>
        </>
    );
};

export default PacksNaiWai;
