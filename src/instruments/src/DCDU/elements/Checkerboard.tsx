import React, { memo } from 'react';

type CheckerboardProps = {
    x: number,
    y: number,
    width: number,
    height: number,
    cellSize: number,
    fill: string
}

function createCells(offsetUsed: boolean, x: number, y: number, xIndex: number, yIndex: number, lineCount: number, columnCount: number, cellWidth: number, color: string) {
    if (yIndex >= lineCount) {
        return <></>;
    } if (xIndex >= columnCount) {
        if (!offsetUsed) {
            return createCells(true, x, y + cellWidth, 0, yIndex + 1, lineCount, columnCount, cellWidth, color);
        }
        return createCells(false, x, y + cellWidth, 0, yIndex + 1, lineCount, columnCount, cellWidth, color);
    }

    let xOffset = xIndex * cellWidth;
    if (offsetUsed) {
        xOffset += cellWidth;
    }

    return (
        <>
            <rect x={x + xOffset} y={y} width={cellWidth} height={cellWidth} style={{ fill: color }} />
            (
            {createCells(offsetUsed, x, y, xIndex + 2, yIndex, lineCount, columnCount, cellWidth, color)}
            )
        </>
    );
}

export const Checkerboard: React.FC<CheckerboardProps> = memo(({ x, y, width, height, cellSize, fill }) => {
    // calculate the numbers of entries
    const lines = Math.round(height / cellSize);
    const columns = Math.round(width / cellSize);

    return (
        <g>
            (
            {createCells(false, x, y, 0, 0, lines, columns, cellSize, fill)}
            )
        </g>
    );
});
