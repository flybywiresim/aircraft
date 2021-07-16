import React from 'react';
import { useMCDUDispatch, useMCDUSelector } from '../../../redux/hooks';
import { scratchpadMessage } from '../../../redux/reducers/scratchpadReducer';
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
    selectedCallback: (value?: string) => any,
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
    const addMessage = (msg: scratchpadMessage) => {
        dispatch(scratchpadActions.addScratchpadMessage(msg));
    };
    useInteractionEvent(lsk, () => {
        if (scratchpad.currentMessage === 'CLR') {
            selectedCallback('');
        } else if (selectedValidation) {
            if (selectedValidation(scratchpad.currentMessage)) {
                selectedCallback(scratchpad.currentMessage);
            } else {
                addMessage({
                    text: 'FORMAT ERROR',
                    isAmber: false,
                    isTypeTwo: false,
                });
            }
        } else {
            console.error('No Validation provided');
        }
    });

    return (
        <span className={`${color} ${side} ${size}`}>{value === '' || value === undefined ? nullValue : value}</span>
    );
};
export default StringInputField;
