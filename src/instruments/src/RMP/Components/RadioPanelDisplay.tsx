import React from 'react';
import { useSimVar } from '@instruments/common/simVars';

interface Props {
    /**
     * The value to display.
     */
    value: number | string,
}

/**
 * Format the given frequency to be displayed.
 * @param frequency The given frequency number in Hz.
 * @returns The formated frequency string in 123.456
 */
const formatFrequency = (frequency: number): string => (frequency / 1000000).toFixed(3).padEnd(7, '0');

/**
 * Radio management panel seven-segment frequency/course display.
 * Hooks into lightsTest SimVar to show 888.888 when test is ON.
 * Renders the seven-segment display with the appropriate value.
 */
export function RadioPanelDisplay(props: Props) {
    const [lightsTest] = useSimVar('L:A32NX_OVHD_INTLT_ANN', 'Boolean', 1000);

    // If the passed value prop is a number, we'll use formatFrequency to get string format.
    const value = typeof props.value === 'number' ? formatFrequency(props.value) : props.value;

    return (
        <svg className="rmp-svg">
            <text x="100%" y="52%">
                {lightsTest === 0 ? '8.8.8.8.8.8' : value}
            </text>
        </svg>
    );
}
