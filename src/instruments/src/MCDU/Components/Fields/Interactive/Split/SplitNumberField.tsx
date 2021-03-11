import React, { useContext, useEffect } from 'react';
import { lineColors, lineSizes } from '../../../Lines/Line';
import { RootContext } from '../../../../RootContext';
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
    const [, setScratchpad, , ] = useContext(RootContext); // eslint-disable-line array-bracket-spacing

    useEffect(() => {
        if (value) {
            if (!Number.isNaN(value)) {
                if (value >= min && value <= max) {
                    selectedCallback(value);
                } else {
                    setScratchpad('ENTRY OUT OF RANGE');
                }
            } else {
                setScratchpad('FORMAT ERROR');
            }
        }
    }, [value]);
    return (
        <span className={`${color} ${side} ${size}`}>{value === undefined ? nullValue : value}</span>
    );
};
