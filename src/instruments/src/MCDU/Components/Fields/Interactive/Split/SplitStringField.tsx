import React, { useContext, useEffect } from 'react';
import { lineColors, lineSizes } from '../../../Lines/Line';
import { RootContext } from '../../../../RootContext';
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
    const [, setScratchpad, , ] = useContext(RootContext); // eslint-disable-line array-bracket-spacing

    useEffect(() => {
        if (value) {
            if (selectedValidation(value)) {
                selectedCallback(value);
            } else {
                setScratchpad('FORMAT ERROR');
            }
        }
    }, [value]);
    return (
        <span className={`${color} ${side} ${size}`}>{value === undefined ? nullValue : value}</span>
    );
};
