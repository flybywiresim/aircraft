// Copyright (c) 2025-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { AtcFmsMessages } from '@datalink/atc';
import { AtisMessage, AtsuMessage, Conversion, CpdlcMessage, DclMessage, OclMessage } from '@datalink/common';
import { EventSubscriber } from '@microsoft/msfs-sdk';

export class MessageStorage {
  public atisReports: Map<string, AtisMessage[]> = new Map();

  public atcMessagesBuffer: CpdlcMessage[] = [];

  public atcMonitoredMessages: CpdlcMessage[] = [];

  /**
   * Resynchronize a received ATC message with the message buffer.
   * Updates an existing message if the same messageID is found.
   * If no message found, a new message is inserted at the front of the message buffer.
   * @param {CpdlcMessage} message incoming CPDLC message
   */
  private resynchronizeAtcMessage(message: CpdlcMessage): void {
    const index = this.atcMessagesBuffer.findIndex((entry) => entry.UniqueMessageID === message.UniqueMessageID);
    if (index !== -1) {
      this.atcMessagesBuffer[index] = message;
    } else {
      this.atcMessagesBuffer.unshift(message);
    }
  }

  /**
   * Deletes a message from the given queue based on its uid.
   * @param {number} uid uid of the message to be deleted.
   * @param {T[]} queue the queue to search for the message
   * @returns {boolean} true if message is found and deleted
   */
  private deleteMessageFromQueue<T extends AtsuMessage>(uid: number, queue: T[]): boolean {
    const index = queue.findIndex((entry) => entry.UniqueMessageID === uid);
    if (index !== -1) {
      queue.splice(index, 1);
    }
    return index !== -1;
  }

  constructor(private readonly subscriber: EventSubscriber<AtcFmsMessages>) {
    this.subscriber.on('atcAtisReports').handle((reports) => {
      this.atisReports = new Map();

      reports.forEach((message) => {
        const enhancedMessage = Conversion.messageDataToMessage(message) as AtisMessage;
        if (this.atisReports.has(enhancedMessage.Reports[0].airport)) {
          this.atisReports.get(enhancedMessage.Reports[0].airport)?.push(enhancedMessage);
        } else {
          this.atisReports.set(enhancedMessage.Reports[0].airport, [enhancedMessage]);
        }
      });
    });
    this.subscriber.on('atcMonitoredMessages').handle((messages) => {
      this.atcMonitoredMessages = [];
      messages.forEach((message) =>
        this.atcMonitoredMessages.push(Conversion.messageDataToMessage(message) as CpdlcMessage),
      );
    });
    this.subscriber
      .on('atcResynchronizeCpdlcMessage')
      .handle((message) => this.resynchronizeAtcMessage(Conversion.messageDataToMessage(message) as CpdlcMessage));
    this.subscriber
      .on('atcResynchronizeDclMessage')
      .handle((message) => this.resynchronizeAtcMessage(Conversion.messageDataToMessage(message) as DclMessage));
    this.subscriber
      .on('atcResynchronizeOclMessage')
      .handle((message) => this.resynchronizeAtcMessage(Conversion.messageDataToMessage(message) as OclMessage));
    this.subscriber.on('atcDeleteMessage').handle((uid) => this.deleteMessageFromQueue(uid, this.atcMessagesBuffer));
  }

  /**
   * Wipes all existing ATIS reports.
   */
  public resetAtcData(): void {
    this.atisReports = new Map();
  }
}
