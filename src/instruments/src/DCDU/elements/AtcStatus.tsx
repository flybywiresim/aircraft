import React, { memo } from 'react';
import { MessageVisualization } from './MessageVisualization';

type AtcStatusProps = {
    message: string
}

export const AtcStatus: React.FC<AtcStatusProps> = memo(({ message }) => {
    let cssClass = 'atc-info ';
    if (message.includes('CURRENT')) {
        cssClass += 'atc-info-active';
    } else {
        cssClass += 'atc-info-standby';
    }

    return (
        <>
            <MessageVisualization
                message={message}
                keepNewlines={false}
                ignoreHighlight={false}
                cssClass={cssClass}
                yStart={800}
                deltaY={240}
                isStatusAvailable={undefined}
                setStatus={undefined}
                resetStatus={undefined}
                setRef={undefined}
            />
        </>
    );
});
