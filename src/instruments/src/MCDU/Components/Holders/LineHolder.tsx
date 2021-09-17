import React from 'react';

import '../styles.scss';

type lineHolderProps = {
    /** The position of the column within the row
     * @example
     * [[1][2][3]]
     */
    columnPosition: number
}

/** Div Element containing the contents of a column within a row */
export const LineHolder: React.FC<lineHolderProps> = ({ columnPosition, children }) => (
    <div className={`line-holder-${columnPosition}`}>
        {children}
    </div>
);
