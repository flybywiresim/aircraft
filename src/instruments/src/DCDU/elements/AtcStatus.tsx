import React, { memo } from 'react';
import { MessageVisualization } from './MessageVisualization';

type AtcStatusProps = {
    message: string
}

export const AtcStatus: React.FC<AtcStatusProps> = memo(({ message }) => (
    <>
        <MessageVisualization
            message={message}
            cssClass="atc-info"
            yStart={100}
            deltaY={30}
        />
    </>
));
