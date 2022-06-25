import { DcduStatusMessage } from '@atsu/components/DcduLink';
import React from 'react';

type AtsuStatusMessageProps = {
    visibleMessage: DcduStatusMessage;
    systemMessage: DcduStatusMessage;
}

const translateStatusMessage = (status: DcduStatusMessage) => {
    switch (status) {
    case DcduStatusMessage.AnswerRequired:
        return 'ANSWER MSG';
    case DcduStatusMessage.CommunicationFault:
        return 'COM FAULT';
    case DcduStatusMessage.CommunicationNotAvailable:
        return 'COM NOT AVAIL';
    case DcduStatusMessage.CommunicationNotInitialized:
        return 'COM NOT INIT';
    case DcduStatusMessage.MaximumDownlinkMessages:
        return 'FILE FULL';
    case DcduStatusMessage.LinkLost:
        return 'LINK LOST';
    case DcduStatusMessage.FlightplanLoadFailed:
        return 'LOAD FAILED';
    case DcduStatusMessage.FlightplanLoadPartial:
        return 'LOAD PARTIAL';
    case DcduStatusMessage.FlightplanLoadingUnavailable:
        return 'LOAD UNAVAIL';
    case DcduStatusMessage.MonitoringFailed:
        return 'MONIT FAILED';
    case DcduStatusMessage.MonitoringLost:
        return 'MONIT LOST';
    case DcduStatusMessage.MonitoringUnavailable:
        return 'MONIT UNAVAIL';
    case DcduStatusMessage.NoAtcReply:
        return 'NO ATC REPLY';
    case DcduStatusMessage.OverflowClosed:
        return 'OVERFLW CLOSED';
    case DcduStatusMessage.PrintFailed:
        return 'PRINT FAILED';
    case DcduStatusMessage.PriorityMessage:
        return 'PRIORITY MSG';
    case DcduStatusMessage.SendFailed:
        return 'SEND FAILED';
    case DcduStatusMessage.FlightplanLoadSecondary:
        return 'LOAD SEC OK';
    case DcduStatusMessage.FlightplanLoadingSecondary:
        return 'LOADING SEC';
    case DcduStatusMessage.McduForText:
        return 'MCDU FOR TEXT';
    case DcduStatusMessage.McduForModification:
        return 'MCDU FOR MODIF';
    case DcduStatusMessage.MonitoringCancelled:
        return 'MONIT CNCLD';
    case DcduStatusMessage.Monitoring:
        return 'MONITORING';
    case DcduStatusMessage.NoFmData:
        return 'NO FM DATA';
    case DcduStatusMessage.NoMoreMessages:
        return 'NO MORE MSG';
    case DcduStatusMessage.NoMorePages:
        return 'NO MORE PGE';
    case DcduStatusMessage.PartialFmgsData:
        return 'PARTIAL DATA';
    case DcduStatusMessage.Printing:
        return 'PRINTING';
    case DcduStatusMessage.RecallMode:
        return 'RECALL MODE';
    case DcduStatusMessage.RecallEmpty:
        return (
            <>
                <tspan>RECALL EMPTY</tspan>
                <tspan x="50%" dy={200}>CONSULT MSG RECORD</tspan>
            </>
        );
    case DcduStatusMessage.Reminder:
        return 'REMINDER';
    case DcduStatusMessage.Sending:
        return 'SENDING';
    case DcduStatusMessage.Sent:
        return 'SENT';
    case DcduStatusMessage.WaitFmData:
        return 'WAIT FM DATA';
    case DcduStatusMessage.NoMessage:
    default:
        return '';
    }
};

export const AtsuStatusMessage: React.FC<AtsuStatusMessageProps> = ({ visibleMessage, systemMessage }) => {
    if (visibleMessage === DcduStatusMessage.NoMessage && systemMessage === DcduStatusMessage.NoMessage) {
        return <></>;
    }

    let textFill = 'rgb(255,255,255)';
    if (systemMessage !== DcduStatusMessage.NoMessage) {
        if (systemMessage <= DcduStatusMessage.SendFailed) {
            textFill = 'rgb(255,191,0)';
        }
    } else if (visibleMessage !== DcduStatusMessage.NoMessage) {
        if (visibleMessage <= DcduStatusMessage.SendFailed) {
            textFill = 'rgb(255,191,0)';
        }
    }

    return (
        <>
            <g>
                <text className="status-atsu" fill={textFill} x="50%" y="2160">{translateStatusMessage(systemMessage !== DcduStatusMessage.NoMessage ? systemMessage : visibleMessage)}</text>
            </g>
        </>
    );
};
