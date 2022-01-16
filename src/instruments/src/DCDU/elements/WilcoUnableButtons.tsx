import React, { memo } from 'react';
import { AtsuMessageComStatus } from '@atsu/messages/AtsuMessage';
import { CpdlcMessage, CpdlcMessageResponse } from '@atsu/messages/CpdlcMessage';
import { useUpdate } from '@instruments/common/hooks.js';
import { Button } from './Button';

type WilcoUnableButtonsProps = {
    message: CpdlcMessage,
    setStatus: (sender: string, message: string) => void,
    isStatusAvailable: (sender: string) => boolean,
    closeMessage: (message: number) => void
}

export const WilcoUnableButtons: React.FC<WilcoUnableButtonsProps> = memo(({ message, setStatus, isStatusAvailable, closeMessage }) => {
    useUpdate(() => {
        if (message.ComStatus === AtsuMessageComStatus.Sending) {
            if (isStatusAvailable('Buttons') === true) {
                setStatus('Buttons', 'SENDING');
            }
        }
    });

    const clicked = (index: string) : void => {
        if (message.UniqueMessageID === undefined) {
            return;
        }

        if (message.ComStatus !== AtsuMessageComStatus.Sent && message.Response === undefined) {
            if (index === 'L1') {
                message.Response = CpdlcMessageResponse.Unable;
            } else if (index === 'R1') {
                message.Response = CpdlcMessageResponse.Standby;
            } else if (index === 'R2') {
                message.Response = CpdlcMessageResponse.Wilco;
            }
        } else if (message.ComStatus !== AtsuMessageComStatus.Sent && message.Response !== undefined) {
            if (index === 'L1') {
                message.Response = undefined;
            } else {
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_ANSWER', 'number', message.Response);
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_SEND_UID', 'number', message.UniqueMessageID);
            }
        } else if (message.ComStatus === AtsuMessageComStatus.Sent && index === 'R2') {
            closeMessage(message.UniqueMessageID);
        }
    };

    return (
        <>
            {message.ComStatus !== AtsuMessageComStatus.Sent && message.Response === undefined && (
                <>
                    <Button
                        messageId={message.UniqueMessageID}
                        index="L1"
                        content="*UNABLE"
                        clicked={clicked}
                    />
                    <Button
                        messageId={message.UniqueMessageID}
                        index="R1"
                        content="STBY*"
                        clicked={clicked}
                    />
                    <Button
                        messageId={message.UniqueMessageID}
                        index="R2"
                        content="WILCO*"
                        clicked={clicked}
                    />
                </>
            )}
            {message.ComStatus !== AtsuMessageComStatus.Sent && message.Response !== undefined && (
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
