import React from 'react';

interface SvgGroupProps {
    x: number,
    y: number,
    className?: string,
}
export const SvgGroup: React.FunctionComponent<SvgGroupProps> = ({ x, y, children }) => <g transform={`translate(${x},${y})`}>{children}</g>;
