//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { EventBus, EventSubscriber, Publisher } from '@microsoft/msfs-sdk';
import {
  AtsuStatusCodes,
  AtsuMailboxMessages,
  MailboxStatusMessage,
  AtsuMessage,
  AtsuMessageDirection,
  AtsuMessageType,
  CpdlcMessage,
  DclMessage,
  OclMessage,
} from '../../../common/src';
import { Atc } from '../ATC';
import { UplinkMessageStateMachine } from '../components/UplinkMessageStateMachine';

class MailboxMessage {
  public MessageId: number = 0;

  public Station: string = '';

  public MessageSent = false;

  public MessageRead = false;

  public PriorityMessage = false;

  public Status: MailboxStatusMessage = MailboxStatusMessage.NoMessage;

  public Direction: AtsuMessageDirection = null;
}

export class MailboxBus {
  private static MaxMailboxFileSize = 5;

  private publisher: Publisher<AtsuMailboxMessages> = null;

  private subscriber: EventSubscriber<AtsuMailboxMessages> = null;

  private atc: Atc = null;

  private downlinkMessages: MailboxMessage[][] = [];

  private uplinkMessages: MailboxMessage[][] = [];

  private bufferedDownlinkMessages: MailboxMessage[][] = [];

  private bufferedUplinkMessages: MailboxMessage[][] = [];

  private lastClosedMessage: [MailboxMessage[], number] = null;

  private recallMessageId: number | undefined = undefined;

  private atcRingInterval: number = null;

  private poweredUp: boolean = false;

  private uploadMessagesToMailbox(messages: CpdlcMessage[]): void {
    if (messages.length !== 0) {
      switch (messages[0].Type) {
        case AtsuMessageType.CPDLC:
          this.publisher.pub('cpdlcMessages', messages, true, false);
          break;
        case AtsuMessageType.DCL:
          this.publisher.pub('dclMessages', messages as DclMessage[], true, false);
          break;
        case AtsuMessageType.OCL:
          this.publisher.pub('oclMessages', messages as OclMessage[], true, false);
          break;
        default:
          break;
      }
    }
  }

  private closeMessage(
    messages: MailboxMessage[][],
    backlog: MailboxMessage[][],
    uid: number,
    uplink: boolean,
  ): boolean {
    const idx = messages.findIndex((elem) => elem[0].MessageId === uid);
    if (idx !== -1) {
      // validate that message exists in the queue
      const message = this.atc.messages().find((elem) => elem.UniqueMessageID === uid);

      if ((!this.lastClosedMessage || this.lastClosedMessage[0][0].MessageId !== uid) && message !== undefined) {
        this.lastClosedMessage = [messages[idx], new Date().getTime()];
      }

      messages.splice(idx, 1);
      if (uplink) {
        this.validateNotificationCondition();
      }

      // add buffered messages
      while (backlog.length !== 0 && messages.length !== MailboxBus.MaxMailboxFileSize) {
        const bufferedBlock = backlog.shift();
        const mailboxMessages = [];
        messages.push([]);

        bufferedBlock.forEach((data) => {
          const message = this.atc.messages().find((elem) => elem.UniqueMessageID === data.MessageId);
          if (message !== undefined) {
            messages[messages.length - 1].push(data);

            // pushed a new inbound message
            if (!data.MessageRead) {
              this.setupIntervals();
            }

            if ((message as CpdlcMessage).MailboxRelevantMessage) {
              mailboxMessages.push(message);
            }
          }
        });

        if (mailboxMessages.length !== 0) {
          this.uploadMessagesToMailbox(mailboxMessages);
        }
      }
    }

    return idx !== -1;
  }

  constructor(
    private readonly bus: EventBus,
    atc: Atc,
  ) {
    this.atc = atc;

    this.atc.digitalInputs.addDataCallback('onAtcMessageButtonPressed', () => this.cleanupNotifications());
    this.publisher = this.bus.getPublisher<AtsuMailboxMessages>();
    this.subscriber = this.bus.getSubscriber<AtsuMailboxMessages>();

    this.subscriber.on('deleteMessage').handle((uid: number) => {
      let idx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === uid);
      if (idx > -1) {
        this.uplinkMessages[idx].forEach((message) => {
          this.atc.removeMessage(message.MessageId);
        });
      } else {
        idx = this.downlinkMessages.findIndex((elem) => elem[0].MessageId === uid);
        if (idx > -1) {
          this.downlinkMessages[idx].forEach((message) => {
            this.atc.removeMessage(message.MessageId);
          });
        }
      }
    });

