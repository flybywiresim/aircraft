import React, { useState, memo } from 'react';
import { AtcMessageDirection } from '@atsu/AtcMessage';
import { useInteractionEvent } from '../../util.js';

type DatalinkMessageProps = {
    message: string,
    direction: AtcMessageDirection
}

export const DatalinkMessage: React.FC<DatalinkMessageProps> = memo(({ message, direction }) => {
    const [messageViewError, setMessageViewError] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageCount, setPageCount] = useState(0);
    const maxLines = 5;

    useInteractionEvent('A32NX_DCDU_BTN_PUSH_MPL_POEMINUS', () => {
        console.log('MINUS');

        if (pageCount === 0) {
            return;
        }

        if (pageIndex > 0) {
            setPageIndex(pageIndex - 1);
        } else {
            setMessageViewError('NO MORE PGE');

            setTimeout(() => {
                setMessageViewError('');
            }, 3000);
        }
    });
    useInteractionEvent('A32NX_DCDU_BTN_PUSH_MPL_POEPLUS', () => {
        console.log('PLUS');

        if (pageCount === 0) {
            return;
        }

        if (pageCount > pageIndex + 1) {
            setPageIndex(pageIndex + 1);
        } else {
            setMessageViewError('NO MORE PGE');

            setTimeout(() => {
                setMessageViewError('');
            }, 3000);
        }
    });

    // get the number of pages
    let lines = message.split(/\r?\n/);
    lines = lines.filter((e) => e);
    const messagePageCount = Math.ceil(lines.length / maxLines);
    if (messagePageCount !== pageCount) {
        setPageCount(messagePageCount);
    }

    // no text defined
    if (pageCount === 0) {
        return <></>;
    }

    // get the indices
    const startIndex = pageIndex * maxLines;
    const endIndex = Math.min(startIndex + maxLines, lines.length - startIndex);

    // get the start line and the other lines
    const startLine = lines[startIndex];
    lines = lines.slice(startIndex + 1, endIndex);

    // calculate the height used by the required lines
    // one line has 32px and the minimum height is 2px
    const contentHeight = 32 * (lines.length + 1) + 2;

    // define the correct background color
    let backgroundClass = 'message-background ';
    if (direction === AtcMessageDirection.Output) {
        backgroundClass += 'message-out';
    } else {
        backgroundClass += 'message-in';
    }

    return (
        <g>
            <rect className={backgroundClass} height={contentHeight} x="21" y="59" />
            <text className="message-content">
                <tspan x="28" y="90">{startLine}</tspan>
                {lines.map((line) => (<tspan x="28" dy="30">{line}</tspan>))}
            </text>
            {messageViewError !== '' && (
                <>
                    <text className="status-atsu" x="50%" y="270">messageViewError</text>
                </>
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
        </g>
    );
});
