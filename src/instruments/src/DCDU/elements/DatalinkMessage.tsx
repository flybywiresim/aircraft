import React, { useRef, useState, useEffect } from 'react';
import { AtsuMessageComStatus, AtsuMessageDirection, AtsuMessageSerializationFormat } from '@atsu/messages/AtsuMessage';
import { CpdlcMessage } from '@atsu/messages/CpdlcMessage';
import { MessageVisualization } from './MessageVisualization';
import { Checkerboard } from './Checkerboard';

type DatalinkMessageProps = {
    message: CpdlcMessage,
    isStatusAvailable: (sender: string) => boolean,
    setStatus: (sender: string, message: string) => void,
    resetStatus: (sender: string) => void
}

export const DatalinkMessage: React.FC<DatalinkMessageProps> = ({ message, isStatusAvailable, setStatus, resetStatus }) => {
    const [textBBox, setTextBBox] = useState<DOMRect>();
    const textRef = useRef<SVGTextElement>(null);

    useEffect(() => setTextBBox(textRef.current?.getBBox()), []);

    // define the correct background color
    let backgroundNeeded = false;
    let backgroundColor = '';
    if (message.Direction === AtsuMessageDirection.Output) {
        if (message.ComStatus === AtsuMessageComStatus.Sent || message.ComStatus === AtsuMessageComStatus.Sending) {
            backgroundColor = 'rgb(0,255,0)';
        } else {
            backgroundColor = 'rgb(0,255,255)';
        }
        backgroundNeeded = true;
    }

    // check if highlight is needed
    let ignoreHighlight = false;
    if (message.Direction === AtsuMessageDirection.Output) {
        ignoreHighlight = true;
    } else if (message.Response !== undefined && message.Response.ComStatus === AtsuMessageComStatus.Sending) {
        ignoreHighlight = true;
    } else if (message.Response !== undefined && message.Response.ComStatus === AtsuMessageComStatus.Sent && message.Response.Message !== 'STANDBY') {
        ignoreHighlight = true;
    }

    // define the text color
    let messageClass = 'message-content';
    if (message.Direction === AtsuMessageDirection.Output) {
        messageClass += ' message-content-other message-content-out';
    } else if (ignoreHighlight) {
        messageClass += ' message-content-sent';
    } else {
        messageClass += ' message-content-other message-content-in';
    }

    // calculate the position of the background rectangle
    let contentHeight = 16;
    if (textBBox?.width !== undefined && textBBox?.height !== undefined) {
        contentHeight = textBBox?.height + 120;
    }

    return (
        <g>
            {backgroundNeeded
            && (
                <Checkerboard
                    x={130}
                    y={472}
                    width={3600}
                    height={contentHeight}
                    cellSize={10}
                    fill={backgroundColor}
                />
            )}
            <MessageVisualization
                message={message.Message !== '' ? message.Message : message.serialize(AtsuMessageSerializationFormat.DCDU)}
                keepNewlines={message.Direction === AtsuMessageDirection.Output}
                ignoreHighlight={ignoreHighlight}
                cssClass={messageClass}
                yStart={720}
                deltaY={240}
                isStatusAvailable={isStatusAvailable}
                setStatus={setStatus}
                resetStatus={resetStatus}
                setRef={textRef}
            />
        </g>
    );
};
