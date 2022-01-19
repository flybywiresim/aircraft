import React, { useState, memo, RefObject } from 'react';
import { useInteractionEvents } from '@instruments/common/hooks.js';

type MessageVisualizationProps = {
    message: string,
    cssClass: string,
    yStart: number,
    deltaY: number,
    isStatusAvailable: ((sender: string) => boolean) | undefined,
    setStatus: ((sender: string, message: string) => void) | undefined,
    resetStatus: ((sender: string) => void) | undefined,
    setRef: RefObject<SVGTextElement> | undefined
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

export const MessageVisualization: React.FC<MessageVisualizationProps> = memo(({ message, cssClass, yStart, deltaY, isStatusAvailable, setStatus, resetStatus, setRef }) => {
    const [pageIndex, setPageIndex] = useState(0);
    const [pageCount, setPageCount] = useState(0);
    const maxLines = 5;

    useInteractionEvents(['A32NX_DCDU_BTN_MPL_POEMINUS', 'A32NX_DCDU_BTN_MPR_POEMINUS'], () => {
        if (pageCount === 0) {
            return;
        }

        if (pageIndex > 0) {
            if (resetStatus !== undefined) {
                resetStatus('DatalinkMessage');
            }
            setPageIndex(pageIndex - 1);
        } else if (isStatusAvailable !== undefined && setStatus !== undefined && isStatusAvailable('DatalinkMessage') === true) {
            setStatus('DatalinkMessage', 'NO MORE PGE');
        }
    });
    useInteractionEvents(['A32NX_DCDU_BTN_MPL_POEPLUS', 'A32NX_DCDU_BTN_MPR_POEPLUS'], () => {
        if (pageCount === 0) {
            return;
        }

        if (pageCount > pageIndex + 1) {
            if (resetStatus !== undefined) {
                resetStatus('DatalinkMessage');
            }
            setPageIndex(pageIndex + 1);
        } else if (isStatusAvailable !== undefined && setStatus !== undefined && isStatusAvailable('DatalinkMessage') === true) {
            setStatus('DatalinkMessage', 'NO MORE PGE');
        }
    });

    if (message.length === 0) {
        return <></>;
    }

    // get the single lines
    console.log(message);
    let lines = message.split(/\r?\n/);
    lines = lines.filter((e) => e);
    console.log(lines);

    // get the number of pages
    const messagePageCount = Math.ceil(lines.length / maxLines);
    if (messagePageCount !== pageCount) {
        setPageCount(messagePageCount);
        setPageIndex(0);
    }

    // get the indices
    const startIndex = pageIndex * maxLines;
    const endIndex = Math.min(startIndex + maxLines, lines.length - startIndex);

    // get visible lines
    lines = lines.slice(startIndex, endIndex);

    // no text defined
    if (pageCount === 0) {
        return <></>;
    }

    return (
        <>
            {setRef !== undefined && (
                <text className={cssClass} ref={setRef}>
                    {visualizeLines(lines, 0, 0, yStart, deltaY, false, false)}
                </text>
            )}
            {setRef === undefined && (
                <text className={cssClass}>
                    {visualizeLines(lines, 0, 0, yStart, deltaY, false, false)}
                </text>
            )}
            {pageCount > 1 && (
                <>
                    <text className="status-atsu" x="65%" y="310">PG</text>
                    <text className="status-atsu" x="65%" y="340">
                        {pageIndex + 1}
                        {' '}
                        /
                        {' '}
                        {pageCount}
                    </text>
                </>
            )}
        </>
    );
});
