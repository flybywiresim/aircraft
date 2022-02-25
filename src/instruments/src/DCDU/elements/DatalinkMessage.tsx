import React from 'react';
import { AtsuMessageComStatus, AtsuMessageDirection, AtsuMessageSerializationFormat } from '@atsu/messages/AtsuMessage';
import { CpdlcMessage } from '@atsu/messages/CpdlcMessage';
import { MessageVisualization } from './MessageVisualization';

type DatalinkMessageProps = {
    message: CpdlcMessage,
    isStatusAvailable: (sender: string) => boolean,
    setStatus: (sender: string, message: string) => void,
    resetStatus: (sender: string) => void
}

export const DatalinkMessage: React.FC<DatalinkMessageProps> = ({ message, isStatusAvailable, setStatus, resetStatus }) => {
    // define the correct background color
    let backgroundColor: [number, number, number] = [0, 0, 0];
    if (message.Direction === AtsuMessageDirection.Output) {
        if (message.ComStatus === AtsuMessageComStatus.Sent || message.ComStatus === AtsuMessageComStatus.Sending) {
            backgroundColor = [0, 255, 0];
        } else {
            backgroundColor = [0, 255, 255];
        }
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

    return (
        <g>
            <MessageVisualization
                message={message.Message !== '' ? message.Message : message.serialize(AtsuMessageSerializationFormat.DCDU)}
                backgroundColor={backgroundColor}
                keepNewlines={message.Direction === AtsuMessageDirection.Output}
                ignoreHighlight={ignoreHighlight}
                cssClass={messageClass}
                yStart={720}
                deltaY={240}
                isStatusAvailable={isStatusAvailable}
                setStatus={setStatus}
                resetStatus={resetStatus}
            />
        </g>
    );
};
