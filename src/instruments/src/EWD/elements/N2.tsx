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

    return (
        <>
            <g id={`N2-indicator-${engine}`}>
                <rect x={x - 6} y={y + 19} width={62} height={17} className="LightGreyBox Hide" />
                <text className="Large End Green" x={x + 33} y={y + 35}>{N2percentSplit[0]}</text>
                <text className="Large End Green" x={x + 42} y={y + 35}>.</text>
                <text className="Medium End Green" x={x + 55} y={y + 35}>{N2percentSplit[1]}</text>
            </g>
        </>
    );
};

export default N2;
