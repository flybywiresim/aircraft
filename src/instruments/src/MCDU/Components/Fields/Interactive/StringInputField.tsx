import React from 'react';
import { useMCDUDispatch, useMCDUSelector } from '../../../redux/hooks';
import * as scratchpadActions from '../../../redux/actions/scratchpadActionCreators';

import { useInteractionEvent } from '../../../../Common/hooks';

import { lineColors, lineSizes } from '../../Lines/Line';
import { LINESELECT_KEYS } from '../../Buttons';
import { fieldSides } from '../NonInteractive/Field';

type StringFieldProps = {
    value: string | undefined,
    nullValue: string,
    color: lineColors,
    side?: fieldSides,
    size: lineSizes,
    selectedCallback: (value: string | undefined) => any,
    selectedValidation: (value: string) => boolean,
    lsk: LINESELECT_KEYS,
}
const StringInputField: React.FC<StringFieldProps> = (
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
    const scratchpad = useMCDUSelector((state) => state.scratchpad);
    const dispatch = useMCDUDispatch();
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
        <span className={`${color} ${side} ${size}`}>{value === '' || value === undefined ? nullValue : value}</span>
    );
};
export default StringInputField;
