import React from 'react';

export const SvgGroup = ({ x, y, children }) => <g transform={`translate(${x},${y})`}>{children}</g>;
