import React, { useEffect, useRef, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { useInteractionEvent } from '@instruments/common/hooks';
import useInterval from '@instruments/common/useInterval';

type AutoBrightnessProps = {
    bugsActive: boolean
}

export const AutoBrightness: React.FC<AutoBrightnessProps> = ({ bugsActive, children }) => {
    const minBrightness = 0.15;
    const maxBrightness = 0.99;
    const dayBrightness = 0.85;
    const nightBrightness = 0.50;
    const brightnessGranularity = 0.05;
    const transitionSpeedModifier = 0.01;

    const [timeOfDay] = useSimVar('E:TIME OF DAY', 'enum', 10000);
    const isDaytimeRef = useRef(timeOfDay === 1 || timeOfDay === 2);

    const [targetBrightness, setTargetBrightness] = useState(isDaytimeRef.current ? dayBrightness : nightBrightness);
    const [currentBrightness, setCurrentBrightness] = useSimVar('L:A32NX_BARO_BRIGHTNESS', 'number', 10000);

    const isBrightnessUpPressed = useRef(false);
    const isBrightnessDownPressed = useRef(false);

    useInteractionEvent('A32NX_ISIS_PLUS_PRESSED', () => {
        if (bugsActive) {
            return;
        }

        isBrightnessUpPressed.current = !isBrightnessUpPressed.current;
        if (!isBrightnessUpPressed.current) {
            return;
        }

        const newBrightness = Math.min(maxBrightness, currentBrightness + brightnessGranularity);
        setTargetBrightness(newBrightness);
        setCurrentBrightness(newBrightness);
    });

    useInteractionEvent('A32NX_ISIS_MINUS_PRESSED', () => {
        if (bugsActive) {
            return;
        }

        isBrightnessDownPressed.current = !isBrightnessDownPressed.current;
        if (!isBrightnessDownPressed.current) {
            return;
        }

        const newBrightness = Math.max(minBrightness, currentBrightness - brightnessGranularity);
        setTargetBrightness(newBrightness);
        setCurrentBrightness(newBrightness);
    });

    useInterval(() => {
        if (isBrightnessUpPressed.current && currentBrightness < maxBrightness) {
            const newBrightness = Math.min(maxBrightness, currentBrightness + brightnessGranularity);

            setTargetBrightness(newBrightness);
            setCurrentBrightness(newBrightness);
        } else if (isBrightnessDownPressed.current && currentBrightness > minBrightness) {
            const newBrightness = Math.max(minBrightness, currentBrightness - brightnessGranularity);

            setTargetBrightness(newBrightness);
            setCurrentBrightness(newBrightness);
        }
    }, isBrightnessUpPressed.current || isBrightnessDownPressed.current ? 150 : null,
    { runOnStart: false, additionalDeps: [isBrightnessDownPressed.current, isBrightnessUpPressed.current] });

    useEffect(() => {
        const newIsDaytime = timeOfDay === 1 || timeOfDay === 2;

        if (newIsDaytime !== isDaytimeRef.current) {
            isDaytimeRef.current = newIsDaytime;

            const newTargetBrightness = targetBrightness - (nightBrightness - dayBrightness) * (newIsDaytime ? 1 : -1);
            setTargetBrightness(Math.max(minBrightness, Math.min(maxBrightness, newTargetBrightness)));
        }
    }, [timeOfDay]);

    useInterval(
        () => setCurrentBrightness(targetBrightness > currentBrightness
            ? Math.min(currentBrightness + transitionSpeedModifier, targetBrightness)
            : Math.max(currentBrightness - transitionSpeedModifier, targetBrightness)),
        targetBrightness === currentBrightness ? null : 150,
        { additionalDeps: [currentBrightness, targetBrightness], runOnStart: false },
    );

    return (
        <g>
            <svg
                style={{
                    position: 'absolute',
                    top: '0%',
                    left: '0%',
                    width: '100%',
                    height: '100%',
                    backgroundColor: `rgba(0,0,0, ${1 - currentBrightness})`,
                    zIndex: 3,
                }}
                viewBox="0 0 512 512"
            />
            {children}
        </g>
    );
};
