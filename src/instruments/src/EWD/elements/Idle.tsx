import { useUpdate } from '@instruments/common/hooks';
import { useSimVar } from '@instruments/common/simVars';
import React, { useEffect, useState } from 'react';

type IdleProps = {
    x: number,
    y: number,
};

const Idle: React.FC<IdleProps> = ({ x, y }) => {
    const [flightPhase] = useSimVar('L:A32NX_FWC_FLIGHT_PHASE', 'enum', 1000);
    const [N1PercentLeft] = useSimVar('L:A32NX_ENGINE_N1:1', 'percent', 100);
    const [N1PercentRight] = useSimVar('L:A32NX_ENGINE_N1:1', 'percent', 100);
    const [N1Idle] = useSimVar('L:A32NX_ENGINE_IDLE_N1', 'percent', 1000);
    const [autoThrust] = useSimVar('L:A32NX_AUTOTHRUST_STATUS', 'enum', 500);

    const [timer, setTimer] = useState<number | null>(null);
    const [flash, setFlash] = useState(false);

    const showIdle = N1PercentLeft <= N1Idle && N1PercentRight <= N1Idle && flightPhase >= 5 && flightPhase <= 7 && autoThrust !== 0;

    useUpdate((deltaTime) => {
        if (timer !== null) {
            if (timer > 0) {
                if (deltaTime < 1000) {
                    setTimer(timer - (deltaTime / 1000));
                }
                setFlash(true);
            } else {
                setTimer(null);
                setFlash(false);
            }
        }
    });

    useEffect(() => {
        if (showIdle && timer == null) {
            setTimer(10);
        }
    }, [showIdle]);

    return (
        <>
            <g className={showIdle ? 'Show' : 'Hide'}>
                <text className={`Large Center ${flash ? 'GreenPulse' : 'Green'}`} x={x} y={y}>IDLE</text>
            </g>
        </>
    );
};

export default Idle;
