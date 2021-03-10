import React, { ReactElement, useContext, useState } from 'react';
import { lineSelectKeys } from '../Buttons';
import { RootContext } from '../../RootContext';
import { useInteractionEvent } from '../../../Common/hooks';

type SplitLineProps = {
    leftSide: ReactElement,
    rightSide: ReactElement,
    lsk: lineSelectKeys,
}

export const SplitLine: React.FC<SplitLineProps> = ({ leftSide, rightSide, lsk }) => {
    const [scratchpad, , , ] = useContext(RootContext); // eslint-disable-line array-bracket-spacing
    const [leftValue, setLeftValue] = useState(() => {
        const { value } = leftSide.props;
        return value;
    });
    const [rightValue, setRightValue] = useState(() => {
        const { value } = rightSide.props;
        return value;
    });

    function splitScratchpadValue() {
        let [leftValue, rightValue] = scratchpad.split('/');

        if (leftValue.length <= 0) {
            leftValue = undefined;
        }
        if (rightValue) {
            if (rightValue.length <= 0) {
                rightValue = undefined;
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
                /
                {React.cloneElement(rightSide, { value: rightValue })}
            </p>
        </>
    );
};
