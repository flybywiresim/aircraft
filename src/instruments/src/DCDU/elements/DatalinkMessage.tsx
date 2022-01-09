import React, { useState, memo } from 'react';
import { AtsuMessage, AtsuMessageComStatus, AtsuMessageDirection } from '@atsu/AtsuMessage';
import { useInteractionEvents } from '@instruments/common/hooks.js';

type DatalinkMessageProps = {
    message: AtsuMessage,
    isStatusAvailable: (sender: string) => boolean,
    setStatus: (sender: string, message: string) => void,
    resetStatus: (sender: string) => void
}

export const DatalinkMessage: React.FC<DatalinkMessageProps> = memo(({ message, isStatusAvailable, setStatus, resetStatus }) => {
    const [pageIndex, setPageIndex] = useState(0);
    const [pageCount, setPageCount] = useState(0);
    const maxLines = 5;

    useInteractionEvents(['A32NX_DCDU_BTN_MPL_POEMINUS', 'A32NX_DCDU_BTN_MPR_POEMINUS'], () => {
        if (pageCount === 0) {
            return;
        }

        if (pageIndex > 0) {
            resetStatus('DatalinkMessage');
            setPageIndex(pageIndex - 1);
        } else if (isStatusAvailable('DatalinkMessage') === true) {
            setStatus('DatalinkMessage', 'NO MORE PGE');
        }
    });
    useInteractionEvents(['A32NX_DCDU_BTN_MPL_POEPLUS', 'A32NX_DCDU_BTN_MPR_POEPLUS'], () => {
        if (pageCount === 0) {
            return;
        }

        if (pageCount > pageIndex + 1) {
            resetStatus('DatalinkMessage');
            setPageIndex(pageIndex + 1);
        } else if (isStatusAvailable('DatalinkMessage') === true) {
            setStatus('DatalinkMessage', 'NO MORE PGE');
        }
    });

    // get the number of pages
    let lines = message.serialize().split(/\r?\n/);
    lines = lines.filter((e) => e);
    const messagePageCount = Math.ceil(lines.length / maxLines);
    if (messagePageCount !== pageCount) {
        setPageCount(messagePageCount);
        setPageIndex(0);
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
    let backgroundClass = 'message-background';
    if (message.Direction === AtsuMessageDirection.Output) {
        if (message.ComStatus === AtsuMessageComStatus.Sent || message.ComStatus === AtsuMessageComStatus.Sending) {
            backgroundClass += ' message-sent';
        } else {
            backgroundClass += ' message-out';
        }
    }

    return (
        <g>
            <rect className={backgroundClass} height={contentHeight} x="21" y="59" />
            <text className="message-content">
                <tspan x="28" y="90">{startLine}</tspan>
                {lines.map((line) => (<tspan x="28" dy="30">{line}</tspan>))}
            </text>
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
