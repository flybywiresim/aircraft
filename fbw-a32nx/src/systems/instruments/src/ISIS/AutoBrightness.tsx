import React, { useEffect, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { useInteractionEvent } from '@instruments/common/hooks';
import useInterval from '@instruments/common/useInterval';
import { MathUtils } from '@shared/MathUtils';

type AutoBrightnessProps = {
    bugsActive: boolean
}

export const AutoBrightness: React.FC<AutoBrightnessProps> = ({ bugsActive, children }) => {
    const minBrightness = 0.15;
    const maxBrightness = 0.99;
    const dayBrightness = 0.85;
    const nightBrightness = 0.25;
    const brightnessGranularity = 0.05;

    const [rawAutoBrightness] = useSimVar('GLASSCOCKPIT AUTOMATIC BRIGHTNESS', 'number', 1000);
    const [autoBrightness, setAutoBrightness] = useState(0.5);
    const [manualOffset, setManualOffset] = useState(0);
    const [targetBrightness, setTargetBrightness] = useState(0.5);

    const [plusHeld, setPlusHeld] = useState(false);
    const [minusHeld, setMinusHeld] = useState(false);

    useInteractionEvent('A32NX_ISIS_PLUS_PRESSED', () => !bugsActive && setPlusHeld(true));

    useInteractionEvent('A32NX_ISIS_PLUS_RELEASED', () => setPlusHeld(false));

    useInteractionEvent('A32NX_ISIS_MINUS_PRESSED', () => !bugsActive && setMinusHeld(true));

    useInteractionEvent('A32NX_ISIS_MINUS_RELEASED', () => setMinusHeld(false));

    useInterval(() => {
        if (!bugsActive && plusHeld) {
            setManualOffset(MathUtils.clamp(manualOffset + brightnessGranularity, minBrightness - autoBrightness, maxBrightness - autoBrightness));
        } else if (!bugsActive && minusHeld) {
            setManualOffset(MathUtils.clamp(manualOffset - brightnessGranularity, minBrightness - autoBrightness, maxBrightness - autoBrightness));
        }
    }, plusHeld || minusHeld ? 150 : null,
    { runOnStart: true, additionalDeps: [plusHeld, minusHeld] });

    useEffect(() => {
        setAutoBrightness(Avionics.Utils.lerpAngle(nightBrightness, dayBrightness, Math.max(0, autoBrightness - 0.15 / 0.85)));
        setManualOffset(MathUtils.clamp(manualOffset, minBrightness - autoBrightness, maxBrightness - autoBrightness));
    }, [rawAutoBrightness]);

    useEffect(() => {
        setTargetBrightness(MathUtils.clamp(autoBrightness + manualOffset, minBrightness, maxBrightness));
    }, [autoBrightness, manualOffset]);

    return (
        <g>
            <svg
                style={{
                    position: 'absolute',
                    top: '0%',
                    left: '0%',
                    width: '100%',
                    height: '100%',
                    backgroundColor: `rgba(0,0,0, ${1 - targetBrightness})`,
                    zIndex: 3,
                }}
                viewBox="0 0 512 512"
            />
            {children}
        </g>
    );
};
