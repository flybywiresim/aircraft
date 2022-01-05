import React, { memo } from 'react';
import { AtcMessage, AtcMessageDirection } from '@atsu/AtcMessage';

type MessageViewProps = {
    message: AtcMessage,
    lineOffset: number,
}

export const MessageView: React.FC<MessageViewProps> = memo(({ message, lineOffset }) => {
    const serializedMessage = message.serialize();

    // get the start and end index
    let lines = serializedMessage.split(/\r?\n/);
    let startIndex = lineOffset;
    const maxLines = 5;
    if (lines.length - lineOffset < maxLines) {
        startIndex = Math.max(lines.length - maxLines, 0);
    }
    const endIndex = (lines.length - startIndex >= maxLines) ? maxLines : lines.length - startIndex;
    const startLine = lines[startIndex];
    lines = lines.slice(startIndex + 1, endIndex + 1);

    // calculate the height used by the required lines
    // one line has 32px and the minimum height is 2px
    const contentHeight = 32 * (endIndex - startIndex) + 2;

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
        </g>
    );
});
