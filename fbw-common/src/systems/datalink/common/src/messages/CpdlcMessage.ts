//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuTimestamp } from './AtsuTimestamp';
import {
  AtsuMessageNetwork,
  AtsuMessageType,
  AtsuMessageDirection,
  AtsuMessageSerializationFormat,
  AtsuMessage,
} from './AtsuMessage';
import { CpdlcMessageElement, CpdlcMessagesDownlink, CpdlcMessagesUplink } from './CpdlcMessageElements';
import { wordWrap } from '../components/Convert';

export enum CpdlcMessageMonitoringState {
  Ignored = 0,
  Required = 1,
  Monitoring = 2,
  Cancelled = 3,
  Finished = 4,
}

/**
 * Defines the general freetext message format
 */
export class CpdlcMessage extends AtsuMessage {
  public Content: CpdlcMessageElement[] = [];

  public Response: CpdlcMessage = null;

  public CurrentTransmissionId = -1;

  public PreviousTransmissionId = -1;

  public MailboxRelevantMessage = true;

  public CloseAutomatically = true;

  public MessageMonitoring = CpdlcMessageMonitoringState.Ignored;

  public SemanticResponseRequired = false;

  public ReminderTimestamp: AtsuTimestamp = null;

  constructor() {
    super();
    this.Type = AtsuMessageType.CPDLC;
    this.Network = AtsuMessageNetwork.Hoppie;
    this.Direction = AtsuMessageDirection.Downlink;
  }

  public static deserialize(
    jsonData: Record<string, unknown> | CpdlcMessage,
    message: CpdlcMessage = null,
  ): CpdlcMessage {
    if (message === null) message = new CpdlcMessage();

    AtsuMessage.deserialize(jsonData, message);

    (jsonData.Content as CpdlcMessageElement[]).forEach((element) =>
      message.Content.push(CpdlcMessageElement.deserialize(element)),
    );
    if (jsonData.Response) {
      message.Response = CpdlcMessage.deserialize(jsonData.Response as Record<string, unknown>);
    }
    message.CurrentTransmissionId = jsonData.CurrentTransmissionId as number;
    message.PreviousTransmissionId = jsonData.PreviousTransmissionId as number;
    message.MailboxRelevantMessage = jsonData.MailboxRelevantMessage as boolean;
    message.CloseAutomatically = jsonData.CloseAutomatically as boolean;
    message.MessageMonitoring = jsonData.MessageMonitoring as CpdlcMessageMonitoringState;
    message.SemanticResponseRequired = jsonData.SemanticResponseRequired as boolean;
    if (jsonData.ReminderTimestamp) {
      message.ReminderTimestamp = AtsuTimestamp.deserialize(jsonData.ReminderTimestamp as Record<string, unknown>);
    }

    return message;
  }

  protected serializeContent(
    format: AtsuMessageSerializationFormat,
    template: string,
    element: CpdlcMessageElement,
  ): string {
    let content: string = '';

    content = template;
    element.Content.forEach((entry) => {
      const idx = content.indexOf('%s');
      if (format === AtsuMessageSerializationFormat.Network) {
        content = `${content.substring(0, idx)}${entry.Value}${content.substring(idx + 2)}`;
      } else if (entry.Value !== '') {
        if (element.TypeId === 'UM169' || element.TypeId === 'UM183') {
          // do not add '@' to freetext messages as we keep the
          content = entry.Value;
        } else if (
          this.MessageMonitoring === CpdlcMessageMonitoringState.Monitoring &&
          format === AtsuMessageSerializationFormat.FmsDisplayMonitored
        ) {
          content = `${content.substring(0, idx)}{magenta}${entry.Value}{end}${content.substring(idx + 2)}`;
        } else {
          content = `${content.substring(0, idx)}@${entry.Value}@${content.substring(idx + 2)}`;
        }
      } else {
        content = `${content.substring(0, idx)}[      ]${content.substring(idx + 2)}`;
      }
    });

    return content;
  }

  protected extendSerializationWithResponse(): boolean {
    if (!this.Response || this.Response.Content.length === 0) {
      return false;
    }

    // ignore the standard responses
    return (
      this.Response.Content[0]?.TypeId !== 'DM0' &&
      this.Response.Content[0]?.TypeId !== 'DM1' &&
      this.Response.Content[0]?.TypeId !== 'DM2' &&
      this.Response.Content[0]?.TypeId !== 'DM3' &&
      this.Response.Content[0]?.TypeId !== 'DM4' &&
      this.Response.Content[0]?.TypeId !== 'DM5' &&
      this.Response.Content[0]?.TypeId !== 'UM0' &&
      this.Response.Content[0]?.TypeId !== 'UM1' &&
      this.Response.Content[0]?.TypeId !== 'UM3' &&
      this.Response.Content[0]?.TypeId !== 'UM4' &&
      this.Response.Content[0]?.TypeId !== 'UM5'
    );
  }

  public serialize(format: AtsuMessageSerializationFormat) {
    const lineLength = format === AtsuMessageSerializationFormat.Mailbox ? 30 : 25;
    const lines: string[] = [];
    let message: string = '';

    if (this.Content.length !== 0) {
      for (const element of this.Content) {
        if (this.Direction === AtsuMessageDirection.Downlink) {
          lines.push(
            ...wordWrap(
              this.serializeContent(format, CpdlcMessagesDownlink[element.TypeId][0][0], element),
              lineLength,
            ),
          );
        } else {
          lines.push(
            ...wordWrap(this.serializeContent(format, CpdlcMessagesUplink[element.TypeId][0][0], element), lineLength),
          );
        }
      }
    } else {
      this.Message.split('_').forEach((entry) => {
        lines.push(...wordWrap(entry, lineLength));
      });
    }

    if (format === AtsuMessageSerializationFormat.Network) {
      message = `/data2/${this.CurrentTransmissionId}/${this.PreviousTransmissionId !== -1 ? this.PreviousTransmissionId : ''}/${this.Content[0]?.ExpectedResponse}/${lines.join(' ')}`;
    } else if (format === AtsuMessageSerializationFormat.Mailbox) {
      message = lines.join('\n');
    } else if (
      format === AtsuMessageSerializationFormat.FmsDisplay ||
      format === AtsuMessageSerializationFormat.FmsDisplayMonitored
    ) {
      if (this.Direction === AtsuMessageDirection.Uplink) {
        message += `{cyan}${this.Timestamp.mailboxTimestamp()} FROM ${this.Station}{end}\n`;
      } else {
        message += `{cyan}${this.Timestamp.mailboxTimestamp()} TO ${this.Station}{end}\n`;
      }

      lines.forEach((line) => {
        line = line.replace(/@/gi, '');
        if (format === AtsuMessageSerializationFormat.FmsDisplayMonitored) {
          message += line;
        } else {
          message += `{green}${line}{end}\n`;
        }
      });

      message += '{white}------------------------{end}\n';

      if (this.extendSerializationWithResponse()) {
        message += this.Response.serialize(format);
      }
    } else if (format === AtsuMessageSerializationFormat.Printer) {
      message += `${this.Timestamp.mailboxTimestamp()} ${this.Direction === AtsuMessageDirection.Uplink ? 'FROM' : 'TO'} ${this.Station}}\n`;

      lines.forEach((line) => {
        line = line.replace(/@/gi, '');
        message += `${line}\n`;
      });

      message += '------------------------\n';

      if (this.extendSerializationWithResponse()) {
        message += this.Response.serialize(format);
      }
    } else {
      message = this.Message;
    }

    return message;
  }
}
