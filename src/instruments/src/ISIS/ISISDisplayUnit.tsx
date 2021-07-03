import React, { useEffect, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { useUpdate } from '@instruments/common/hooks';

enum DisplayUnitState {
    On,
    Off,
    Selftest,
}

type Props = {
    indicatedAirspeed: number;
}

export const ISISDisplayUnit: React.FC<Props> = ({ indicatedAirspeed, children }) => {
    const powerUpTime = 10;

    const [state, setState] = useState(DisplayUnitState.Off);
    const [timer, setTimer] = useState<number | null>(null);

    const [dcEssLive] = useSimVar('L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED', 'bool');
    const [dcHotLive] = useSimVar('L:A32NX_ELEC_DC_HOT_1_BUS_IS_POWERED', 'bool');

    const electricityState = indicatedAirspeed > 50 && dcHotLive || dcEssLive;

    useUpdate((deltaTime) => {
        if (timer !== null) {
            if (timer > 0) {
                setTimer(timer - (deltaTime / 1000));
            } else if (state === DisplayUnitState.Selftest) {
                setState(DisplayUnitState.On);
                setTimer(null);
            }
        }
    });

    useEffect(() => {
        if (electricityState === 0) {
            setState(DisplayUnitState.Off);
            setTimer(null);
        } else if (state === DisplayUnitState.Off) {
            setState(DisplayUnitState.Selftest);
            setTimer(powerUpTime);
        }
    });

    if (state === DisplayUnitState.Selftest) {
        return (
            <svg id="SelfTest" className="SelfTest" version="1.1" viewBox="0 0 512 512">
                <rect x="0" y="0" width="100%" height="100%" fill="#1f242d" />
                <g id="AttFlag">
                    <rect id="AttTest" className="FillYellow" width="84" height="40" x="214" y="174" />
                    <text id="AltTestTxt" className="StrokeBackground FillBackground" textAnchor="middle" x="256" y="206">ATT</text>
                </g>
                <g id="SpeedFlag">
                    <rect id="SpeedTest" className="FillYellow" width="84" height="40" x="70" y="244" />
                    <text id="SpeedTestTxt" className="StrokeBackground FillBackground" textAnchor="middle" x="112" y="276">SPD</text>
                </g>
                <g id="AltFlag">
                    <rect id="AltTest" className="FillYellow" width="84" height="40" x="266" y="244" />
                    <text id="AltTestTxt" className="StrokeBackground FillBackground" textAnchor="middle" x="316" y="276">ALT</text>
                </g>
                <g id="TimerFlag">
                    <rect id="TmrTest" className="FillYellow" width="120" height="40" x="204" y="324" />
                    <text id="TmrTestTxt" className="StrokeBackground FillBackground" textAnchor="middle" x="256" y="366">
                        {`INIT ${Math.floor(timer!)}s`}
                        {/* INIT 35s */}
                    </text>
                </g>
            </svg>
        );
    } if (state === DisplayUnitState.Off) {
        return (
            <></>
        );
    }
    return (
        <>{children}</>
    );
};
