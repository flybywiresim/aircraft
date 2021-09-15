import React, { useEffect, useState } from 'react';
import { useMCDUDispatch, useMCDUSelector } from '../../../redux/hooks';
import * as scratchpadActions from '../../../redux/actions/scratchpadActionCreators';

import { useInteractionEvent } from '../../../../Common/hooks';

import { lineColors, lineSides, lineSizes } from '../../Lines/LineProps';
import { LINESELECT_KEYS } from '../../Buttons';
import { fieldSides } from '../NonInteractive/Field';

type StringFieldProps = {
    defaultValue: string | undefined,
    nullValue: string,
    color: lineColors,
    fieldSide?: fieldSides,
    lineSide: lineSides,
    size: lineSizes,
    selectedCallback: (value: string | undefined) => any,
    selectedValidation: (value: string) => boolean,
    lsk: LINESELECT_KEYS,
}
const StringInputField: React.FC<StringFieldProps> = (
    {
        nullValue,
        defaultValue,
        color,
        fieldSide,
        lineSide,
        size,
        selectedCallback,
        selectedValidation,
        lsk,
    },
) => {
    const [value, setValue] = useState<string | undefined>(defaultValue);
    const scratchpad = useMCDUSelector((state) => state.scratchpad);
    const dispatch = useMCDUDispatch();

    useEffect(() => setValue(defaultValue), [defaultValue])

    const clearScratchpad = () => {
        dispatch(scratchpadActions.clearScratchpad());
    };
    useInteractionEvent(lsk, () => {
        const newVal = scratchpad.currentMessage;
        if (newVal === 'CLR') {
            selectedCallback(undefined);
        } else if (selectedValidation(newVal)) {
            selectedCallback(newVal);
            clearScratchpad();
        }
    });

    return (
        <p className={lineSide}>
            <span className={`${color} ${fieldSide} ${size}`}>{value ?? nullValue}</span>
        </p>
    );
};
export default StringInputField;
