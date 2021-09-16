import React from 'react';

import '../styles.scss';

type lineHolderProps = {
    columnPosition: number
}

export const LineHolder: React.FC<lineHolderProps> = ({ columnPosition, children }) => (
    <div className={`line-holder-${columnPosition}`}>
        {children}
    </div>
);
