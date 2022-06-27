import React from 'react';
import { AtsuMessageComStatus } from '@atsu/messages/AtsuMessage';
import { CpdlcMessage } from '@atsu/messages/CpdlcMessage';
import { UplinkMonitor } from '@atsu/components/UplinkMessageMonitoring';
import { Button } from './Button';

type WilcoUnableButtonsProps = {
    message: CpdlcMessage,
    selectedResponse: number,
    setMessageStatus(message: number, response: number),
    sendResponse: (message: number, response: number) => void,
    closeMessage: (message: number) => void,
    monitorMessage: (message: number) => void,
    cancelMessageMonitoring: (message: number) => void,
}

export const WilcoUnableButtons: React.FC<WilcoUnableButtonsProps> = ({
    message, selectedResponse, setMessageStatus, sendResponse, closeMessage,
    monitorMessage, cancelMessageMonitoring,
}) => {
    const buttonsBlocked = message.Response?.ComStatus === AtsuMessageComStatus.Sending;

    // define the rules for the visualization of the buttons
    let showAnswers = false;
    let showStandby = false;
    let showSend = false;

    // new message or a message update
    if (selectedResponse === -1) {
        if (!message.Response) {
            showStandby = true;
            showAnswers = true;
        } else if (message.Response.Content[0].TypeId === 'DM2') {
            showAnswers = true;
        }
    } else if (selectedResponse !== -1) {
        showSend = true;
    }

    const clicked = (index: string) : void => {
        if (message.UniqueMessageID === -1 || buttonsBlocked) {
            return;
        }

        if (showAnswers) {
            if (index === 'L1') {
                setMessageStatus(message.UniqueMessageID, 1);
            } else if (index === 'R1') {
                setMessageStatus(message.UniqueMessageID, 2);
            } else if (index === 'R2') {
                setMessageStatus(message.UniqueMessageID, 0);
                if (UplinkMonitor.relevantMessage(message)) {
                    monitorMessage(message.UniqueMessageID);
                }
            }
        } else if (showSend) {
            if (index === 'L1') {
                setMessageStatus(message.UniqueMessageID, -1);
                if (UplinkMonitor.relevantMessage(message)) {
                    cancelMessageMonitoring(message.UniqueMessageID);
                }
            } else {
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
                        content="UNABLE"
                        active={!buttonsBlocked}
                        onClick={clicked}
                    />
                    {showStandby && (
                        <Button
                            messageId={message.UniqueMessageID}
                            index="R1"
                            content="STBY"
                            active={!buttonsBlocked}
                            onClick={clicked}
                        />
                    )}
                    <Button
                        messageId={message.UniqueMessageID}
                        index="R2"
                        content="WILCO"
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
