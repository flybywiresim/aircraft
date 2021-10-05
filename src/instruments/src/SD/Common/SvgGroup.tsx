import React from 'react';

interface SvgGroupProps {
    x: number,
    y: number,
    className?: string,
}
export const SvgGroup: React.FC<SvgGroupProps> = ({ x, y, children, className }) => <g transform={`translate(${x},${y})`} className={className}>{children}</g>;
