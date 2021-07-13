import React from 'react';
import { connect } from 'react-redux';
import { scratchpadMessage, scratchpadState } from 'instruments/src/MCDU/redux/reducers/scratchpadRedcuer';
import { bindActionCreators } from 'redux';
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

    // REDUX
    scratchpad: scratchpadState,
    addMessage: (msg:scratchpadMessage) => any,
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
        scratchpad,
        addMessage,
    },
) => {
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
const mapStateToProps = ({ scratchpad }) => ({ scratchpad });
const mapDispatchToProps = (dispatch) => ({ addMessage: bindActionCreators(scratchpadActions.addNewMessage, dispatch) });
export default connect(mapStateToProps, mapDispatchToProps)(StringInputField);
