import React, { memo } from 'react';

type CheckerboardProps = {
    x: number,
    y: number,
    width: number,
    height: number,
    cellSize: number,
    fill: string
}

function createCells(x: number, y: number, yIndex: number, lineCount: number, cellWidth: number, color: string, even: number[], odd: number[]) {
    if (yIndex >= lineCount) {
        return <></>;
    }

    const coordinates = yIndex % 2 ? odd : even;

    return (
        <>
            {coordinates.map((coordinate) => <rect x={x + coordinate} y={y + yIndex * cellWidth} width={cellWidth} height={cellWidth} style={{ fill: color }} />)}
            {createCells(x, y, yIndex + 1, lineCount, cellWidth, color, even, odd)}
        </>
    );
}

export const Checkerboard: React.FC<CheckerboardProps> = memo(({ x, y, width, height, cellSize, fill }) => {
    // calculate the numbers of entries
    const lines = Math.round(height / cellSize);
    const columns = Math.round(width / cellSize);

    // prepare lookup tables for the cells
    const evenCoordinates: number[] = [];
    const oddCoordinates: number[] = [];
    for (let i = 0; i < columns; i += 2) {
        evenCoordinates.push(i * cellSize + cellSize);
        oddCoordinates.push(i * cellSize);
    }

    return (
        <g>
            {createCells(x, y, 0, lines, cellSize, fill, evenCoordinates, oddCoordinates)}
        </g>
    );
});
