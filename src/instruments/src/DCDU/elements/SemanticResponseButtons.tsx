import React from 'react';
import { AtsuMessageComStatus } from '@atsu/messages/AtsuMessage';
import { CpdlcMessage } from '@atsu/messages/CpdlcMessage';
import { UplinkMessageInterpretation } from '@atsu/components/UplinkMessageInterpretation';
import { Button } from './Button';

type SemanticResponseButtonsProps = {
    message: CpdlcMessage,
    dataIncomplete: boolean,
    messageUnderModification: boolean,
    invertResponse: (message: number) => void,
    modifyResponse: (message: number) => void,
    sendMessage: (message: number) => void,
    closeMessage: (message: number) => void
}

export const SemanticResponseButtons: React.FC<SemanticResponseButtonsProps> = ({
    message, dataIncomplete, messageUnderModification, invertResponse,
    modifyResponse, sendMessage, closeMessage,
}) => {
    const showAnswers = !message.Response || (message.Response.ComStatus !== AtsuMessageComStatus.Sending && message.Response.ComStatus !== AtsuMessageComStatus.Sent);
    const buttonsBlocked = message.Response?.ComStatus === AtsuMessageComStatus.Sending || messageUnderModification;

    const handleClicked = (index: string) : void => {
        if (message.UniqueMessageID === -1 || buttonsBlocked) {
            return;
        }

        if (showAnswers) {
            if (index === 'L1') {
                invertResponse(message.UniqueMessageID);
            } else if (index === 'R1') {
                modifyResponse(message.UniqueMessageID);
            } else if (index === 'R2' && message.Response) {
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
                    {UplinkMessageInterpretation.HasNegativeResponse(message) && (
                        <>
                            <Button
                                messageId={message.UniqueMessageID}
                                index="L1"
                                content="CANNOT"
                                active={!buttonsBlocked}
                                onClick={handleClicked}
                            />
                        </>
                    )}
                    {UplinkMessageInterpretation.IsModifiable(message) && (
                        <>
                            <Button
                                messageId={message.UniqueMessageID}
                                index="R1"
                                content="MODIFY"
                                active={!buttonsBlocked}
                                onClick={handleClicked}
                            />
                        </>
                    )}
                    <Button
                        messageId={message.UniqueMessageID}
                        index="R2"
                        content="SEND"
                        active={!dataIncomplete && !buttonsBlocked}
                        onClick={handleClicked}
                    />
                </>
            )}
            {!showAnswers && (
                <Button
                    messageId={message.UniqueMessageID}
                    index="R2"
                    content="CLOSE"
                    active={!buttonsBlocked}
                    onClick={handleClicked}
                />
            )}
        </>
    );
};
