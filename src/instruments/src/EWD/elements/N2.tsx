import { splitDecimals } from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';
import React from 'react';

type N2Props = {
    engine: 1 | 2,
    x: number,
    y: number,

};

const N2: React.FC<N2Props> = ({ x, y, engine }) => {
    const [N2percent] = useSimVar(`L:A32NX_ENGINE_N2:${engine}`, 'percent', 100);
    const N2percentSplit = splitDecimals(N2percent < 0 ? 0.0 : N2percent);
    const [engineState] = useSimVar(`L:A32NX_ENGINE_STATE:${engine}`, 'bool', 500);

    const starting = !!(N2percent < 58.5 && (engineState === 2 || engineState === 3)); // N1Percent sometimes does not reach N1Idle by .005 or so
    // const starting = true;

    return (
        <>
            <g id={`N2-indicator-${engine}`}>
                <rect x={x - 6} y={y + 22} width={80} height={25} className={`LightGreyBox ${starting ? 'Show' : 'Hide'}`} />
                <text className="Large End Green" x={x + 42} y={y + 45}>{N2percentSplit[0]}</text>
                <text className="Large End Green" x={x + 54} y={y + 45}>.</text>
                <text className="Medium End Green" x={x + 70} y={y + 45}>{N2percentSplit[1]}</text>
            </g>
        </>
    );
};

export default N2;
