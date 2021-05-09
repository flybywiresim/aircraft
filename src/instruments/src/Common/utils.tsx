import React from 'react';

export const Layer: React.FC = ({ children }) => (
    <g transform="translate(0, 0)">
        {children}
    </g>
);
