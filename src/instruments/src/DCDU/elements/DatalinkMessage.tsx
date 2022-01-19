import React, { memo, useRef, useState, useEffect } from 'react';
import { AtsuMessageComStatus, AtsuMessageDirection, AtsuMessageSerializationFormat } from '@atsu/messages/AtsuMessage';
import { CpdlcMessage } from '@atsu/messages/CpdlcMessage';
import { MessageVisualization } from './MessageVisualization';

type DatalinkMessageProps = {
    message: CpdlcMessage,
    isStatusAvailable: (sender: string) => boolean,
    setStatus: (sender: string, message: string) => void,
    resetStatus: (sender: string) => void
}

export const DatalinkMessage: React.FC<DatalinkMessageProps> = memo(({ message, isStatusAvailable, setStatus, resetStatus }) => {
    const [textBBox, setTextBBox] = useState<DOMRect>();
    const textRef = useRef<SVGTextElement>(null);

    useEffect(() => setTextBBox(textRef.current?.getBBox()), []);

    // define the correct background color
    let backgroundClass = 'message-background';
    if (message.Direction === AtsuMessageDirection.Output) {
        if (message.ComStatus === AtsuMessageComStatus.Sent || message.ComStatus === AtsuMessageComStatus.Sending) {
            backgroundClass += ' message-sent';
        } else {
            backgroundClass += ' message-out';
        }
    }

    // calculate the position of the background rectangle
    let contentHeight = 2;
    if (textBBox?.width !== undefined && textBBox?.height !== undefined) {
        contentHeight = textBBox?.height + 15;
    }
    console.log(message.Lines);

    return (
        <g>
            <rect className={backgroundClass} height={contentHeight} x="21" y="59" />
            <MessageVisualization
                message={message.serialize(AtsuMessageSerializationFormat.DCDU)}
                cssClass="message-content"
                yStart={90}
                deltaY={30}
                isStatusAvailable={isStatusAvailable}
                setStatus={setStatus}
                resetStatus={resetStatus}
                setRef={textRef}
            />
        </g>
    );
});
