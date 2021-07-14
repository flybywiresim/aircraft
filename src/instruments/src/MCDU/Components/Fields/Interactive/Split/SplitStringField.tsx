import { scratchpadMessage } from 'instruments/src/MCDU/redux/reducers/scratchpadReducer';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as scratchpadActions from '../../../../redux/actions/scratchpadActionCreators';

import { lineColors, lineSizes } from '../../../Lines/Line';
import { fieldSides } from '../../NonInteractive/Field';

type SplitStringFieldProps = {
    value: string | undefined,
    nullValue: string,
    color: lineColors,
    side?: fieldSides,
    size: lineSizes,
    selectedCallback: (value?: string) => any,
    selectedValidation: (value: string) => boolean,

    // REDUX
    addMessage : (msg: scratchpadMessage) => any,
}

const SplitStringField : React.FC<SplitStringFieldProps> = (
    {
        value,
        nullValue,
        size,
        color,
        side,
        selectedCallback,
        selectedValidation,
        addMessage,
    },
) => {
    useEffect(() => {
        if (value) {
            if (value === 'CLR') {
                selectedCallback('');
            } else if (selectedValidation(value)) {
                selectedCallback(value);
            } else {
                addMessage({
                    text: 'FORMAT ERROR',
                    isAmber: false,
                    isTypeTwo: false,
                });
            }
        }
    }, [value]);
    return (
        <span className={`${color} ${side} ${size}`}>{value === undefined ? nullValue : value}</span>
    );
};
const mapDispatchToProps = (dispatch) => ({ addMessage: bindActionCreators(scratchpadActions.addScratchpadMessage, dispatch) });
export default connect(null, mapDispatchToProps)(SplitStringField);
