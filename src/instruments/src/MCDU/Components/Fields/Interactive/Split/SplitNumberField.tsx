import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { scratchpadMessage } from '../../../../redux/reducers/scratchpadReducer';
import * as scratchpadActions from '../../../../redux/actions/scratchpadActionCreators';

import { lineColors, lineSizes } from '../../../Lines/Line';
import { fieldSides } from '../../NonInteractive/Field';

type SplitNumberFieldProps = {
    value: string | number | undefined,
    nullValue: string,
    min: number,
    max: number,
    color: lineColors,
    side?: fieldSides,
    size: lineSizes,
    selectedCallback: (value?: number | string) => any,
    autoCalc? : () => any,

    // REDUX
    addMessage : (msg: scratchpadMessage) => any,
}

const SplitNumberField : React.FC<SplitNumberFieldProps> = (
    {
        value,
        nullValue,
        min,
        max,
        size,
        color,
        side,
        selectedCallback,

        // REDUX
        addMessage,
    },
) => {
    useEffect(() => {
        if (value) {
            console.log(`splitNumFieldValue: ${value}`);
            if (value === 'CLR') {
                selectedCallback(undefined);
            } else if (!Number.isNaN(value)) {
                if (value >= min && value <= max) {
                    selectedCallback(value);
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
    }, [value]);
    return (
        <span className={`${color} ${side} ${size}`}>{value === undefined ? nullValue : value}</span>
    );
};
const mapDispatchToProps = (dispatch) => ({ addMessage: bindActionCreators(scratchpadActions.addScratchpadMessage, dispatch) });
export default connect(null, mapDispatchToProps)(SplitNumberField);
