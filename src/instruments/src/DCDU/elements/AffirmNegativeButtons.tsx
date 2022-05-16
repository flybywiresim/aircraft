import React from 'react';
import { AtsuMessageComStatus } from '@atsu/messages/AtsuMessage';
import { CpdlcMessage } from '@atsu/messages/CpdlcMessage';
import { Button } from './Button';

type AffirmNegativeButtonsProps = {
    message: CpdlcMessage,
    selectedResponse: number,
    setMessageStatus(message: number, response: number),
    setStatus: (sender: string, message: string, duration: number) => void,
    isStatusAvailable: (sender: string) => boolean,
    sendResponse: (message: number, response: number) => void,
    closeMessage: (message: number) => void
}

export const AffirmNegativeButtons: React.FC<AffirmNegativeButtonsProps> = ({ message, selectedResponse, setMessageStatus, setStatus, isStatusAvailable, sendResponse, closeMessage }) => {
    const buttonsBlocked = message.Response !== undefined && message.Response.ComStatus === AtsuMessageComStatus.Sending;

    if (buttonsBlocked) {
        if (isStatusAvailable('Buttons')) {
            setStatus('Buttons', 'SENDING', -1);
        }
    }

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
            if (index === 'L1') {
                setMessageStatus(message.UniqueMessageID, 5);
            } else if (index === 'R2') {
                setMessageStatus(message.UniqueMessageID, 4);
            }
        } else if (showSend) {
            if (index === 'L1') {
                setMessageStatus(message.UniqueMessageID, -1);
            } else if (index === 'R2') {
                sendResponse(message.UniqueMessageID, selectedResponse);
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
                        content="NEGATV"
                        active={!buttonsBlocked}
                        onClick={clicked}
                    />
                    <Button
                        messageId={message.UniqueMessageID}
                        index="R2"
                        content="AFFIRM"
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
