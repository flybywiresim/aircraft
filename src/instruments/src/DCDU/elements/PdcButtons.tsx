import React, { memo } from 'react';
import { AtcMessage, AtcMessageComStatus } from '@atsu/AtcMessage';
import { useUpdate } from '@instruments/common/hooks.js';
import { Button } from './Button';

type PdcButtonsProps = {
    message: AtcMessage,
    setStatus: (sender: string, message: string) => void,
    resetStatus: (sender: string) => void,
    closeMessage: (message: number) => void
}

export const PdcButtons: React.FC<PdcButtonsProps> = memo(({ message, setStatus, resetStatus, closeMessage }) => {
    useUpdate(() => {
        if (message.ComStatus === AtcMessageComStatus.Sending) {
            resetStatus('');
            setStatus('Buttons', 'SENDING');
        }
    });

    const clicked = (index: string) : void => {
        if (message.ComStatus === undefined) {
            if (index === 'L1') {
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_DELETE', 'number', message.UniqueMessageID);
            } else if (index === 'R2') {
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_SEND', 'number', message.UniqueMessageID);
            }
        } else if (message.ComStatus === AtcMessageComStatus.Sent && index === 'R2') {
            closeMessage(message.UniqueMessageID);
        }
    };

    return (
        <>
            {message.ComStatus !== AtcMessageComStatus.Sent && (
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
            {message.ComStatus === AtcMessageComStatus.Sent && (
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
