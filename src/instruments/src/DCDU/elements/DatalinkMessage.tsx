import React from 'react';
import { AtsuMessageComStatus, AtsuMessageDirection, AtsuMessageSerializationFormat } from '@atsu/messages/AtsuMessage';
import { CpdlcMessage } from '@atsu/messages/CpdlcMessage';
import { DcduStatusMessage } from '@atsu/components/DcduLink';
import { MessageVisualization } from './MessageVisualization';

type DatalinkMessageProps = {
    messages: CpdlcMessage[],
    updateSystemStatusMessage: (status: DcduStatusMessage) => void
}

export const DatalinkMessage: React.FC<DatalinkMessageProps> = ({ messages, updateSystemStatusMessage }) => {
    // define the correct background color
    let backgroundColor: [number, number, number] = [0, 0, 0];
    if (messages[0].Direction === AtsuMessageDirection.Downlink) {
        if (messages[0].ComStatus === AtsuMessageComStatus.Sent || messages[0].ComStatus === AtsuMessageComStatus.Sending) {
            backgroundColor = [0, 255, 0];
        } else {
            backgroundColor = [0, 255, 255];
        }
    } else if (messages[0].SemanticResponseRequired) {
        if (messages[0].Response?.ComStatus === AtsuMessageComStatus.Sent || messages[0].Response?.ComStatus === AtsuMessageComStatus.Sending) {
            backgroundColor = [0, 255, 0];
        } else {
            backgroundColor = [0, 255, 255];
        }
    }

    // check if highlight is needed
    let ignoreHighlight = false;
    if (messages[0].Direction === AtsuMessageDirection.Downlink) {
        ignoreHighlight = true;
    } else if (messages[0].Response?.ComStatus === AtsuMessageComStatus.Sending) {
        ignoreHighlight = true;
    } else if (messages[0].Response?.ComStatus === AtsuMessageComStatus.Sent && messages[0].Response?.Message !== 'STANDBY') {
        ignoreHighlight = true;
    }

    // define the text color
    let messageClass = 'message-content';
    if (messages[0].Direction === AtsuMessageDirection.Downlink) {
        messageClass += ' message-content-other message-content-out';
    } else if (ignoreHighlight) {
        messageClass += ' message-content-sent';
    } else {
        messageClass += ' message-content-other message-content-in';
    }

    // create the message content
    let content = '';
    messages.forEach((message) => {
        if (message.Content.length === 0 && message.Message !== '') {
            content += `${message.Message}\n`;
        } else {
            content += `${message.serialize(AtsuMessageSerializationFormat.DCDU)}\n`;
        }
    });

    let messageSeperatorLine: number | undefined = undefined;
    if (messages[0].SemanticResponseRequired && messages[0].Response) {
        messageSeperatorLine = content.split('\n').length;
        content += '------------------------------\n';
        content += `${messages[0].Response.serialize(AtsuMessageSerializationFormat.DCDU)}\n`;
    }

    // remove the last newline
    if (content.length !== 0) {
        content = content.slice(0, -1);
    }

    if (messages[0].Content[0].Urgent) {
        content = `   ***HIGH PRIORITY***\n${content}`;
    }

    return (
        <g>
            <MessageVisualization
                message={content}
                seperatorLine={messageSeperatorLine}
                backgroundColor={backgroundColor}
                keepNewlines
                ignoreHighlight={ignoreHighlight}
                cssClass={messageClass}
                yStart={720}
                deltaY={240}
                updateSystemStatusMessage={updateSystemStatusMessage}
            />
        </g>
    );
};
