import React from 'react';
import { AtsuMessageComStatus } from '@atsu/messages/AtsuMessage';
import { CpdlcMessage, CpdlcMessageResponse } from '@atsu/messages/CpdlcMessage';
import { useUpdate } from '@instruments/common/hooks.js';
import { Button } from './Button';

type WilcoUnableButtonsProps = {
    message: CpdlcMessage,
    selectedResponse: CpdlcMessageResponse | undefined,
    setMessageStatus(message: number, response: CpdlcMessageResponse | undefined),
    setStatus: (sender: string, message: string) => void,
    isStatusAvailable: (sender: string) => boolean,
    closeMessage: (message: number) => void
}

export const WilcoUnableButtons: React.FC<WilcoUnableButtonsProps> = ({ message, selectedResponse, setMessageStatus, setStatus, isStatusAvailable, closeMessage }) => {
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
    let showStandby = false;
    let showSend = false;

    // new message or a message update
    if (selectedResponse === undefined) {
        if (message.ResponseType === undefined) {
            showStandby = true;
            showAnswers = true;
        } else if (message.ResponseType === CpdlcMessageResponse.Standby) {
            showAnswers = true;
        }
    } else if (selectedResponse !== undefined) {
        showSend = true;
    }

    const clicked = (index: string) : void => {
        if (message.UniqueMessageID === undefined || buttonsBlocked) {
            return;
        }

        if (showAnswers) {
            if (index === 'L1') {
                setMessageStatus(message.UniqueMessageID, CpdlcMessageResponse.Unable);
            } else if (index === 'R1') {
                setMessageStatus(message.UniqueMessageID, CpdlcMessageResponse.Standby);
            } else if (index === 'R2') {
                setMessageStatus(message.UniqueMessageID, CpdlcMessageResponse.Wilco);
            }
        } else if (showSend) {
            if (index === 'L1') {
                setMessageStatus(message.UniqueMessageID, undefined);
            } else {
                let systemBusy = SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_ANSWER', 'number') !== -1;
                systemBusy = systemBusy || SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_SEND_UID', 'number') !== -1;

                if (!systemBusy) {
                    SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_ANSWER', 'number', selectedResponse as number);
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
