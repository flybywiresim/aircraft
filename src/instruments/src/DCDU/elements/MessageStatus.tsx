import React, { useEffect, useRef, useState } from 'react';
import { AtsuMessageComStatus, AtsuMessageDirection } from '@atsu/messages/AtsuMessage';
import { CpdlcMessage, CpdlcMessageRequestedResponseType, CpdlcMessageResponse } from '@atsu/messages/CpdlcMessage';

type MessageStatusProps = {
    message: CpdlcMessage
}

const translateStatus = (message: CpdlcMessage) => {
    const answerExpected = message.RequestedResponses !== CpdlcMessageRequestedResponseType.NotRequired && message.RequestedResponses !== CpdlcMessageRequestedResponseType.No;

    switch (message.ResponseType) {
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

export const MessageStatus: React.FC<MessageStatusProps> = ({ message }) => {
    const [dimension, setDimension] = useState([0, 0]);
    const textRef = useRef<SVGTextElement>(null);

    useEffect(() => {
        const text = translateStatus(message);

        if (text.length !== 0 && textRef.current?.getBBox() !== undefined) {
            const width = Math.floor(textRef.current?.getBBox().width / translateStatus(message).length);
            const height = Math.floor(textRef.current?.getBBox().height);
            setDimension([width, height]);
        }
    }, []);

    let statusClass = 'status-message ';
    if (message.ResponseType === undefined) {
        statusClass += 'status-open';
    } else {
        statusClass += 'status-other';
    }

    let backgroundColor = 'rgba(0,0,0,0)';
    if (message.Direction === AtsuMessageDirection.Input && message.ResponseType !== undefined) {
        if (message.Response === undefined || message.Response.ComStatus === AtsuMessageComStatus.Open || message.Response.ComStatus === AtsuMessageComStatus.Failed) {
            backgroundColor = 'rgb(0,255,255)';
        } else {
            backgroundColor = 'rgb(0,255,0)';
        }
    }

    // calculate the position of the background rectangle
    const text = translateStatus(message);
    const background = { x: 0, y: 0, width: 0, height: 0 };
    if (dimension[0] !== 0 && dimension[1] !== 0) {
        const width = dimension[0] * text.length;

        background.width = width + 48;
        background.height = dimension[1] + 16;

        background.x = 3696 - width;
        background.y = 298 - dimension[1];
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
                <rect
                    width={background.width}
                    height={background.height}
                    fill={backgroundColor}
                    x={background.x}
                    y={background.y}
                />
                <text className={statusClass} x="3736" y="280" ref={textRef}>
                    <tspan>{text}</tspan>
                </text>
            </>
        </g>
    );
};