    this.subscriber.on('uplinkResponse').handle((data: { uid: number; responseId: number }) => {
      if (!this.poweredUp) return;

      const idx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === data.uid);
      if (idx > -1) {
        // iterate in reverse order to ensure that the "identification" message is the last message in the queue
        // ensures that the Mailbox-status change to SENT is done after every message is sent
        this.uplinkMessages[idx]
          .slice()
          .reverse()
          .forEach((message) => {
            this.atc.sendResponse(message.MessageId, data.responseId);
          });
      }
    });

    this.subscriber.on('downlinkTransmit').handle((uid: number) => {
      if (!this.poweredUp) return;

      let idx = this.downlinkMessages.findIndex((elem) => elem[0].MessageId === uid);
      if (idx > -1) {
        // iterate in reverse order to ensure that the "identification" message is the last message in the queue
        // ensures that the Mailbox-status change to SENT is done after every message is sent
        this.downlinkMessages[idx]
          .slice()
          .reverse()
          .forEach((entry) => {
            const message = this.atc.messages().find((element) => element.UniqueMessageID === entry.MessageId);
            if (message !== undefined) {
              if (message.Direction === AtsuMessageDirection.Downlink) {
                this.atc.sendMessage(message).then((code) => {
                  if (code !== AtsuStatusCodes.Ok) {
                    this.atc.digitalOutputs.sendSystemStatus(code);
                  }
                });
              }
            }
          });

        return;
      }

      idx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === uid);
      if (idx > -1) {
        const message = this.atc.messages().find((element) => element.UniqueMessageID === uid);
        if (message !== undefined) {
          const cpdlcMessage = message as CpdlcMessage;
          if (cpdlcMessage.Response && cpdlcMessage.SemanticResponseRequired) {
            this.atc.sendExistingResponse(uid);
          }
        }
      }
    });

    this.subscriber.on('modifyMessage').handle((uid: number) => {
      if (!this.poweredUp) return;

      const idx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === uid);
      if (idx > -1) {
        const message = this.atc.messages().find((element) => element.UniqueMessageID === uid);
        if (message !== undefined) {
          this.atc.digitalOutputs.sendMessageModify(message as CpdlcMessage);
        }
      }
    });

    this.subscriber.on('printMessage').handle((uid: number) => {
      if (!this.poweredUp) return;

      const message = this.atc.messages().find((element) => element.UniqueMessageID === uid);
      if (message !== undefined) {
        this.publisher.pub('systemStatus', MailboxStatusMessage.Printing, true, false);
        this.atc.digitalOutputs.sendPrintMessage(message);
        window.setTimeout(() => {
          if (this.currentMessageStatus(uid) === MailboxStatusMessage.Printing) {
            this.publisher.pub('systemStatus', MailboxStatusMessage.NoMessage, true, false);
          }
        }, 4500);
      }
    });

    this.subscriber.on('closeMessage').handle((uid: number) => {
      if (!this.closeMessage(this.uplinkMessages, this.bufferedUplinkMessages, uid, true)) {
        this.closeMessage(this.downlinkMessages, this.bufferedDownlinkMessages, uid, false);
      }
    });

    this.subscriber.on('updateMessageMonitoring').handle((uid: number) => {
      if (!this.poweredUp) return;

      const message = this.atc.messages().find((element) => element.UniqueMessageID === uid);
      UplinkMessageStateMachine.update(this.atc, message as CpdlcMessage, true, true);
      this.update(message as CpdlcMessage);
    });

    this.subscriber.on('stopMessageMonitoring').handle((uid: number) => {
      const message = this.atc.messages().find((element) => element.UniqueMessageID === uid);
      UplinkMessageStateMachine.update(this.atc, message as CpdlcMessage, true, false);
      this.update(message as CpdlcMessage);
    });

    this.subscriber.on('recallMessage').handle(() => {
      if (!this.poweredUp) return;

      if (!this.lastClosedMessage) {
        this.publisher.pub('systemStatus', MailboxStatusMessage.RecallEmpty, true, false);
      } else {
        const currentStamp = new Date().getTime();
        // timed out after five minutes
        if (currentStamp - this.lastClosedMessage[1] > 300000) {
          this.publisher.pub('systemStatus', MailboxStatusMessage.RecallEmpty, true, false);
          this.lastClosedMessage = undefined;
        } else {
          const messages: CpdlcMessage[] = [];

          this.lastClosedMessage[0].forEach((mailboxMessage) => {
            const msg = this.atc.messages().find((elem) => elem.UniqueMessageID === mailboxMessage.MessageId);
            if (msg !== undefined) {
              messages.push(msg as CpdlcMessage);
            }
          });

          messages[0].CloseAutomatically = false;
          this.recallMessageId = messages[0].UniqueMessageID;

          this.uploadMessagesToMailbox(messages);
          if (this.lastClosedMessage[0][0].Direction === AtsuMessageDirection.Downlink) {
            this.downlinkMessages.push(this.lastClosedMessage[0]);
          } else {
            this.uplinkMessages.push(this.lastClosedMessage[0]);
          }
          this.updateMessageStatus(messages[0].UniqueMessageID, MailboxStatusMessage.RecallMode);
        }
      }
    });

    this.subscriber.on('readMessage').handle((uid: number) => {
      if (!this.poweredUp) return;

      const idx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === uid);
      if (idx !== -1) {
        this.uplinkMessages[idx][0].MessageRead = true;
        this.validateNotificationCondition();
      }
    });

    this.subscriber.on('invertSemanticResponse').handle((uid: number) => {
      if (!this.poweredUp) return;

      const message = this.atc.messages().find((element) => element.UniqueMessageID === uid);
      if (message !== undefined) {
        UplinkMessageStateMachine.update(this.atc, message as CpdlcMessage, true, false);
        this.uploadMessagesToMailbox([message as CpdlcMessage]);
      }
    });

    this.subscriber.on('visibleMessage').handle((uid: number) => {
      if (!this.poweredUp) return;

      this.atc.updateShownMessageInMailbox(uid, uid === this.recallMessageId);
    });
  }

  private validateNotificationCondition() {
    // check if the ring tone is still needed
    let unreadMessages = false;
    this.uplinkMessages.forEach((elem) => {
      if (!elem[0].MessageRead) {
        unreadMessages = true;
      }
    });

    if (!unreadMessages) {
      this.cleanupNotifications();
    }
  }

  private estimateRingInterval() {
    let interval = 15000;

    this.uplinkMessages.forEach((elem) => {
      if (!elem[0].MessageRead) {
        if (elem[0].PriorityMessage) {
          interval = Math.min(interval, 5000);
        } else {
          interval = Math.min(interval, 15000);
        }
      }
    });

    return interval;
  }

  private cleanupNotifications() {
    this.atc.digitalOutputs.resetButton();

    if (this.atcRingInterval) {
      clearInterval(this.atcRingInterval);
      this.atcRingInterval = null;
    }
  }

  private setupIntervals() {
    if (this.atcRingInterval) {
      clearInterval(this.atcRingInterval);
    }

    // call the first ring tone
    this.atc.digitalOutputs.activateAtcRing();

    // start the ring tone interval
    this.atcRingInterval = window.setInterval(
      () => this.atc.digitalOutputs.activateAtcRing(),
      this.estimateRingInterval(),
    );
  }

  public powerUp(): void {
    this.recallMessageId = undefined;
    this.poweredUp = true;
  }

  public powerDown(): void {
    this.recallMessageId = undefined;
    this.poweredUp = false;
  }

  public reset() {
    this.recallMessageId = undefined;
    this.publisher.pub('resetSystem', true, true, false);
  }

  public setAtcLogonMessage(message: string) {
    this.publisher.pub('logonMessage', message, true, false);
  }

  public enqueue(messages: AtsuMessage[]) {
    if (messages.length === 0) {
      return;
    }

    const mailboxBlocks: MailboxMessage[] = [];
    messages.forEach((message) => {
      const block = new MailboxMessage();
      block.MessageId = message.UniqueMessageID;
      block.MessageRead = message.Direction === AtsuMessageDirection.Downlink;
      block.Station = message.Station;
      block.Direction = message.Direction;
      block.PriorityMessage = (message as CpdlcMessage).Content[0]?.Urgent;
      mailboxBlocks.push(block);
    });

    if (
      mailboxBlocks[0].Direction === AtsuMessageDirection.Downlink &&
      this.downlinkMessages.length < MailboxBus.MaxMailboxFileSize
    ) {
      this.downlinkMessages.push(mailboxBlocks);
    } else if (
      mailboxBlocks[0].Direction === AtsuMessageDirection.Uplink &&
      this.uplinkMessages.length < MailboxBus.MaxMailboxFileSize
    ) {
      this.uplinkMessages.push(mailboxBlocks);
      this.atc.digitalOutputs.activateButton();
      this.setupIntervals();
    } else {
      if (mailboxBlocks[0].Direction === AtsuMessageDirection.Downlink) {
        this.bufferedDownlinkMessages.push(mailboxBlocks);
        this.publisher.pub('systemStatus', MailboxStatusMessage.MaximumDownlinkMessages, true, false);
        this.atc.digitalOutputs.sendSystemStatus(AtsuStatusCodes.MailboxFull);
      } else {
        this.bufferedUplinkMessages.push(mailboxBlocks);
        this.publisher.pub('systemStatus', MailboxStatusMessage.AnswerRequired, true, false);
      }
      return;
    }

    this.uploadMessagesToMailbox(messages as CpdlcMessage[]);
  }

  public update(message: CpdlcMessage, insertIfNeeded: boolean = false) {
    // the assumption is that the first message in the block is the UID for the complete block

    const uplinkIdx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === message.UniqueMessageID);
    if (uplinkIdx !== -1) {
      const messages = [];

      // create all messages and overwrite the first because this is the updated
      this.uplinkMessages[uplinkIdx].forEach((mailboxMessage) => {
        const msg = this.atc.messages().find((elem) => elem.UniqueMessageID === mailboxMessage.MessageId);
        if (msg !== undefined) {
          if (message.UniqueMessageID !== msg.UniqueMessageID) {
            messages.push(msg as CpdlcMessage);
          } else {
            messages.push(message);
          }
        }
      });

      this.uploadMessagesToMailbox(messages as CpdlcMessage[]);
      return;
    }

    const downlinkIdx = this.downlinkMessages.findIndex((elem) => elem[0].MessageId === message.UniqueMessageID);
    if (downlinkIdx !== -1) {
      const messages = [];

      // create all messages and overwrite the first because this is the updated
      this.downlinkMessages[downlinkIdx].forEach((mailboxMessage) => {
        const msg = this.atc.messages().find((elem) => elem.UniqueMessageID === mailboxMessage.MessageId);
        if (message.UniqueMessageID !== msg.UniqueMessageID) {
          messages.push(msg as CpdlcMessage);
        } else {
          messages.push(message);
        }
      });
      messages[0] = message;

      this.uploadMessagesToMailbox(messages as CpdlcMessage[]);
      return;
    }

    if (insertIfNeeded) {
      this.enqueue([message]);
    }
  }

  public dequeue(uid: number) {
    // the assumption is that the first message in the block is the UID for the complete block
    let idx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === uid);
    if (idx !== -1) {
      this.publisher.pub('deleteMessage', uid, true, false);
    } else {
      idx = this.downlinkMessages.findIndex((elem) => elem[0].MessageId === uid);
      if (idx !== -1) {
        this.publisher.pub('deleteMessage', uid, true, false);
      }
    }
  }

  public updateMessageStatus(uid: number, status: MailboxStatusMessage): void {
    // the assumption is that the first message in the block is the UID for the complete block
    const uplinkIdx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === uid);
    if (uplinkIdx !== -1) {
      this.uplinkMessages[uplinkIdx][0].Status = status;
      this.publisher.pub('messageStatus', { uid, status }, true, false);
      return;
    }

    const downlinkIdx = this.downlinkMessages.findIndex((elem) => elem[0].MessageId === uid);
    if (downlinkIdx !== -1) {
      this.downlinkMessages[downlinkIdx][0].Status = status;
      this.publisher.pub('messageStatus', { uid, status }, true, false);
    }
  }

  public currentMessageStatus(uid: number): MailboxStatusMessage {
    let idx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === uid);
    if (idx !== -1) {
      return this.uplinkMessages[idx][0].Status;
    }

    idx = this.downlinkMessages.findIndex((elem) => elem[0].MessageId === uid);
    if (idx !== -1) {
      return this.downlinkMessages[idx][0].Status;
    }

    return MailboxStatusMessage.NoMessage;
  }

  public openMessagesForStation(station: string): boolean {
    let retval = false;

    this.uplinkMessages.forEach((block) => {
      if (!block[0].MessageSent && block[0].Station === station) retval = true;
    });

    if (!retval) {
      this.downlinkMessages.forEach((block) => {
        if (!block[0].MessageSent && block[0].Station === station) retval = true;
      });
    }

    if (!retval) {
      this.bufferedUplinkMessages.forEach((block) => {
        if (!block[0].MessageSent && block[0].Station === station) retval = true;
      });
    }

    if (!retval) {
      this.bufferedDownlinkMessages.forEach((block) => {
        if (!block[0].MessageSent && block[0].Station === station) retval = true;
      });
    }

    return retval;
  }
}
