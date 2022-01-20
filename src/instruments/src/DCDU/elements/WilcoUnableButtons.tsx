import React from 'react';
import { AtsuMessageComStatus } from '@atsu/messages/AtsuMessage';
import { CpdlcMessage, CpdlcMessageResponse } from '@atsu/messages/CpdlcMessage';
import { useUpdate } from '@instruments/common/hooks.js';
import { Button } from './Button';

type WilcoUnableButtonsProps = {
    message: CpdlcMessage,
    modifiable: boolean,
    setMessageStatus(message: number, response: CpdlcMessageResponse | undefined),
    setStatus: (sender: string, message: string) => void,
    isStatusAvailable: (sender: string) => boolean,
    closeMessage: (message: number) => void
}

export const WilcoUnableButtons: React.FC<WilcoUnableButtonsProps> = ({ message, modifiable, setMessageStatus, setStatus, isStatusAvailable, closeMessage }) => {
    useUpdate(() => {
        if (message.Response !== undefined && message.Response.ComStatus === AtsuMessageComStatus.Sending) {
            if (isStatusAvailable('Buttons') === true) {
                setStatus('Buttons', 'SENDING');
            }
        }
    });

    // define the rules for the visualization of the buttons
    let showAnswers = false;
    let showStandby = false;
    let showSend = false;
    const closeClickabel = message.Response !== undefined && message.Response.Message !== 'STANDBY' && message.Response.ComStatus === AtsuMessageComStatus.Sent;

    if (message.Response === undefined && message.ResponseType === undefined) {
        // the standard case for new messages
        showAnswers = true;
        showStandby = true;
    } else if (message.Response === undefined || message.Response.Message === 'STANDBY' || message.ResponseType === CpdlcMessageResponse.Standby) {
        // STBY was sent or is selected
        if (message.Response !== undefined && message.Response.ComStatus === AtsuMessageComStatus.Sent && message.ResponseType === CpdlcMessageResponse.Standby) {
            // STBY was sent and no other message is selected
            showAnswers = true;
        } else {
            // STBY is not sent
            showSend = true;
        }
    }

    const clicked = (index: string) : void => {
        if (message.UniqueMessageID === undefined) {
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
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_ANSWER', 'number', message.ResponseType as number);
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_SEND_UID', 'number', message.UniqueMessageID);
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
                        content="*UNABLE"
                        active
                        clickShowTime={1000}
                        clickEventDelay={1000}
                        clickedCallback={clicked}
                    />
                    {showStandby && (
                        <Button
                            messageId={message.UniqueMessageID}
                            index="R1"
                            content="STBY*"
                            active
                            clickShowTime={1000}
                            clickEventDelay={1000}
                            clickedCallback={clicked}
                        />
                    )}
                    <Button
                        messageId={message.UniqueMessageID}
                        index="R2"
                        content="WILCO*"
                        active
                        clickShowTime={1000}
                        clickEventDelay={1000}
                        clickedCallback={clicked}
                    />
                </>
            )}
            {showSend && (
                <>
                    <Button
                        messageId={message.UniqueMessageID}
                        index="L1"
                        content="*CANCEL"
                        active
                        clickShowTime={1000}
                        clickEventDelay={1000}
                        clickedCallback={clicked}
                    />
                    <Button
                        messageId={message.UniqueMessageID}
                        index="R2"
                        content="SEND*"
                        active
                        clickShowTime={-1}
                        clickEventDelay={-1}
                        clickedCallback={clicked}
                    />
                </>
            )}
            {!showAnswers && !showSend && (
                <Button
                    messageId={message.UniqueMessageID}
                    index="R2"
                    content={`CLOSE${closeClickabel ? '*' : ''}`}
                    active={closeClickabel}
                    clickShowTime={1000}
                    clickEventDelay={1000}
                    clickedCallback={clicked}
                />
            )}
        </>
    );
};
