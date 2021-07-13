import React, { useEffect } from 'react';
import { lineColors, lineSizes } from '../../../Lines/Line';
import { fieldSides } from '../../NonInteractive/Field';

type SplitStringFieldProps = {
    value: string | undefined,
    nullValue: string,
    color: lineColors,
    side?: fieldSides,
    size: lineSizes,
    selectedCallback: (value: string) => any,
    selectedValidation: (value: string) => boolean,
}

export const SplitStringField : React.FC<SplitStringFieldProps> = (
    {
        value,
        nullValue,
        size,
        color,
        side,
        selectedCallback,
        selectedValidation,
    },
) => {
    useEffect(() => {
        if (value) {
            if (selectedValidation(value)) {
                selectedCallback(value);
            } else {
                // setScratchpad('FORMAT ERROR'); TODO
            }
        }
    }, [value]);
    return (
        <span className={`${color} ${side} ${size}`}>{value === undefined ? nullValue : value}</span>
    );
};
