import { useSimVar } from '@instruments/common/simVars';
import React from 'react';

type PacksNaiWaiProps = {
    x: number,
    y: number,
    flightPhase: number,
};

const PacksNaiWai: React.FC<PacksNaiWaiProps> = ({ x, y, flightPhase }) => {
    const textString = 'PACKS';

    return (
        <>
            <text className="Green Large End" x={x} y={y}>{textString}</text>
        </>
    );
};

export default PacksNaiWai;
