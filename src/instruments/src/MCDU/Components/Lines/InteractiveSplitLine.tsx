import React, { ReactElement, useState } from 'react';
import { lineSelectKeys } from '../Buttons';
import { useInteractionEvent } from '../../../Common/hooks';
import { lineColors } from './Line';

type InteractiveSplitLineProps = {
    leftSide: ReactElement,
    rightSide: ReactElement,
    lsk: lineSelectKeys,
    slashColor: lineColors
}

export const InteractiveSplitLine: React.FC<InteractiveSplitLineProps> = ({ leftSide, rightSide, lsk, slashColor }: { leftSide: any; rightSide: any; lsk: any }) => {
    const [leftValue, setLeftValue] = useState(() => {
        const { value } = leftSide.props;
        return value;
    });
    const [rightValue, setRightValue] = useState(() => {
        const { value } = rightSide.props;
        return value;
    });

    // TODO amend this to work with redux
    function splitScratchpadValue() {
        let [leftValue, rightValue] = 'scratchpad'.split('/');

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
        const [lVal, rVal] = splitScratchpadValue();
        setLeftValue(lVal);
        setRightValue(rVal);
    });

    return (
        <>
            <p className="line">
                {React.cloneElement(leftSide, { value: leftValue })}
                <span className={`${slashColor}`}>/</span>
                {React.cloneElement(rightSide, { value: rightValue })}
            </p>
        </>
    );
};
