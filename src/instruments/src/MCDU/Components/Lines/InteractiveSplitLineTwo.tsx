import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { useInteractionEvent } from '../../../util';
import { scratchpadState } from '../../redux/reducers/scratchpadReducer';
import { LINESELECT_KEYS } from '../Buttons';
import { fieldSides } from '../Fields/NonInteractive/Field';
import { lineColors, lineSides, lineSizes } from './Line';
import * as scratchpadActions from '../../redux/actions/scratchpadActionCreators';

export type fieldProperties = {
    lNullValue: string,
    lSide: fieldSides,
    lColour: lineColors,
    lSize: lineSizes
    rNullValue: string,
    rSide: fieldSides,
    rColour: lineColors,
    rSize: lineSizes

}

type interactiveSplitLineTwoProps = {
    side: lineSides,
    slashColor: lineColors
    lsk: LINESELECT_KEYS,
    properties: fieldProperties

    autoCalc?: () => any,
    selectedCallback: (lvalue?: number | string, rvalue?: number | string) => any,
    selectedValidation: (lvalue: string, rvalue: string) => Boolean,

    // REDUX
    scratchpad: scratchpadState
    clearScratchpad: () => any
}
const InteractiveSplitLineVTwo: React.FC<interactiveSplitLineTwoProps> = (
    {
        selectedCallback,
        selectedValidation,
        lsk,
        autoCalc,
        slashColor,
        properties,
        side,

        // REDUX
        scratchpad,
        clearScratchpad,
    },
) => {
    const [leftValue, setLeftValue] = useState(properties.lNullValue);
    const [rightValue, setRightValue] = useState(properties.rNullValue);

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
            clearScratchpad();
        } else if (scratchpad.currentMessage === 'CLR') {
            setLeftValue(properties.lNullValue);
            setRightValue(properties.rNullValue);
            clearScratchpad();
        } else {
            const [lVal, rVal] = splitScratchpadValue();
            if (selectedValidation(lVal, rVal)) {
                selectedCallback(lVal, rVal);
                setLeftValue(lVal);
                setRightValue(rVal);
            }
            clearScratchpad();
        }
    });

    return (
        <p className={`line ${side}`}>
            <span className={`${properties.lColour} ${properties.lSide} ${properties.lSize}`}>{leftValue}</span>
            <span className={`${slashColor}`}>/</span>
            <span className={`${properties.rColour} ${properties.lSide} ${properties.rSize}`}>{rightValue}</span>
        </p>
    );
};
const mapStateToProps = ({ scratchpad }) => ({ scratchpad });
const mapDispatchToProps = (dispatch) => ({ clearScratchpad: bindActionCreators(scratchpadActions.clearScratchpad, dispatch) });
export default connect(mapStateToProps, mapDispatchToProps)(InteractiveSplitLineVTwo);
