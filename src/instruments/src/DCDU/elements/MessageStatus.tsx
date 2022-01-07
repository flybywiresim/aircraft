import React, { memo } from 'react';
import { AtcMessageDirection, AtcMessageStatus, AtcTimestamp } from '@atsu/AtcMessage';

type MessageStatusProps = {
    timestamp: AtcTimestamp | undefined,
    direction: AtcMessageDirection,
    status: AtcMessageStatus,
    station: string,
    confirmed: boolean
}

function translateStatus(status: AtcMessageStatus) {
    switch (status) {
    case AtcMessageStatus.Open:
        return 'OPEN';
    case AtcMessageStatus.Sent:
        return 'SENT';
    case AtcMessageStatus.Wilco:
        return 'WILCO';
    case AtcMessageStatus.Roger:
        return 'ROGER';
    case AtcMessageStatus.Negative:
        return 'NEGATV';
    case AtcMessageStatus.Unable:
        return 'UNABLE';
    case AtcMessageStatus.Acknowledge:
        return 'ACK';
    case AtcMessageStatus.Refuse:
        return 'REFUSE';
    default:
        return 'UKN';
    }
}

function renderStatus(status: AtcMessageStatus, confirmed: boolean) {
    let statusClass = 'status-message ';
    if (status === AtcMessageStatus.Open) {
        statusClass += 'status-open';
    } else if (status === AtcMessageStatus.Sent) {
        statusClass += 'status-sent';
    } else {
        statusClass += 'status-other';
    }

    const needsBackground = status !== AtcMessageStatus.Open && status !== AtcMessageStatus.Sent;
    const backgroundColor = confirmed === true ? 'rgb(0,255,0)' : 'rgb(0,255,255)';

    return (
        <>
            {needsBackground === true && (
                <>
                    <defs>
                        <filter x="-0.025" y="0" width="1.05" height="1" id="solid">
                            <feFlood floodColor={backgroundColor} result="bg" />
                            <feMerge>
                                <feMergeNode in="bg" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <text className={statusClass} filter="url(#solid)" x="470" y="35">{translateStatus(status)}</text>
                </>
            )}
            {needsBackground === false && (
                <text className={statusClass} x="471" y="35">{translateStatus(status)}</text>
            )}
        </>
    );
}

export const MessageStatus: React.FC<MessageStatusProps> = memo(({ timestamp, direction, status, station, confirmed }) => {
    if (timestamp === undefined) {
        return <></>;
    }

    return (
        <g>
            <text className="station" x="21" y="35">
                {timestamp.DcduTimestamp()}
                {' '}
                {station.length !== 0 && (direction === AtcMessageDirection.Output ? ' TO ' : ' FROM ')}
                {station}
            </text>
            {renderStatus(status, confirmed)}
        </g>
    );
});
