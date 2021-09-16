import React from 'react';

import '../styles.scss';

type rowHolderProps = {
    columns: number
}

export const RowHolder: React.FC<rowHolderProps> = ({ columns, children }) => (
    <div className={`row-holder-${columns}`}>
        {children}
    </div>
);
