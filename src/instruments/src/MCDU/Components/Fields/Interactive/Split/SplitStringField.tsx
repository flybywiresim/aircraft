import React, { useEffect } from 'react';
import { useMCDUDispatch } from '../../../../redux/hooks';
import { scratchpadMessage } from '../../../../redux/reducers/scratchpadReducer';
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
    },
) => {
    const dispatch = useMCDUDispatch();
    const addMessage = (msg: scratchpadMessage) => {
        dispatch(scratchpadActions.addScratchpadMessage(msg));
    };
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
export default SplitStringField;
