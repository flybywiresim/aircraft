import React from 'react';
import { AtsuMessageComStatus } from '@atsu/messages/AtsuMessage';
import { CpdlcMessage, CpdlcMessageResponse } from '@atsu/messages/CpdlcMessage';
import { useUpdate } from '@instruments/common/hooks.js';
import { Button } from './Button';

type RogerButtonsProps = {
    message: CpdlcMessage,
    modifiable: boolean,
    setMessageStatus(message: number, response: CpdlcMessageResponse | undefined),
    setStatus: (sender: string, message: string) => void,
    isStatusAvailable: (sender: string) => boolean,
    closeMessage: (message: number) => void
}

export const RogerButtons: React.FC<RogerButtonsProps> = ({ message, modifiable, setMessageStatus, setStatus, isStatusAvailable, closeMessage }) => {
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

        if (message.Response === undefined && message.ResponseType === undefined && modifiable) {
            if (index === 'R2') {
                setMessageStatus(message.UniqueMessageID, CpdlcMessageResponse.Roger);
            }
        } else if (message.Response === undefined && message.ResponseType !== undefined && modifiable) {
            if (index === 'L1') {
                setMessageStatus(message.UniqueMessageID, undefined);
            } else if (index === 'R2') {
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_SEND_UID', 'number', message.UniqueMessageID);
            }
        } else if (message.Response !== undefined && index === 'R2') {
            closeMessage(message.UniqueMessageID);
        }
    };

    return (
        <>
            {message.Response === undefined && message.ResponseType === undefined && (
                <>
                    <Button
                        messageId={message.UniqueMessageID}
                        index="R2"
                        content={`ROGER${modifiable ? '*' : ''}`}
                        clicked={clicked}
                    />
                </>
            )}
            {message.Response === undefined && message.ResponseType !== undefined && (
                <>
                    <Button
                        messageId={message.UniqueMessageID}
                        index="L1"
                        content={`${modifiable ? '*' : ''}CANCEL`}
                        clicked={clicked}
                    />
                    <Button
                        messageId={message.UniqueMessageID}
                        index="R2"
                        content={`SEND${modifiable ? '*' : ''}`}
                        clicked={clicked}
                    />
                </>
            )}
            {message.Response !== undefined && (
                <Button
                    messageId={message.UniqueMessageID}
                    index="R2"
                    content="CLOSE*"
                    clicked={clicked}
                />
            )}
        </>
    );
};
