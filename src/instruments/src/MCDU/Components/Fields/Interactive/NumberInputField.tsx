import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { scratchpadMessage, scratchpadState } from 'instruments/src/MCDU/redux/reducers/scratchpadReducer';
import * as scratchpadActions from '../../../redux/actions/scratchpadActionCreators';

import { useInteractionEvent } from '../../../../Common/hooks';

import { lineColors, lineSizes } from '../../Lines/Line';
import { LINESELECT_KEYS } from '../../Buttons';
import { fieldSides } from '../NonInteractive/Field';

type NumberFieldProps = {
    value: number | string | undefined,
    nullValue: string,
    min: number,
    max: number,
    color: lineColors,
    side?: fieldSides,
    size: lineSizes,
    selectedCallback: (value?: number) => any,
    lsk: LINESELECT_KEYS,

    // REDUX
    scratchpad: scratchpadState,
    addMessage: (msg:scratchpadMessage) => any,
}
const NumberInputField: React.FC<NumberFieldProps> = (
    {
        value,
        nullValue,
        min,
        max,
        color,
        side,
        size,
        selectedCallback,
        lsk,
        scratchpad,
        addMessage,
    },
) => {
    let numVal;
    if (typeof value === 'string') {
        numVal = value;
    } else if (typeof value === 'number') {
        numVal = value.toFixed(1);
    }

    useInteractionEvent(lsk, () => {
        if (scratchpad.currentMessage === 'CLR') {
            selectedCallback(undefined);
        } else {
            const newVal = parseFloat(scratchpad.currentMessage);
            if (!Number.isNaN(newVal)) {
                if (newVal >= min && newVal <= max) {
                    selectedCallback(newVal);
                } else {
                    addMessage({
                        text: 'ENTRY OUT OF RANGE',
                        isAmber: false,
                        isTypeTwo: false,
                    });
                }
            } else {
                addMessage({
                    text: 'FORMAT ERROR',
                    isAmber: false,
                    isTypeTwo: false,
                });
            }
        }
    });

    return (
        <span className={`${color} ${side} ${size}`}>{value === undefined ? nullValue : numVal}</span>
    );
};
const mapStateToProps = ({ scratchpad }) => ({ scratchpad });
const mapDispatchToProps = (dispatch) => ({ addMessage: bindActionCreators(scratchpadActions.addScratchpadMessage, dispatch) });
export default connect(mapStateToProps, mapDispatchToProps)(NumberInputField);
