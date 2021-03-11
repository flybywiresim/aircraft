import React from 'react';
import { Line, lineSides } from './Line';

type EmptyLineProps = {}
export const EmptyLine: React.FC<EmptyLineProps> = () => (
    <Line side={lineSides.left} />
);
