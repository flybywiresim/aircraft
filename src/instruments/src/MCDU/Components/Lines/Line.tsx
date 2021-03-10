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
    value: ReactElement
}

/**
 * A Line component that can handle split fields and single value fields. This is a composite component with which to
 * insert <span /> components into.
 * @param value Used for single value fields, ReactElement should return a <span />.
 * @constructor
 */
export const Line: React.FC<LineProps> = ({ value }) => (
    <>
        <p className="line">
            {value}
        </p>
    </>
);
