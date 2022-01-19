import React, { memo } from 'react';
import { MessageVisualization } from './MessageVisualization';

type AtcStatusProps = {
    message: string
}

export const AtcStatus: React.FC<AtcStatusProps> = memo(({ message }) => (
    <>
        <MessageVisualization
            message={message}
            ignoreHighlight={false}
            cssClass="atc-info"
            yStart={100}
            deltaY={30}
            isStatusAvailable={undefined}
            setStatus={undefined}
            resetStatus={undefined}
            setRef={undefined}
        />
    </>
));
