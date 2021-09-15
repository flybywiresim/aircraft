import React, { useEffect, useState } from 'react';
import { useInteractionEvent } from '../../../../util';
import { LINESELECT_KEYS } from '../../Buttons';
import { fieldSides } from '../NonInteractive/Field';
import { lineColors, lineSides, lineSizes } from '../../Lines/LineProps';
import * as scratchpadActions from '../../../redux/actions/scratchpadActionCreators';
import '../../styles.scss';
import { useMCDUDispatch, useMCDUSelector } from '../../../redux/hooks';

export type fieldProperties = {
    lValue: string | undefined,
    lNullValue: string,
    lSide?: fieldSides,
    lColour: lineColors,
    lSize: lineSizes
    rValue: string | undefined,
    rNullValue: string,
    rSide?: fieldSides,
    rColour: lineColors,
    rSize: lineSizes

}

type InteractiveSplitFieldProps = {
    side: lineSides,
    slashColor: lineColors
    lsk: LINESELECT_KEYS,
    properties: fieldProperties,

    autoCalc?: () => any,
    selectedCallback: (lvalue: string, rvalue: string) => any,
    selectedValidation: (lvalue: string, rvalue: string) => Boolean,
}
/**
 * Interactive Split line v2.0
 */
const InteractiveSplitField: React.FC<InteractiveSplitFieldProps> = (
    {
        selectedCallback,
        selectedValidation,
        lsk,
        autoCalc,
        slashColor,
        properties,
        side,
    },
) => {
    const scratchpad = useMCDUSelector((state) => state.scratchpad);
    const dispatch = useMCDUDispatch();
    const [lVal, setLVal] = useState(properties.lValue)
    const [rVal, setRVal] = useState(properties.rValue)

    useEffect(() => {
        setLVal(properties.lValue)
        setRVal(properties.rValue)
    }, [properties.lValue, properties.rValue])

    const clearScratchpad = () => {
        dispatch(scratchpadActions.clearScratchpad());
    };
    function splitScratchpadValue() {
        let [leftValue, rightValue] = scratchpad.currentMessage.split('/');

        if (leftValue.length <= 0) {
            leftValue = '';
        }
        if (rightValue) {
            if (rightValue.length <= 0) {
                rightValue = '';
            }
        }
        return [leftValue, rightValue];
    }

    useInteractionEvent(lsk, () => {
        if (scratchpad.currentMessage === '' && autoCalc) {
            autoCalc();
        } else if (scratchpad.currentMessage === 'CLR') {
            selectedCallback('', '');
        } else {
            const [lVal, rVal] = splitScratchpadValue();
            if (selectedValidation(lVal, rVal)) {
                selectedCallback(lVal, rVal);
                clearScratchpad();
            }
        }
    });

    return (
        <p className={`line ${side}`}>
            <span className={`${properties.lColour} ${properties.lSide} ${properties.lSize}`}>{lVal ?? properties.lNullValue}</span>
            <span className={`${slashColor}`}>/</span>
            <span className={`${properties.rColour} ${properties.rSide} ${properties.rSize}`}>{rVal ?? properties.rNullValue}</span>
        </p>
    );
};
export default InteractiveSplitField;
