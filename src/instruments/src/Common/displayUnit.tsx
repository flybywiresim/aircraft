import React, { useEffect, useState } from 'react';
import { NXDataStore } from '@shared/persistence';
import { useGameVar, useSimVar } from './simVars';
import { useUpdate } from './hooks';
import { setSimVar } from '../util';

import './common.scss';
import './pixels.scss';

type DisplayUnitProps = {
    electricitySimvar: string
    potentiometerIndex: number
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
    const [opacity, setOpacity] = useState(0.0);

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

    // TODO: This only calculates in one instance (on Captain's PFD), move this to FCU when in react.
    if (props.potentiometerIndex === 88) {
        const [zoomLevel] = useSimVar('COCKPIT CAMERA ZOOM', 'percent', 200);
        const camXyz = useGameVar('CAMERA POS IN PLANE', 'xyz', 200);

        useEffect(() => {
            // zTarget: Target zPos that marks max pixel effect point (11.625z @ 100%, 11.7z @ 75%)
            const zTarget = (3975 - zoomLevel) / 333.33;
            // zΔ: Diff between current zPos and zTarget
            const zDelta = camXyz.z - zTarget;
            // opacity: 4zΔ + 0.5 < 0.5
            setOpacity(Math.min(0.5, 4 * (zDelta) + 0.5));
            setSimVar('L:A32NX_LCD_MASK_OPACITY', opacity, 'number');
        }, [camXyz, zoomLevel]);
    } else {
        const [maskOpacity] = useSimVar('L:A32NX_LCD_MASK_OPACITY', 'number');
        useEffect(() => {
            setOpacity(maskOpacity);
        }, [maskOpacity]);
    }

    useEffect(() => {
        if (state === DisplayUnitState.On && (potentiometer === 0 || electricityState === 0)) {
            setState(DisplayUnitState.Standby);
            setTimer(10);
        } else if (state === DisplayUnitState.Standby && (potentiometer !== 0 && electricityState !== 0)) {
            setState(DisplayUnitState.On);
            setTimer(null);
        } else if (state === DisplayUnitState.Off && (potentiometer !== 0 && electricityState !== 0)) {
            setState(DisplayUnitState.Selftest);
            setTimer(NXDataStore.get<number>('CONFIG_SELF_TEST_TIME', 15));
        } else if (state === DisplayUnitState.Selftest && (potentiometer === 0 || electricityState === 0)) {
            setState(DisplayUnitState.Off);
            setTimer(null);
        }
    });

    if (state === DisplayUnitState.Selftest) {
        return (
            <>
                <div className="LcdOverlay" style={{ opacity }} />
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
    }
    return (
        <>
            <div className="LcdOverlay" style={{ opacity }} />
            <div style={{ display: state === DisplayUnitState.On ? 'block' : 'none' }}>{props.children}</div>
        </>
    );
};
