import React, { memo, useEffect, useRef, useState } from 'react';
import { AtcMessageDirection, AtcMessageStatus, AtcTimestamp } from '@atsu/AtcMessage';

type MessageStatusProps = {
    timestamp: AtcTimestamp | undefined,
    direction: AtcMessageDirection,
    status: AtcMessageStatus,
    station: string,
    confirmed: boolean
}

const translateStatus = (status: AtcMessageStatus) => {
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
};

export const MessageStatus: React.FC<MessageStatusProps> = memo(({ timestamp, direction, status, station, confirmed }) => {
    const [textBBox, setTextBBox] = useState<DOMRect>();
    const textRef = useRef<SVGTSpanElement>(null);

    useEffect(() => setTextBBox(textRef.current?.getBBox()), []);

    if (timestamp === undefined) {
        return <></>;
    }

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
                {timestamp.DcduTimestamp()}
                {' '}
                {station.length !== 0 && (direction === AtcMessageDirection.Output ? ' TO ' : ' FROM ')}
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
                        <text className={statusClass} x="467" y="35"><tspan ref={textRef}>{translateStatus(status)}</tspan></text>
                    </>
                )}
                {needsBackground === false && (
                    <text className={statusClass} x="471" y="35">{translateStatus(status)}</text>
                )}
            </>
        </g>
    );
});
