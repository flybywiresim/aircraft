import { DcduStatusMessage } from '@atsu/components/DcduLink';
import React from 'react';
import { MessageVisualization } from './MessageVisualization';

type AtcStatusProps = {
    message: string
}

export const AtcStatus: React.FC<AtcStatusProps> = ({ message }) => {
    let cssClass = 'atc-info ';
    if (message.includes('CURRENT')) {
        cssClass += 'atc-info-active';
    } else {
        cssClass += 'atc-info-standby';
    }

    const systemStatusSink = (_status: DcduStatusMessage): void => {};

    return (
        <>
            <MessageVisualization
                message={message}
                backgroundColor={[0, 0, 0]}
                ignoreHighlight={false}
                cssClass={cssClass}
                yStart={800}
                deltaY={240}
                updateSystemStatusMessage={systemStatusSink}
            />
        </>
    );
};
