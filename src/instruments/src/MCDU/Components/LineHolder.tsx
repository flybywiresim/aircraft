import React from 'react';
import { EmptyLine } from './Lines/EmptyLine';

export const LineHolder: React.FC = ({ children }) => {
    if (children) {
        return (
            <div className="line-holder">
                {children}
            </div>
        );
    }
    return (
        <div className="line-holder">
            <EmptyLine />
            <EmptyLine />
        </div>
    );
};
