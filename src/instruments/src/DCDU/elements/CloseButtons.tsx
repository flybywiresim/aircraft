import React, { memo } from 'react';
import { CpdlcMessage } from '@atsu/messages/CpdlcMessage';
import { Button } from './Button';

type CloseButtonsProps = {
    message: CpdlcMessage,
    closeMessage: (message: number) => void
}

export const CloseButtons: React.FC<CloseButtonsProps> = memo(({ message, closeMessage }) => {
    const clicked = (index: string) : void => {
        if (message.UniqueMessageID === undefined) {
            return;
        }

        if (index === 'R2') {
            closeMessage(message.UniqueMessageID);
        }
    };

    return (
        <>
            <Button
                messageId={message.UniqueMessageID}
                index="R2"
                content="CLOSE*"
                clicked={clicked}
            />
        </>
    );
});
