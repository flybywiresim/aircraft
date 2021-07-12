import React from 'react';
import { lineColors, lineSizes } from '../../Lines/Line';
import { lineSelectKeys } from '../../Buttons';
import { useInteractionEvent } from '../../../../Common/hooks';
import { fieldSides } from '../NonInteractive/Field';

type StringFieldProps = {
    value: string | undefined,
    nullValue: string,
    color: lineColors,
    side?: fieldSides,
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
    const [scratchpad, _] = ['TODO', 'TODO'];

    useInteractionEvent(lsk, () => {
        if (selectedValidation) {
            if (selectedValidation(scratchpad)) {
                selectedCallback(scratchpad);
            } else {
                // setScratchpad('FORMAT ERROR'); TODO
            }
        }
    });

    return (
        <span className={`${color} ${side} ${size}`}>{value === '' || value === undefined ? nullValue : value}</span>
    );
};
