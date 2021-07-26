import React from 'react';

import './PageTitle.scss';

type PageTitleProps = {
    x: number,
    y: number,
    text: string
}

export const PageTitle = ({ x, y, text }: PageTitleProps) => (
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
