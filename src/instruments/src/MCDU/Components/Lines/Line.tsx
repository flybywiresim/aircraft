import React, { ReactElement, useContext } from 'react';
import '../styles.scss';
import { RootContext } from '../../RootContext';
import { lineSelectKeys } from '../Buttons';
import { useInteractionEvent } from '../../../Common/hooks';

export enum lineSides {
    left = 'line-left',
    right = 'line-right',
    center = 'line-center'
}

export enum lineSizes {
    small = 's-text',
    regular = '',
}

export enum lineColors {
    white = 'white',
    inop = 'inop',
    cyan = 'cyan',
    yellow = 'yellow',
    green = 'green',
    amber = 'amber',
    red = 'red',
    magenta = 'magenta'
}

type LineProps = {
    value?: ReactElement,
    LeftSide?: ReactElement,
    RightSide?: ReactElement,
    lsk?: lineSelectKeys,
}

// TODO add the callbacks in here from the fields
/**
 * A Line component that can handle split fields and single value fields. This is a composite component with which to
 * insert <span /> components into.
 * @param value Used for single value fields, ReactElement should return a <span />.
 * @param LeftSide Used for the left side of a split field, should return a <span />
 * @param RightSide Used for the right side of a split field, should return a <span />
 * @param lsk Line select key, used for split fields
 * @constructor
 */
export const Line: React.FC<LineProps> = ({ lsk, value, LeftSide, RightSide }) => {
    const [scratchpad, , , ] = useContext(RootContext); // eslint-disable-line array-bracket-spacing
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

    function handleSplitLine() {
        let returnVal = value;
        if (LeftSide && RightSide) {
            if (lsk) {
                useInteractionEvent(lsk, () => {
                    const [leftValue, rightValue] = splitScratchpadValue();
                    if (!leftValue) {
                        returnVal = (
                            <>
                                {React.cloneElement(LeftSide, { value: leftValue })}
                                /
                                {RightSide}
                            </>
                        );
                    } else if (!rightValue) {
                        returnVal = (
                            <>
                                {LeftSide}
                                /
                                {React.cloneElement(RightSide, { value: rightValue })}
                            </>
                        );
                    } else {
                        returnVal = (
                            <>
                                {React.cloneElement(LeftSide, { value: leftValue })}
                                /
                                {React.cloneElement(RightSide, { value: rightValue })}
                            </>
                        );
                    }
                });
            } else {
                returnVal = (
                    <>
                        {LeftSide}
                        |
                        {RightSide}
                    </>
                );
            }
        }
        return returnVal;
    }

    return (
        <>
            <p className="line">
                {handleSplitLine()}
            </p>
        </>
    );
};
