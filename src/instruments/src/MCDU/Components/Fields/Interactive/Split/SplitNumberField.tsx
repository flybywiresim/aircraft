import React, { useEffect } from 'react';
import { lineColors, lineSizes } from '../../../Lines/Line';
import { fieldSides } from '../../NonInteractive/Field';

type SplitNumberFieldProps = {
    value: number | undefined,
    nullValue: string,
    min: number,
    max: number,
    color: lineColors,
    side?: fieldSides,
    size: lineSizes,
    selectedCallback: (value: number) => any,
}

export const SplitNumberField : React.FC<SplitNumberFieldProps> = (
    {
        value,
        nullValue,
        min,
        max,
        size,
        color,
        side,
        selectedCallback,
    },
) => {
    const [_] = ['TODO'];

    useEffect(() => {
        if (value) {
            if (!Number.isNaN(value)) {
                if (value >= min && value <= max) {
                    selectedCallback(value);
                } else {
                    // setScratchpad('ENTRY OUT OF RANGE'); TODO
                }
            } else {
                // setScratchpad('FORMAT ERROR'); TODO
            }
        }
    }, [value]);
    return (
        <span className={`${color} ${side} ${size}`}>{value === undefined ? nullValue : value}</span>
    );
};
