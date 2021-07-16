import React, { ReactElement, useState } from 'react';
import { useInteractionEvent } from '../../../Common/hooks';

import { LINESELECT_KEYS } from '../Buttons';
import { lineColors } from './Line';
import { useMCDUSelector } from '../../redux/hooks';

type InteractiveSplitLineProps = {
    leftSide: ReactElement,
    rightSide: ReactElement,
    lsk: LINESELECT_KEYS,
    slashColor: lineColors,
    autoCalc?: () => any,
}
/**
 * @deprecated A new version has been created
 */
const InteractiveSplitLine: React.FC<InteractiveSplitLineProps> = (
    { leftSide, rightSide, lsk, slashColor, autoCalc },
) => {
    const scratchpad = useMCDUSelector((state) => state.scratchpad);
    const [leftValue, setLeftValue] = useState(() => {
        const { value } = leftSide.props;
        return value;
    });
    const [rightValue, setRightValue] = useState(() => {
        const { value } = rightSide.props;
        return value;
    });

    const slash = '/';

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
        } else {
            const [lVal, rVal] = splitScratchpadValue();
            setLeftValue(lVal);
            setRightValue(rVal);
        }
    });

    return (
        <>
            <p className="line">
                {React.cloneElement(leftSide, { value: leftValue })}
                <span className={`${slashColor}`}>{slash}</span>
                {React.cloneElement(rightSide, { value: rightValue })}
            </p>
        </>
    );
};

export default InteractiveSplitLine;
