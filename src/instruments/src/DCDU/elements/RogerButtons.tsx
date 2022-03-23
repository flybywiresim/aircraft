import React from 'react';
import { AtsuMessageComStatus } from '@atsu/messages/AtsuMessage';
import { CpdlcMessage, CpdlcMessageResponse } from '@atsu/messages/CpdlcMessage';
import { useUpdate } from '@instruments/common/hooks.js';
import { Button } from './Button';

type RogerButtonsProps = {
    message: CpdlcMessage,
    selectedResponse: CpdlcMessageResponse | undefined,
    setMessageStatus(message: number, response: CpdlcMessageResponse | undefined),
    setStatus: (sender: string, message: string) => void,
    isStatusAvailable: (sender: string) => boolean,
    sendResponse: (message: number, response: CpdlcMessageResponse) => void,
    closeMessage: (message: number) => void
}

export const RogerButtons: React.FC<RogerButtonsProps> = ({ message, selectedResponse, setMessageStatus, setStatus, isStatusAvailable, sendResponse, closeMessage }) => {
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

    if (selectedResponse === undefined && message.Response === undefined) {
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
                setMessageStatus(message.UniqueMessageID, CpdlcMessageResponse.Roger);
            }
        } else if (showSend) {
            if (index === 'L1') {
                setMessageStatus(message.UniqueMessageID, undefined);
            } else if (index === 'R2') {
                sendResponse(message.UniqueMessageID, selectedResponse as CpdlcMessageResponse);
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
