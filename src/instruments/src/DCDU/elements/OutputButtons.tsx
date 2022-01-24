import React from 'react';
import { AtsuMessageComStatus } from '@atsu/messages/AtsuMessage';
import { CpdlcMessage } from '@atsu/messages/CpdlcMessage';
import { useUpdate } from '@instruments/common/hooks.js';
import { Button } from './Button';

type OutputButtonsProps = {
    message: CpdlcMessage,
    setStatus: (sender: string, message: string) => void,
    isStatusAvailable: (sender: string) => boolean,
    closeMessage: (message: number) => void
}

export const OutputButtons: React.FC<OutputButtonsProps> = ({ message, setStatus, isStatusAvailable, closeMessage }) => {
    useUpdate(() => {
        if (message.ComStatus === AtsuMessageComStatus.Sending) {
            if (isStatusAvailable('Buttons') === true) {
                setStatus('Buttons', 'SENDING');
            }
        }
    });

    // define the rules for the visualization of the buttons
    let showAnswers = false;
    const closeClickabel = message.ComStatus === AtsuMessageComStatus.Sent;

    if (message.ComStatus !== AtsuMessageComStatus.Open && message.ComStatus !== AtsuMessageComStatus.Failed) {
        showAnswers = true;
    }

    const clicked = (index: string) : void => {
        if (message.UniqueMessageID === undefined) {
            return;
        }

        if (showAnswers) {
            if (index === 'L1') {
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_DELETE_UID', 'number', message.UniqueMessageID);
            } else if (index === 'R2') {
                if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_SEND_UID', 'number') === -1) {
                    SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_SEND_UID', 'number', message.UniqueMessageID);
                } else {
                    setStatus('Buttons', 'SYSTEM BUSY');
                }
            }
        } else if (closeClickabel && index === 'R2') {
            closeMessage(message.UniqueMessageID);
        }
    };

    return (
        <>
            {showAnswers && (
                <>
                    <Button
                        messageId={message.UniqueMessageID}
                        index="L1"
                        content="*CANCEL"
                        active
                        clickedCallback={clicked}
                    />
                    <Button
                        messageId={message.UniqueMessageID}
                        index="R2"
                        content="SEND*"
                        active
                        clickedCallback={clicked}
                    />
                </>
            )}
            {!showAnswers && (
                <Button
                    messageId={message.UniqueMessageID}
                    index="R2"
                    content={`CLOSE${closeClickabel ? '*' : ''}`}
                    active={closeClickabel}
                    clickedCallback={clicked}
                />
            )}
        </>
    );
};
