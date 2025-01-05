//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  FansMode,
  AtsuMessage,
  CpdlcMessage,
  CpdlcMessageExpectedResponseType,
  CpdlcMessagesUplink,
  DclMessage,
  OclMessage,
  AtsuMessageType,
} from '../../../common/src';
import { Atc } from '../ATC';

// TODO reset internal states if flight state changes

export class ATS623 {
  private clearanceRequest: CpdlcMessage = null;

  constructor(private readonly atc: Atc) {}

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
      return cpdlc.Content[0].TypeId === 'UM183' || cpdlc.Content[0].TypeId === 'UM169';
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
        (processedMessage as CpdlcMessage).MailboxRelevantMessage = true;
        (processedMessage as CpdlcMessage).PreviousTransmissionId = this.clearanceRequest.CurrentTransmissionId;
        if (this.atc.fansMode() === FansMode.FansA) {
          (processedMessage as CpdlcMessage).Content = [CpdlcMessagesUplink.UM169[1].deepCopy()];
        } else {
          (processedMessage as CpdlcMessage).Content = [CpdlcMessagesUplink.UM183[1].deepCopy()];
        }
        (processedMessage as CpdlcMessage).Content[0].Content[0].Value = message.Message;
        (processedMessage as CpdlcMessage).Content[0].ExpectedResponse = CpdlcMessageExpectedResponseType.No;
      }

      if (message instanceof DclMessage || message instanceof OclMessage) {
        // new clearance request sent
        this.clearanceRequest = message as CpdlcMessage;
      } else if (
        this.clearanceRequest instanceof DclMessage &&
        this.atc.digitalInputs.FlightRoute &&
        this.atc.digitalInputs.FlightRoute.destination
      ) {
        (processedMessage as CpdlcMessage).CloseAutomatically = false;

        // expect some clearance with TO DEST or SQWK/SQUAWK/SQK XXXX -> stop ATS run
        const regex = new RegExp(
          `.*TO @?(${this.atc.digitalInputs.FlightRoute.destination.ident}){1}@?.*(SQWK|SQUAWK){1}.*`,
        );
        if (regex.test(processedMessage.Message)) {
          if ((processedMessage as CpdlcMessage).Content[0].ExpectedResponse === CpdlcMessageExpectedResponseType.No) {
            (processedMessage as CpdlcMessage).Content[0].ExpectedResponse = CpdlcMessageExpectedResponseType.Roger;
          }
          this.clearanceRequest = null;
        } else if (/.*VIA TELEX.*/.test(processedMessage.Message)) {
          // ignore "CLEARANCE DELIVERED VIA TELEX" in the Mailbox
          (processedMessage as CpdlcMessage).MailboxRelevantMessage = false;
        }
      } else if (this.atc.digitalInputs.FlightRoute && this.atc.digitalInputs.FlightRoute.destination) {
        (processedMessage as CpdlcMessage).CloseAutomatically = false;

        // oceanic clearance with CLRD TO -> stop ATS run
        const regex = new RegExp(`.*TO @?(${this.atc.digitalInputs.FlightRoute.destination.ident}){1}@?`);
        if (regex.test(processedMessage.Message)) {
          if ((processedMessage as CpdlcMessage).Content[0].ExpectedResponse === CpdlcMessageExpectedResponseType.No) {
            (processedMessage as CpdlcMessage).Content[0].ExpectedResponse = CpdlcMessageExpectedResponseType.Roger;
          }
          this.clearanceRequest = null;
        }
      }

      handledMessages.push(processedMessage as CpdlcMessage);
      if (message.Type <= AtsuMessageType.AOC) {
        this.atc.digitalOutputs.sendAocIgnoreMessageId(processedMessage.UniqueMessageID);
      }
    });

    this.atc.insertMessages(handledMessages);
  }
}
