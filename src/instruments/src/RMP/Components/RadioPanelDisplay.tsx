/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import { useSimVar } from '../../Common/simVars';

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
    const [lightsTest] = useSimVar('L:XMLVAR_LTS_Test', 'Boolean', 1000);

    // If the passed value prop is a number, we'll use formatFrequency to get string format.
    const value = typeof props.value === 'number' ? formatFrequency(props.value) : props.value;

    return (
        <svg>
            <text x="100%" y="52%">
                {lightsTest ? '8.8.8.8.8.8' : value}
            </text>
        </svg>
    );
}
