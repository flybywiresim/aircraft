import { useSimVar } from '@instruments/common/simVars';
import { Position, EngineNumber, FadecActive } from '@instruments/common/types';
import React from 'react';

const IgnitionBorder: React.FC<Position & EngineNumber & FadecActive> = ({ x, y, engine, active }) => {
    const [engineState] = useSimVar(`L:A32NX_ENGINE_STATE:${engine}`, 'bool', 500);
    const [N1Percent] = useSimVar(`L:A32NX_ENGINE_N1:${engine}`, 'percent', 100);
    const [N1Idle] = useSimVar('L:A32NX_ENGINE_IDLE_N1', 'percent', 1000);
    const showBorder = !!((N1Percent < Math.floor(N1Idle) - 1) && (engineState === 2));
    // const showBorder = true;

    return (
        <>
            <g id={`ignition-border-${engine}`}>
                {active && showBorder
                    && (
                        <>
                            <path className='WhiteLine' d={`m ${x - 74} ${y - 13} l 0,-72 l 162,0 l 0,72`} />
                            <path className='WhiteLine' d={`m ${x - 74} ${y + 168} l 0,72 l 162,0 l 0,-72`} />
                        </>
                    )}
            </g>
        </>
    );
};

export default IgnitionBorder;
