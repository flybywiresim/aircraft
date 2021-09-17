import React, { useEffect, useState } from 'react';
import { useMCDUDispatch, useMCDUSelector } from '../../../redux/hooks';
import * as scratchpadActions from '../../../redux/actions/scratchpadActionCreators';

import { useInteractionEvent } from '../../../../Common/hooks';

import { lineColors, lineSides, lineSizes } from '../../Lines/LineProps';
import { LINESELECT_KEYS } from '../../Buttons';
import { fieldSides } from '../NonInteractive/Field';

type StringFieldProps = {
    /** The default value of the field */
    defaultValue: string | undefined,
    /** The placeholder values used when the default value is undefined */
    nullValue: string,
    /** The color of the text in the field */
    color: lineColors,
    /** optional alignment of the text */
    fieldSide?: fieldSides,
    /** alignment of the field itself */
    lineSide: lineSides,
    /** Size of the text */
    size: lineSizes,
    /** callback function called when the number entry has been validated */
    selectedCallback: (value: string | undefined) => any,
    /** callback function called to verify the entry */
    selectedValidation: (value: string) => boolean,
    /** The LSK to be pressed */
    lsk: LINESELECT_KEYS,
}

/** LSK Interactive field for strings with automatic scratchpad clearing on valid entry */
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

    useEffect(() => setValue(defaultValue), [defaultValue]);

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
