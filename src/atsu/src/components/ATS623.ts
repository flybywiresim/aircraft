import { FansMode } from '../com/FutureAirNavigationSystem';
import { Atsu } from '../ATSU';
import { AtsuMessage } from '../messages/AtsuMessage';
import { CpdlcMessage } from '../messages/CpdlcMessage';
import { CpdlcMessageExpectedResponseType, CpdlcMessagesUplink } from '../messages/CpdlcMessageElements';
import { DclMessage } from '../messages/DclMessage';
import { OclMessage } from '../messages/OclMessage';

// TODO reset internal states if flight state changes

export class ATS623 {
    private atsu: Atsu = null;

    private clearanceRequest: CpdlcMessage = null;

    constructor(atsu: Atsu) {
        this.atsu = atsu;
    }

    public isRelevantMessage(message: AtsuMessage): boolean {
        if (message instanceof DclMessage || message instanceof OclMessage) {
            return true;
        }

        if (message.Station !== this.clearanceRequest?.Station) {
            return false;
        }

        if (message instanceof CpdlcMessage) {
            const cpdlc = message as CpdlcMessage;
            // allow only freetext messages
            return cpdlc.Content.TypeId === 'UM183' || cpdlc.Content.TypeId === 'UM169';
        }

        return true;
    }

    public insertMessages(messages: AtsuMessage[]): void {
        const handledMessages: CpdlcMessage[] = [];

        messages.forEach((message) => {
            let processedMessage: AtsuMessage | CpdlcMessage = message;

            if (!(message instanceof CpdlcMessage)) {
                processedMessage = new CpdlcMessage();

                processedMessage.UniqueMessageID = message.UniqueMessageID;
                processedMessage.ComStatus = message.ComStatus;
                processedMessage.Confirmed = message.Confirmed;
                processedMessage.Direction = message.Direction;
                processedMessage.Timestamp = message.Timestamp;
                processedMessage.Network = message.Network;
                processedMessage.Station = message.Station;
                processedMessage.Message = message.Message;
                (processedMessage as CpdlcMessage).DcduRelevantMessage = true;
                (processedMessage as CpdlcMessage).PreviousTransmissionId = this.clearanceRequest.CurrentTransmissionId;
                if (this.atsu.atc.fansMode() === FansMode.FansA) {
                    (processedMessage as CpdlcMessage).Content = CpdlcMessagesUplink.UM169[1].deepCopy();
                } else {
                    (processedMessage as CpdlcMessage).Content = CpdlcMessagesUplink.UM183[1].deepCopy();
                }
                (processedMessage as CpdlcMessage).Content.Content[0].Value = message.Message;
                (processedMessage as CpdlcMessage).Content.ExpectedResponse = CpdlcMessageExpectedResponseType.No;
            }

            if (message instanceof DclMessage || message instanceof OclMessage) {
                // new clearance request sent
                this.clearanceRequest = message as CpdlcMessage;
            } else if (this.clearanceRequest instanceof DclMessage && this.atsu.destinationWaypoint()) {
                (processedMessage as CpdlcMessage).CloseAutomatically = false;

                // expect some clearance with TO DEST or SQWK/SQUAWK/SQK XXXX -> stop ATS run
                const regex = new RegExp(`.*TO @?(${this.atsu.destinationWaypoint().ident}){1}@?.*(SQWK|SQUAWK){1}.*`);
                if (regex.test(processedMessage.Message)) {
                    if ((processedMessage as CpdlcMessage).Content.ExpectedResponse === CpdlcMessageExpectedResponseType.No) {
                        (processedMessage as CpdlcMessage).Content.ExpectedResponse = CpdlcMessageExpectedResponseType.Roger;
                    }
                    this.clearanceRequest = null;
                } else if (/.*VIA TELEX.*/.test(processedMessage.Message)) {
                    // ignore "CLEARANCE DELIVERED VIA TELEX" in the DCDU
                    (processedMessage as CpdlcMessage).DcduRelevantMessage = false;
                }
            } else if (this.atsu.destinationWaypoint()) {
                (processedMessage as CpdlcMessage).CloseAutomatically = false;

                // oceanic clearance with CLRD TO -> stop ATS run
                const regex = new RegExp(`.*TO @?(${this.atsu.destinationWaypoint().ident}){1}@?`);
                if (regex.test(processedMessage.Message)) {
                    if ((processedMessage as CpdlcMessage).Content.ExpectedResponse === CpdlcMessageExpectedResponseType.No) {
                        (processedMessage as CpdlcMessage).Content.ExpectedResponse = CpdlcMessageExpectedResponseType.Roger;
                    }
                    this.clearanceRequest = null;
                }
            }

            handledMessages.push(processedMessage as CpdlcMessage);
        });

        this.atsu.atc.insertMessages(handledMessages);
    }
}
