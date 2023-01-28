import { splitDecimals } from '@instruments/common/gauges';
import { useSimVar } from '@instruments/common/simVars';
import { Layer } from '@instruments/common/utils';
import React from 'react';

interface N2Props {
    engine: 1 | 2,
    x: number,
    y: number,
    active:boolean,
}

const N2: React.FC<N2Props> = ({ x, y, engine, active }) => {
    const [N2percent] = useSimVar(`L:A32NX_ENGINE_N2:${engine}`, 'percent', 100);
    const N2percentSplit = splitDecimals(N2percent < 0 ? 0.0 : N2percent);
    const [engineState] = useSimVar(`L:A32NX_ENGINE_STATE:${engine}`, 'bool', 500);

    const starting = !!(N2percent < 58.5 && (engineState === 2 || engineState === 3));
    // N1Percent sometimes does not reach N1Idle by .005 or so

    return (
        <Layer x={x} y={y} id={`N2-indicator-${engine}`}>
            {!active
                    && <text className="Large End Amber" x={60} y={45}>XX</text>}
            {active
                    && (
                        <>
                            <rect x={-9} y={22} width={80} height={25} className={`LightGreyBox ${starting ? 'Show' : 'Hide'}`} />
                            <text className="Large End Green" x={42} y={45}>{N2percentSplit[0]}</text>
                            <text className="Large End Green" x={54} y={45}>.</text>
                            <text className="Medium End Green" x={70} y={45}>{N2percentSplit[1]}</text>
                        </>
                    ) }
        </Layer>
    );
};

export default N2;
