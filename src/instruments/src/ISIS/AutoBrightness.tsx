import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { useInteractionEvent } from '@instruments/common/hooks';

const useInterval = (callback: () => void, delay: number | null) => {
    const savedCallback = useRef<() => void>(() => { });

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        if (delay !== null) {
            const id = setInterval(() => savedCallback.current(), delay);
            return () => clearInterval(id);
        }

        return () => { };
    }, [delay]);
};

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

    const [isBrightnessUpPressed, setIsBrightnessUpPressed] = useState(false);
    const [isBrightnessDownPressed, setIsBrightnessDownPressed] = useState(false);

    useInteractionEvent('A32NX_ISIS_PLUS_PRESSED', () => {
        if (bugsActive) {
            return;
        }

        setIsBrightnessUpPressed(!isBrightnessUpPressed);
        if (!isBrightnessUpPressed || currentBrightness >= maxBrightness) {
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

        setIsBrightnessDownPressed(!isBrightnessUpPressed);
        if (!isBrightnessDownPressed || currentBrightness <= minBrightness) {
            return;
        }

        const newBrightness = Math.min(maxBrightness, currentBrightness - brightnessGranularity);
        setTargetBrightness(newBrightness);
        setCurrentBrightness(newBrightness);
    });

    useEffect(() => {
        const newIsDaytime = timeOfDay === 1 || timeOfDay === 2;

        if (newIsDaytime !== isDaytimeRef.current) {
            isDaytimeRef.current = newIsDaytime;

            const newTargetBrightness = targetBrightness - (nightBrightness - dayBrightness) * (newIsDaytime ? 1 : -1);
            setTargetBrightness(Math.max(minBrightness, Math.min(maxBrightness, newTargetBrightness)));
        }
    }, [timeOfDay]);

    useInterval(useCallback(
        () => setCurrentBrightness(targetBrightness > currentBrightness
            ? Math.min(currentBrightness + transitionSpeedModifier, targetBrightness)
            : Math.max(currentBrightness - transitionSpeedModifier, targetBrightness)),
        [currentBrightness, targetBrightness],
    ),
    targetBrightness === currentBrightness ? null : 150);

    return (
        <g style={{ opacity: currentBrightness }}>
            {children}
        </g>
    );
};
