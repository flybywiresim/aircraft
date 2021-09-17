import React from 'react';

import '../styles.scss';

type rowHolderProps = {
    /** The number of columns on this row */
    columns: number
}

/** a div element containing all of the columns within a row */
export const RowHolder: React.FC<rowHolderProps> = ({ columns, children }) => (
    <div className={`row-holder-${columns}`}>
        {children}
    </div>
);
