import React from 'react';
import { useSimVar } from '../../Common/simVars';

interface Props {
    /**
     * The value to display.
     */
    value: number | string,
}

const TEXT_DATA_MODE_VHF3 = 'DATA';

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

    let content: JSX.Element;

    if (lightsTest === 0) {
        content = (
            <text x="100%" y="52%">
                8.8.8.8.8.8
            </text>
        );
    } else if (props.value > 0) {
        let value = '';
        // If the passed value prop is a number, we'll use formatFrequency to get string format.
        if (typeof props.value === 'number') {
            value = formatFrequency(props.value);
        } else {
            value = props.value;
        }

        content = (
            <text x="100%" y="52%">
                {value}
            </text>
        );
    } else {
        content = (
            <text x="85%" y="52%">
                {TEXT_DATA_MODE_VHF3}
            </text>
        );
    }

    return (
        <svg className="rmp-svg">
            {content}
        </svg>
    );
}
