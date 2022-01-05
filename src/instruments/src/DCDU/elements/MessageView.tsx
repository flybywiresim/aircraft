import React, { memo, useState } from 'react';
import { AtcMessage, AtcMessageDirection } from '@atsu/AtcMessage';

type MessageViewProps = {
    message: AtcMessage
}

export const MessageView: React.FC<MessageViewProps> = memo(({ message }) => {
    const [pageIndex, setPageIndex] = useState(0);
    const [pageCount, setPageCount] = useState(0);
    const serializedMessage = message.serialize();
    const maxLines = 5;

    // get the number of pages
    let lines = serializedMessage.split(/\r?\n/);
    lines = lines.filter((e) => e);
    const messagePageCount = Math.ceil(lines.length / maxLines);
    if (messagePageCount !== pageCount) {
        setPageCount(messagePageCount);
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
    if (message.Direction === AtcMessageDirection.Output) {
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
