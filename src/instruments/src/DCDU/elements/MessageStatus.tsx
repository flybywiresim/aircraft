import React, { memo, useEffect, useRef, useState } from 'react';
import { AtsuMessageComStatus, AtsuMessageDirection, AtsuTimestamp } from '@atsu/messages/AtsuMessage';
import { CpdlcMessageResponse } from '@atsu/messages/CpdlcMessage';

type MessageStatusProps = {
    timestamp: AtsuTimestamp | undefined,
    direction: AtsuMessageDirection | undefined,
    response: CpdlcMessageResponse | undefined,
    comStatus: AtsuMessageComStatus,
    station: string,
    confirmed: boolean
}

const translateStatus = (status: CpdlcMessageResponse | undefined) => {
    switch (status) {
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
    case CpdlcMessageResponse.Refuse:
        return 'REFUSE';
    case undefined:
        return '';
    default:
        return 'UKN';
    }
};

export const MessageStatus: React.FC<MessageStatusProps> = memo(({ timestamp, direction, response, comStatus, station, confirmed }) => {
    const [textBBox, setTextBBox] = useState<DOMRect>();
    const textRef = useRef<SVGTSpanElement>(null);

    useEffect(() => setTextBBox(textRef.current?.getBBox()), []);

    if (timestamp === undefined) {
        return <></>;
    }

    let statusClass = 'status-message ';
    if (response === undefined || comStatus === AtsuMessageComStatus.Failed) {
        statusClass += 'status-open';
    } else {
        statusClass += 'status-other';
    }

    const needsBackground = response !== undefined;
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
                        <text className={statusClass} x="467" y="35"><tspan ref={textRef}>{translateStatus(response)}</tspan></text>
                    </>
                )}
                {needsBackground === false && (
                    <text className={statusClass} x="471" y="35">{translateStatus(response)}</text>
                )}
            </>
        </g>
    );
});
