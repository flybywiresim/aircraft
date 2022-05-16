import React from 'react';
import { AtsuMessageComStatus } from '@atsu/messages/AtsuMessage';
import { CpdlcMessage } from '@atsu/messages/CpdlcMessage';
import { Button } from './Button';

type OutputButtonsProps = {
    message: CpdlcMessage,
    setStatus: (sender: string, message: string, duration: number) => void,
    isStatusAvailable: (sender: string) => boolean,
    sendMessage: (message: number) => void,
    deleteMessage: (message: number) => void,
    closeMessage: (message: number) => void
}

export const OutputButtons: React.FC<OutputButtonsProps> = ({ message, setStatus, isStatusAvailable, sendMessage, deleteMessage, closeMessage }) => {
    const buttonsBlocked = message.ComStatus === AtsuMessageComStatus.Sending;

    if (buttonsBlocked) {
        if (isStatusAvailable('Buttons')) {
            setStatus('Buttons', 'SENDING', -1);
        }
    }

    // define the rules for the visualization of the buttons
    let showAnswers = false;

    if (message.ComStatus === AtsuMessageComStatus.Open || message.ComStatus === AtsuMessageComStatus.Failed) {
        showAnswers = true;
    }

    const clicked = (index: string) : void => {
        if (message.UniqueMessageID === undefined) {
            return;
        }

        if (showAnswers) {
            if (index === 'L1') {
                deleteMessage(message.UniqueMessageID);
            } else if (index === 'R2') {
                sendMessage(message.UniqueMessageID);
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
            {!showAnswers && (
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
