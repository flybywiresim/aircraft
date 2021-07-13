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

export enum lineArrow {
    left = '{',
    right = '}',
    both = '{}',
    none = ''
}

type LineProps = {
    value?: ReactElement
    side: lineSides
}

/**
 * A Line component that can handle split fields and single value fields. This is a composite component with which to
 * insert <span /> components into.
 * @param value Used for single value fields, ReactElement should return a <span />.
 * @param side used to define the alignment of the line, left, right and center.
 * @constructor
 */
export const Line: React.FC<LineProps> = ({ value, side }) => (
    <>
        <p className={`line ${side}`}>
            {value}
        </p>
    </>
);
