import React, { useEffect, useState } from 'react';
import { NXDataStore } from '@shared/persistence';
import { useSimVar } from './simVars';
import { useUpdate } from './hooks';

import './common.scss';
import './pixels.scss';

type DisplayUnitProps = {
    electricitySimvar: string
    potentiometerIndex: number
    failed?: boolean
}

enum DisplayUnitState {
    On,
    Off,
    Selftest,
    Standby
}

export const DisplayUnit: React.FC<DisplayUnitProps> = (props) => {
    const [coldDark] = useSimVar('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool', 200);
    const [state, setState] = useState((coldDark) ? DisplayUnitState.Off : DisplayUnitState.Standby);
    const [timer, setTimer] = useState<number | null>(null);

    const [potentiometer] = useSimVar(`LIGHT POTENTIOMETER:${props.potentiometerIndex}`, 'percent over 100', 200);
    const [electricityState] = useSimVar(props.electricitySimvar, 'bool', 200);
    const [homeCockpit] = useSimVar('L:A32NX_HOME_COCKPIT_ENABLED', 'bool', 200);

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
    });

    useEffect(() => {
        if (state !== DisplayUnitState.Off && props.failed) {
            setState(DisplayUnitState.Off);
        } else if (state === DisplayUnitState.On && (potentiometer === 0 || electricityState === 0)) {
            setState(DisplayUnitState.Standby);
            setTimer(10);
        } else if (state === DisplayUnitState.Standby && (potentiometer !== 0 && electricityState !== 0)) {
            setState(DisplayUnitState.On);
            setTimer(null);
        } else if (state === DisplayUnitState.Off && (potentiometer !== 0 && electricityState !== 0 && !props.failed)) {
            setState(DisplayUnitState.Selftest);
            setTimer(parseInt(NXDataStore.get('CONFIG_SELF_TEST_TIME', '15')));
        } else if (state === DisplayUnitState.Selftest && (potentiometer === 0 || electricityState === 0)) {
            setState(DisplayUnitState.Off);
            setTimer(null);
        }
    }, [state, potentiometer, electricityState]);

    if (state === DisplayUnitState.Selftest) {
        return (
            <>
                <div className="BacklightBleed" />
                <svg className="SelfTest" viewBox="0 0 600 600">
                    <rect className="SelfTestBackground" x="0" y="0" width="100%" height="100%" />

                    <text
                        className="SelfTestText"
                        x="50%"
                        y="50%"
                    >
                        SELF TEST IN PROGRESS
                    </text>
                    <text
                        className="SelfTestText"
                        x="50%"
                        y="56%"
                    >
                        (MAX 40 SECONDS)
                    </text>
                </svg>
            </>
        );
    } if (state === DisplayUnitState.Off) {
        return (
            <></>
        );
    } if (homeCockpit === 1) {
        return (
            <>
                <div style={{ display: state === DisplayUnitState.On ? 'block' : 'none' }}>{props.children}</div>
            </>
        );
    }
    return (
        <>
            <div className="BacklightBleed" />
            <div style={{ display: state === DisplayUnitState.On ? 'block' : 'none' }}>{props.children}</div>
        </>
    );
};
