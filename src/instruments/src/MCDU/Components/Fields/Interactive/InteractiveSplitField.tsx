import React, { useEffect, useState } from 'react';
import { useInteractionEvent } from '../../../../util';
import { LINESELECT_KEYS } from '../../Buttons';
import { fieldSides } from '../NonInteractive/Field';
import { lineColors, lineSides, lineSizes } from '../../Lines/LineProps';
import * as scratchpadActions from '../../../redux/actions/scratchpadActionCreators';
import '../../styles.scss';
import { useMCDUDispatch, useMCDUSelector } from '../../../redux/hooks';

export type fieldProperties = {
    /** the left side value */
    lValue: string | undefined,
    /** the left side placeholder value when lValue is undefined */
    lNullValue: string,
    /** Optional text alignment of the left side */
    lSide?: fieldSides,
    /** Color of the left side text */
    lColour: lineColors,
    /** Size of the left side text */
    lSize: lineSizes
    /** the left side value */
    rValue: string | undefined,
    /** the left side placeholder value when lValue is undefined */
    rNullValue: string,
    /** Optional text alignment of the left side */
    rSide?: fieldSides,
    /** Color of the left side text */
    rColour: lineColors,
    /** Size of the left side text */
    rSize: lineSizes
}

type InteractiveSplitFieldProps = {
    /** The side with which the align the field on */
    side: lineSides,
    /** The color of the slash in the field */
    slashColor: lineColors
    /** The LSK button the initiates events */
    lsk: LINESELECT_KEYS,
    /** The properties of the field containing each side of the field's info */
    properties: fieldProperties,

    /** An optional auto-calculation function that's called when the scratchpad is empty and LSK pressed, like ZFW/ZFWCG */
    autoCalc?: () => any,
    /** The callback function called when the scratchpad entry has been validated */
    selectedCallback: (lvalue: string, rvalue: string) => any,
    /** The callback function called to verify the scratchpad entry */
    selectedValidation: (lvalue: string, rvalue: string) => Boolean,
}

/**
 * A Field component used for fields with split data like '00.0/0000' with LSK interactivety
 * and scratchpad clearing on valid entry
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
    const [lVal, setLVal] = useState(properties.lValue);
    const [rVal, setRVal] = useState(properties.rValue);

    useEffect(() => {
        setLVal(properties.lValue);
        setRVal(properties.rValue);
    }, [properties.lValue, properties.rValue]);

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
