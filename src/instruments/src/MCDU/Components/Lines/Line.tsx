import React, { ReactElement } from 'react';
import '../styles.scss';

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
}

// TODO add the callbacks in here from the fields
/**
 * A Line component that can handle split fields and single value fields. This is a composite component with which to
 * insert <span /> components into.
 * @param value Used for single value fields, ReactElement should return a <span />.
 * @param LeftSide Used for the left side of a split field, should return a <span />
 * @param RightSide Used for the right side of a split field, should return a <span />
 * @constructor
 */
export const Line: React.FC<LineProps> = ({ value, LeftSide, RightSide }) => {
    function handleSplitLine() {
        if (LeftSide && RightSide) {
            return (
                `${LeftSide}|${RightSide}`
            );
        }
        return value;
    }
    return (
        <>
            <p className="line">
                {handleSplitLine()}
            </p>
        </>
    );
};
