import React from 'react';

export type LayerProps = { x: number, y: number }

export const Layer: React.FC<LayerProps> = ({ x = 0, y = 0, children }) => (
    <g transform={`translate(${x}, ${y})`}>
        {children}
    </g>
);
