import React from 'react';
import './styles.scss';

type RowHolderProps = {
    index?: number
}
const RowHolder: React.FC<RowHolderProps> = ({ children }) => (
    <div className="row-holder">
        {children}
    </div>
);

export { RowHolder };
