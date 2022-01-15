import React, { memo, useEffect, useRef, useState } from 'react';
import { AtsuMessageComStatus, AtsuMessageDirection, AtsuMessageResponseStatus, AtsuTimestamp } from '@atsu/messages/AtsuMessage';

type MessageStatusProps = {
    timestamp: AtsuTimestamp | undefined,
    direction: AtsuMessageDirection | undefined,
    status: AtsuMessageResponseStatus | undefined,
    comStatus: AtsuMessageComStatus,
    station: string,
    confirmed: boolean
}

const translateStatus = (status: AtsuMessageResponseStatus | undefined, comStatus: AtsuMessageComStatus) => {
    switch (status) {
    case AtsuMessageResponseStatus.Open:
        if (comStatus !== AtsuMessageComStatus.Open && comStatus !== AtsuMessageComStatus.Failed) {
            return '';
        }
        return 'OPEN';
    case AtsuMessageResponseStatus.Wilco:
        return 'WILCO';
    case AtsuMessageResponseStatus.Roger:
        return 'ROGER';
    case AtsuMessageResponseStatus.Negative:
        return 'NEGATV';
    case AtsuMessageResponseStatus.Unable:
        return 'UNABLE';
    case AtsuMessageResponseStatus.Acknowledge:
        return 'ACK';
    case AtsuMessageResponseStatus.Refuse:
        return 'REFUSE';
    default:
        return 'UKN';
    }
};

export const MessageStatus: React.FC<MessageStatusProps> = memo(({ timestamp, direction, status, comStatus, station, confirmed }) => {
    const [textBBox, setTextBBox] = useState<DOMRect>();
    const textRef = useRef<SVGTSpanElement>(null);

    useEffect(() => setTextBBox(textRef.current?.getBBox()), []);

    if (timestamp === undefined) {
        return <></>;
    }

    let statusClass = 'status-message ';
    if (status === AtsuMessageResponseStatus.Open) {
        statusClass += 'status-open';
    } else {
        statusClass += 'status-other';
    }

    const needsBackground = status !== AtsuMessageResponseStatus.Open;
    const backgroundColor = confirmed === true ? 'rgb(0,255,0)' : 'rgb(0,255,255)';

    // calculate the position of the background rectangle
    const background = { x: 0, y: 0, width: 0, height: 0 };
    if (needsBackground === true && textBBox?.width !== undefined && textBBox?.height !== undefined) {
        background.width = textBBox?.width + 4;
        background.height = textBBox?.height + 2;

        background.x = 467 - textBBox?.width;
        background.y = 37 - textBBox?.height;
    }

    return (
        <g>
            <text className="station" x="21" y="35">
                {timestamp.dcduTimestamp()}
                {' '}
                {direction === AtsuMessageDirection.Output ? ' TO ' : ' FROM '}
                {station}
            </text>
            <>
                {needsBackground === true && (
                    <>
                        <rect
                            width={background.width}
                            height={background.height}
                            fill={backgroundColor}
                            x={background.x}
                            y={background.y}
                        />
                        <text className={statusClass} x="467" y="35"><tspan ref={textRef}>{translateStatus(status, comStatus)}</tspan></text>
                    </>
                )}
                {needsBackground === false && (
                    <text className={statusClass} x="471" y="35">{translateStatus(status, comStatus)}</text>
                )}
            </>
        </g>
    );
});
