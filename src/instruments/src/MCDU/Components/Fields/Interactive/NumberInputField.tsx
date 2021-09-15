import React, { useEffect, useState } from 'react';
import { ScratchpadMessage } from '@fmgc/lib/ScratchpadMessage';
import { NXSystemMessages } from '@fmgc/lib/NXSystemMessages';
import { useMCDUDispatch, useMCDUSelector } from '../../../redux/hooks';
import * as scratchpadActions from '../../../redux/actions/scratchpadActionCreators';

import { useInteractionEvent } from '../../../../Common/hooks';

import { lineColors, lineSides, lineSizes } from '../../Lines/LineProps';
import { LINESELECT_KEYS } from '../../Buttons';
import { fieldSides } from '../NonInteractive/Field';

type NumberFieldProps = {
    defaultValue: string | undefined,
    nullValue: string,
    min: number,
    max: number,
    color: lineColors,
    fieldSide?: fieldSides,
    lineSide: lineSides
    size: lineSizes,
    selectedCallback: (value?: string) => any,
    lsk: LINESELECT_KEYS,
    prevEntered?: boolean,
}
const NumberInputField: React.FC<NumberFieldProps> = (
    {
        defaultValue,
        nullValue,
        min,
        max,
        color,
        fieldSide,
        size,
        selectedCallback,
        lsk,
        prevEntered,
        lineSide,
    },
) => {
    const scratchpad = useMCDUSelector((state) => state.scratchpad);
    const [value, setValue] = useState<string | undefined>(defaultValue);
    const dispatch = useMCDUDispatch();
    const addMessage = (msg: ScratchpadMessage) => {
        dispatch(scratchpadActions.addScratchpadMessage(msg));
    };
    const clearScratchpad = () => {
        dispatch(scratchpadActions.clearScratchpad());
    };

    useEffect(() => setValue(defaultValue), [defaultValue]);

    const valueIsInRange = (val: number) => min <= val && val <= max;
    const validateEntry = (val: string) => {
        if (prevEntered !== undefined && !prevEntered) {
            addMessage(NXSystemMessages.notAllowed);
            return false;
        }
        const newVal = parseFloat(val);
        if (Number.isFinite(newVal)) {
            if (valueIsInRange(newVal)) {
                return true;
            }
            addMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }
        addMessage(NXSystemMessages.formatError);
        return false;
    };

    useInteractionEvent(lsk, () => {
        if (scratchpad.currentMessage === 'CLR') {
            selectedCallback(undefined);
        } else {
            const newVal = parseFloat(scratchpad.currentMessage);
            if (validateEntry(scratchpad.currentMessage)) {
                selectedCallback(newVal.toFixed(1));
                clearScratchpad();
            }
        }
    });

    return (
        <p className={lineSide}>
            <span className={`${color} ${fieldSide} ${size}`}>{value ?? nullValue}</span>
        </p>
    );
};
export default NumberInputField;
