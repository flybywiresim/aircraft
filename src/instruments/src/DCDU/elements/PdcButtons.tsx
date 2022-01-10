import React, { memo } from 'react';
import { AtsuMessage, AtsuMessageComStatus } from '@atsu/messages/AtsuMessage';
import { useUpdate } from '@instruments/common/hooks.js';
import { Button } from './Button';

type PdcButtonsProps = {
    message: AtsuMessage,
    setStatus: (sender: string, message: string) => void,
    isStatusAvailable: (sender: string) => boolean,
    closeMessage: (message: number) => void
}

export const PdcButtons: React.FC<PdcButtonsProps> = memo(({ message, setStatus, isStatusAvailable, closeMessage }) => {
    useUpdate(() => {
        if (message.ComStatus === AtsuMessageComStatus.Sending) {
            if (isStatusAvailable('Buttons') === true) {
                setStatus('Buttons', 'SENDING');
            }
        }
    });

    const clicked = (index: string) : void => {
        if (message.ComStatus === AtsuMessageComStatus.Open || message.ComStatus === AtsuMessageComStatus.Failed) {
            if (index === 'L1') {
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_DELETE', 'number', message.UniqueMessageID);
            } else if (index === 'R2') {
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_SEND', 'number', message.UniqueMessageID);
            }
        } else if (message.ComStatus === AtsuMessageComStatus.Sent && index === 'R2') {
            closeMessage(message.UniqueMessageID);
        }
    };

    return (
        <>
            {message.ComStatus !== AtsuMessageComStatus.Sent && (
                <>
                    <Button
                        messageId={message.UniqueMessageID}
                        index="L1"
                        content="*CANCEL"
                        clicked={clicked}
                    />
                    <Button
                        messageId={message.UniqueMessageID}
                        index="R2"
                        content="SEND*"
                        clicked={clicked}
                    />
                </>
            )}
            {message.ComStatus === AtsuMessageComStatus.Sent && (
                <Button
                    messageId={message.UniqueMessageID}
                    index="R2"
                    content="CLOSE*"
                    clicked={clicked}
                />
            )}
        </>
    );
});
