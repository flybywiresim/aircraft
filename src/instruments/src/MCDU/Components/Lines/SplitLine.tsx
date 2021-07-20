import React, { ReactElement } from 'react';
import { lineColors, lineSides } from './LineProps';

import '../styles.scss';

type SplitLineProps = {
    leftSide: ReactElement,
    rightSide: ReactElement,
    slashColor: lineColors,
    side: lineSides
}

export const SplitLine: React.FC<SplitLineProps> = ({ side, slashColor, leftSide, rightSide }) => (
    <>
        <p className={`line ${side}`}>
            {leftSide}
            <span className={slashColor}>/</span>
            {rightSide}
        </p>
    </>
);
