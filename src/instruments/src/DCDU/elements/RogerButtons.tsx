import React from 'react';
import { AtsuMessageComStatus } from '@atsu/messages/AtsuMessage';
import { CpdlcMessage } from '@atsu/messages/CpdlcMessage';
import { useUpdate } from '@instruments/common/hooks.js';
import { Button } from './Button';

type RogerButtonsProps = {
    message: CpdlcMessage,
    selectedResponse: number,
    setMessageStatus(message: number, response: number),
    setStatus: (sender: string, message: string) => void,
    isStatusAvailable: (sender: string) => boolean,
    closeMessage: (message: number) => void
}

export const RogerButtons: React.FC<RogerButtonsProps> = ({ message, selectedResponse, setMessageStatus, setStatus, isStatusAvailable, closeMessage }) => {
    const buttonsBlocked = message.Response !== undefined && message.Response.ComStatus === AtsuMessageComStatus.Sending;

    useUpdate(() => {
        if (buttonsBlocked) {
            if (isStatusAvailable('Buttons')) {
                setStatus('Buttons', 'SENDING');
            }
        }
    });

    // define the rules for the visualization of the buttons
    let showAnswers = false;
    let showSend = false;

    if (selectedResponse === -1 && message.Response === undefined) {
        showAnswers = true;
    } else if (message.Response === undefined) {
        showSend = true;
    }

    const clicked = (index: string) : void => {
        if (message.UniqueMessageID === undefined || buttonsBlocked) {
            return;
        }

        if (showAnswers) {
            if (index === 'R2') {
                setMessageStatus(message.UniqueMessageID, 3);
            }
        } else if (showSend) {
            if (index === 'L1') {
                setMessageStatus(message.UniqueMessageID, -1);
            } else if (index === 'R2') {
                let systemBusy = SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_ANSWER', 'number') !== -1;
                systemBusy = systemBusy || SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_SEND_UID', 'number') !== -1;

                if (!systemBusy) {
                    SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_ANSWER', 'number', selectedResponse);
                    SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_SEND_UID', 'number', message.UniqueMessageID);
                } else {
                    setStatus('Buttons', 'SYSTEM BUSY');
                }
            }
        } else if (index === 'R2') {
            closeMessage(message.UniqueMessageID);
        }
    };

    return (
        <>
            {showAnswers && (
                <>
                    <Button
                        messageId={message.UniqueMessageID}
                        index="R2"
                        content="ROGER"
                        active={!buttonsBlocked}
                        onClick={clicked}
                    />
                </>
            )}
            {showSend && (
                <>
                    <Button
                        messageId={message.UniqueMessageID}
                        index="L1"
                        content="CANCEL"
                        active={!buttonsBlocked}
                        onClick={clicked}
                    />
                    <Button
                        messageId={message.UniqueMessageID}
                        index="R2"
                        content="SEND"
                        active={!buttonsBlocked}
                        onClick={clicked}
                    />
                </>
            )}
            {!showAnswers && !showSend && (
                <Button
                    messageId={message.UniqueMessageID}
                    index="R2"
                    content="CLOSE"
                    active={!buttonsBlocked}
                    onClick={clicked}
                />
            )}
        </>
    );
};
