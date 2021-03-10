import React, { useContext } from 'react';
import { lineColors, lineSides, lineSizes } from '../../Lines/Line';
import { lineSelectKeys } from '../../Buttons';
import { useInteractionEvent } from '../../../../Common/hooks';
import { RootContext } from '../../../RootContext';

type StringFieldProps = {
    value: string | undefined,
    nullValue: string,
    color: lineColors,
    side: lineSides,
    size: lineSizes,
    selectedCallback: (value: string) => any,
    selectedValidation: (value: string) => boolean,
    lsk: lineSelectKeys
}
export const StringInputField: React.FC<StringFieldProps> = (
    {
        value,
        nullValue,
        color,
        side,
        size,
        selectedCallback,
        selectedValidation,
        lsk,
    },
) => {
    const [scratchpad, setScratchpad, , ] = useContext(RootContext); // eslint-disable-line array-bracket-spacing

    useInteractionEvent(lsk, () => {
        if (selectedValidation) {
            if (selectedValidation(scratchpad)) {
                selectedCallback(scratchpad);
            } else {
                setScratchpad('FORMAT ERROR');
            }
        }
    });

    return (
        <span className={`${color} ${side} ${size}`}>{value === '' || value === undefined ? nullValue : value}</span>
    );
};
