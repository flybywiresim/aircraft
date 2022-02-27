import React from 'react';
import { AtsuMessageComStatus, AtsuMessageDirection } from '@atsu/messages/AtsuMessage';
import { CpdlcMessage, CpdlcMessageRequestedResponseType, CpdlcMessageResponse } from '@atsu/messages/CpdlcMessage';
import { Checkerboard } from './Checkerboard';

type MessageStatusProps = {
    message: CpdlcMessage,
    selectedResponse : CpdlcMessageResponse | undefined
}

const translateStatus = (response: CpdlcMessageResponse | undefined, message: CpdlcMessage) => {
    const answerExpected = message.RequestedResponses !== CpdlcMessageRequestedResponseType.NotRequired && message.RequestedResponses !== CpdlcMessageRequestedResponseType.No;

    switch (response) {
    case CpdlcMessageResponse.Standby:
        return 'STBY';
    case CpdlcMessageResponse.Wilco:
        return 'WILCO';
    case CpdlcMessageResponse.Roger:
        return 'ROGER';
    case CpdlcMessageResponse.Negative:
        return 'NEGATV';
    case CpdlcMessageResponse.Unable:
        return 'UNABLE';
    case CpdlcMessageResponse.Acknowledge:
        return 'ACK';
    case CpdlcMessageResponse.Affirm:
        return 'AFFIRM';
    case CpdlcMessageResponse.Refuse:
        return 'REFUSE';
    case undefined:
        if (message.Direction === AtsuMessageDirection.Input && answerExpected) {
            return 'OPEN';
        }
        if (message.ComStatus === AtsuMessageComStatus.Sent) {
            return 'SENT';
        }
        return '';
    default:
        return 'UKN';
    }
};

export const MessageStatus: React.FC<MessageStatusProps> = ({ message, selectedResponse }) => {
    let statusClass = 'status-message ';
    if (message.Direction === AtsuMessageDirection.Input) {
        if (message.ResponseType === undefined && selectedResponse === undefined) {
            statusClass += 'status-open';
        } else {
            statusClass += 'status-other';
        }
    } else if (message.ComStatus === AtsuMessageComStatus.Sent) {
        statusClass += 'status-other';
    } else {
        statusClass += 'status-open';
    }

    // calculate the position of the background rectangle
    let text = '';
    if (selectedResponse !== undefined) {
        text = translateStatus(selectedResponse, message);
    } else {
        text = translateStatus(message.ResponseType, message);
    }

    const backgroundRequired = text !== 'OPEN' && text !== 'SENT';
    let backgroundColor = 'rgba(0,0,0,0)';
    if (message.Direction === AtsuMessageDirection.Input) {
        if (selectedResponse === undefined || selectedResponse === message.ResponseType) {
            backgroundColor = 'rgb(0,255,0)';
        } else {
            backgroundColor = 'rgb(0,255,255)';
        }
    }

    const background = { x: 0, y: 0, width: 0, height: 0 };
    if (text.length !== 0) {
        // one character has a width of 116px and a spacing of 24px per side
        background.width = text.length * 116 + 48;
        // one character has a height of 171 and a spacing of 8 per side
        background.height = 187;
        background.x = 3740 - background.width;
        background.y = 310 - background.height;
    }

    return (
        <g>
            <text className="station" x="168" y="280">
                {message.Timestamp?.dcduTimestamp()}
                {' '}
                {message.Direction === AtsuMessageDirection.Output ? ' TO ' : ' FROM '}
                {message.Station}
            </text>
            <>
                (
                {backgroundRequired
                && (
                    <Checkerboard
                        x={background.x}
                        y={background.y}
                        width={background.width}
                        height={background.height}
                        cellSize={10}
                        fill={backgroundColor}
                    />
                )}
                )
                <text className={statusClass} x="3716" y="290">
                    <tspan>{text}</tspan>
                </text>
            </>
        </g>
    );
};
