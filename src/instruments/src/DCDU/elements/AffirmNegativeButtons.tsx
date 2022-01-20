import React from 'react';
import { AtsuMessageComStatus } from '@atsu/messages/AtsuMessage';
import { CpdlcMessage, CpdlcMessageResponse } from '@atsu/messages/CpdlcMessage';
import { useUpdate } from '@instruments/common/hooks.js';
import { Button } from './Button';

type AffirmNegativeButtonsProps = {
    message: CpdlcMessage,
    modifiable: boolean,
    setMessageStatus(message: number, response: CpdlcMessageResponse | undefined),
    setStatus: (sender: string, message: string) => void,
    isStatusAvailable: (sender: string) => boolean,
    closeMessage: (message: number) => void
}

export const AffirmNegativeButtons: React.FC<AffirmNegativeButtonsProps> = ({ message, modifiable, setMessageStatus, setStatus, isStatusAvailable, closeMessage }) => {
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
            if (index === 'L1') {
                setMessageStatus(message.UniqueMessageID, CpdlcMessageResponse.Negative);
            } else if (index === 'R2') {
                setMessageStatus(message.UniqueMessageID, CpdlcMessageResponse.Affirm);
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
                        index="L1"
                        content={`${modifiable ? '*' : ''}NEGATIVE`}
                        clickShowTime={1000}
                        clickEventDelay={1000}
                        clickedCallback={clicked}
                    />
                    <Button
                        messageId={message.UniqueMessageID}
                        index="R2"
                        content={`AFFIRM${modifiable ? '*' : ''}`}
                        clickShowTime={1000}
                        clickEventDelay={1000}
                        clickedCallback={clicked}
                    />
                </>
            )}
            {message.Response === undefined && message.ResponseType !== undefined && (
                <>
                    <Button
                        messageId={message.UniqueMessageID}
                        index="L1"
                        content={`${modifiable ? '*' : ''}CANCEL`}
                        clickShowTime={1000}
                        clickEventDelay={1000}
                        clickedCallback={clicked}
                    />
                    <Button
                        messageId={message.UniqueMessageID}
                        index="R2"
                        content={`SEND${modifiable ? '*' : ''}`}
                        clickShowTime={-1}
                        clickEventDelay={-1}
                        clickedCallback={clicked}
                    />
                </>
            )}
            {message.Response !== undefined && (
                <Button
                    messageId={message.UniqueMessageID}
                    index="R2"
                    content="CLOSE*"
                    clickShowTime={1000}
                    clickEventDelay={1000}
                    clickedCallback={clicked}
                />
            )}
        </>
    );
};
