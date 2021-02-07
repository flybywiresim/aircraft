import React from "react";
import { useSimVar } from '../../Common/SimVarProvider';

/**
 *
 */
interface Props {
    value: number | string,
};

/**
 * Format the given frequency to be displayed.
 */
const formatFrequency = (frequency: number): string => {
    return (frequency / 1000000).toFixed(3).padEnd(7, '0');
}

/**
 *
 */
export function RadioPanelDisplay(props: Props) {
    const [lightsTest] = useSimVar('L:XMLVAR_LTS_Test', 'Boolean', 175);

    // If the passed value prop is a number, we'll use formatFrequency to get string format.
    const value = typeof props.value === 'number' ? formatFrequency(props.value): props.value;

    return (
        <svg>
            <text x="100%" y="60%">
                {lightsTest ? 888.888 : value}
            </text>
        </svg>
    );
}
