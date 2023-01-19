import React, { useEffect, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { useUpdate } from '@instruments/common/hooks';

enum DisplayUnitState {
    On,
    Off,
    Selftest,
    Standby
}

type ISISDisplayUnitProps = {
    indicatedAirspeed: number
}

export const ISISDisplayUnit: React.FC<ISISDisplayUnitProps> = ({ indicatedAirspeed, children }) => {
    const powerUpTime = 90;
    const [isColdAndDark] = useSimVar('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool', 200);

    const [state, setState] = useState(isColdAndDark ? DisplayUnitState.Off : DisplayUnitState.Standby);
    const [timer, setTimer] = useState<number | null>(null);

    const [dcEssLive] = useSimVar('L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED', 'bool');
    const [dcHotLive] = useSimVar('L:A32NX_ELEC_DC_HOT_1_BUS_IS_POWERED', 'bool');

    const hasElectricity = indicatedAirspeed > 50 && dcHotLive || dcEssLive;

    useUpdate((deltaTime) => {
        if (timer !== null) {
            if (timer > 0) {
                setTimer(timer - (deltaTime / 1000));
            } else if (state === DisplayUnitState.Standby) {
                setState(DisplayUnitState.Off);
                setTimer(null);
            } else if (state === DisplayUnitState.Selftest) {
                setState(DisplayUnitState.On);
                setTimer(null);
            }
        }

        // override MSFS menu animations setting for this instrument
        if (!document.documentElement.classList.contains('animationsEnabled')) {
            document.documentElement.classList.add('animationsEnabled');
        }
    });

    useEffect(() => {
        if (state === DisplayUnitState.On && !hasElectricity) {
            setState(DisplayUnitState.Standby);
            setTimer(10);
        } else if (state === DisplayUnitState.Standby && hasElectricity) {
            setState(DisplayUnitState.On);
            setTimer(null);
        } else if (state === DisplayUnitState.Off && hasElectricity) {
            setState(DisplayUnitState.Selftest);
            setTimer(powerUpTime);
        } else if (state === DisplayUnitState.Selftest && !hasElectricity) {
            setState(DisplayUnitState.Off);
            setTimer(null);
        }
    });

    if (state === DisplayUnitState.Selftest) {
        return (
            <>
                <svg id="SelfTest" style={{ backgroundColor: 'black' }} className="SelfTest" version="1.1" viewBox="0 0 512 512">
                    <g id="AttFlag">
                        <rect id="AttTest" className="FillYellow" width="84" height="40" x="214" y="174" />
                        <text id="AltTestTxt" className="TextBackground" textAnchor="middle" x="256" y="206">ATT</text>
                    </g>
                    <g id="SpeedFlag">
                        <rect id="SpeedTest" className="FillYellow" width="84" height="40" x="70" y="244" />
                        <text id="SpeedTestTxt" className="TextBackground" textAnchor="middle" x="112" y="276">SPD</text>
                    </g>
                    <g id="AltFlag">
                        <rect id="AltTest" className="FillYellow" width="84" height="40" x="358" y="244" />
                        <text id="AltTestTxt" className="TextBackground" textAnchor="middle" x="400" y="276">ALT</text>
                    </g>
                    <g id="TimerFlag">
                        <rect id="TmrTest" className="FillYellow" width="160" height="40" x="178" y="332" />
                        <text id="TmrTestTxt" className="TextBackground" x="186" y="366">INIT</text>
                        <text id="TmrTestCountdown" className="TextBackground" textAnchor="end" x="330" y="366">
                            {Math.max(0, Math.ceil(timer!))}
                            s
                        </text>
                    </g>
                </svg>
            </>
        );
    }

    if (state === DisplayUnitState.Off) {
        return (
            <></>
        );
    }

    return (
        <>
            {children}
        </>
    );
};
