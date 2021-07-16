import React, { useEffect } from 'react';
import { useMCDUDispatch } from '../../../../redux/hooks';
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
    },
) => {
    const dispatch = useMCDUDispatch();
    const addMessage = (msg: scratchpadMessage) => {
        dispatch(scratchpadActions.addScratchpadMessage(msg));
    };
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
export default SplitNumberField;
