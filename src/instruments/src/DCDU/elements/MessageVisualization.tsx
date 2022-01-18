import React, { memo } from 'react';

type MessageVisualizationProps = {
    message: string,
    cssClass: string,
    yStart: number,
    deltaY: number
}

function visualizeLines(lines: string[], index: number, colorIndex: number, yStart: number, deltaY: number, highlightActive: boolean, deltaYActive: boolean) {
    if (lines.length <= index) {
        return <></>;
    }

    let elements = lines[index].split('@');
    elements = elements.filter((e) => e);
    if (elements.length <= colorIndex) {
        return visualizeLines(lines, index + 1, 0, yStart, deltaY, highlightActive, true);
    }

    // first line
    if (index === 0 && colorIndex === 0) {
        return (
            <>
                <tspan x="28" y={yStart}>{elements[0]}</tspan>
                {visualizeLines(lines, index, colorIndex + 1, yStart, deltaY, highlightActive, false)}
            </>
        );
    }

    // have a new color change
    if (colorIndex !== 0) {
        highlightActive = !highlightActive;
    }

    // started with a new line
    if (deltaYActive) {
        if (!highlightActive) {
            return (
                <>
                    <tspan x="28" dy={deltaY}>{elements[colorIndex]}</tspan>
                    {visualizeLines(lines, index, colorIndex + 1, yStart, deltaY, highlightActive, false)}
                </>
            );
        }

        return (
            <>
                <tspan x="28" dy={deltaY} className="message-highlight">{elements[colorIndex]}</tspan>
                {visualizeLines(lines, index, colorIndex + 1, yStart, deltaY, highlightActive, false)}
            </>
        );
    }

    // handling splits inside the line
    if (!highlightActive) {
        return (
            <>
                <tspan>{elements[colorIndex]}</tspan>
                {visualizeLines(lines, index, colorIndex + 1, yStart, deltaY, highlightActive, false)}
            </>
        );
    }

    return (
        <>
            <tspan className="message-highlight">{elements[colorIndex]}</tspan>
            {visualizeLines(lines, index, colorIndex + 1, yStart, deltaY, highlightActive, false)}
        </>
    );
}

export const MessageVisualization: React.FC<MessageVisualizationProps> = memo(({ message, cssClass, yStart, deltaY }) => {
    if (message.length === 0) {
        return <></>;
    }

    // remove all underscores
    message = message.replace('_', '');

    // get the single lines
    let lines = message.split(/\r?\n/);
    lines = lines.filter((e) => e);
    console.log(lines);

    return (
        <text className={cssClass}>
            {visualizeLines(lines, 0, 0, yStart, deltaY, false, false)}
        </text>
    );
});
