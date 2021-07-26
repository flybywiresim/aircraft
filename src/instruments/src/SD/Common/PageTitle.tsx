import React from 'react';

import './PageTitle.scss';

export const PageTitle = ({ x, y, text }: {x: number, y: number, text: string}) => (
    <text
        id="pageTitle"
        className="PageTitle"
        x={x}
        y={y}
        alignmentBaseline="central"
    >
        {text}
    </text>
);
