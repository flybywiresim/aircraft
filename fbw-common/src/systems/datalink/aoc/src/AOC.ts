//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { EventBus } from '@microsoft/msfs-sdk';
import {
  AtsuStatusCodes,
  AtsuMessageDirection,
  AtsuMessage,
  WeatherMessage,
  AtisType,
  AtsuTimestamp,
} from '../../common/src';
import { DigitalInputs } from './DigitalInputs';
import { DigitalOutputs } from './DigitalOutputs';

/**
 * Defines the AOC
 */
export class Aoc {
  private poweredUp: boolean = false;

  private messageCounter: number = 0;

  private digitalInputs: DigitalInputs = null;

  private digitalOutputs: DigitalOutputs = null;

  private messageQueueUplink: AtsuMessage[] = [];

  private messageQueueDownlink: AtsuMessage[] = [];

  private blacklistedMessageIds: number[] = [];

  constructor(
    private bus: EventBus,
    synchronizedRouter: boolean,
  ) {
    this.digitalInputs = new DigitalInputs(this.bus);
    this.digitalOutputs = new DigitalOutputs(this.bus, synchronizedRouter);

    this.digitalInputs.addDataCallback('sendFreetextMessage', (message) => this.sendMessage(message));
    this.digitalInputs.addDataCallback('requestAtis', (icao, type, sentCallback) =>
      this.receiveAtis(icao, type, sentCallback),
    );
    this.digitalInputs.addDataCallback('requestWeather', (icaos, requestMetar, sentCallback) =>
      this.receiveWeather(requestMetar, icaos, sentCallback),
    );
    this.digitalInputs.addDataCallback('registerMessages', (messages) => this.insertMessages(messages));
    this.digitalInputs.addDataCallback('messageRead', (messageId) => this.messageRead(messageId));
    this.digitalInputs.addDataCallback('removeMessage', (messageId) => this.removeMessage(messageId));
    this.digitalInputs.addDataCallback('receivedFreetextMessage', (message) => this.insertMessages([message]));
    this.digitalInputs.addDataCallback('ignoreIncomingMessage', (uid: number) => {
      const index = this.messageQueueUplink.findIndex((message) => message.UniqueMessageID === uid);
      if (index !== -1) {
        this.removeMessage(uid);
      } else {
        this.blacklistedMessageIds.push(uid);
      }
    });
  }

  public powerUp(): void {
    this.digitalInputs.powerUp();
    this.poweredUp = true;
  }

  public powerDown(): void {
    this.digitalOutputs.powerDown();
    this.digitalInputs.powerDown();
    this.messageQueueUplink = [];
    this.messageQueueDownlink = [];
    this.poweredUp = false;
  }

  public initialize(): void {
    this.digitalInputs.initialize();
  }

  private updateMessageCount(): void {
    const msgCount = this.messageQueueUplink.reduce((c, m) => (!m.Confirmed ? c + 1 : c), 0);
    this.digitalOutputs.setCompanyMessageCount(msgCount);
  }

  private async sendMessage(message: AtsuMessage): Promise<AtsuStatusCodes> {
    if (this.poweredUp) {
      return this.digitalOutputs.sendMessage(message, false).then((code) => {
        if (code === AtsuStatusCodes.Ok) this.insertMessages([message]);
        return code;
      });
    }

    return AtsuStatusCodes.ComFailed;
  }

  private removeMessage(uid: number): void {
    let index = this.messageQueueUplink.findIndex((element) => element.UniqueMessageID === uid);
    if (index !== -1) {
      const updateCount = this.messageQueueUplink[index].Confirmed === false;

      this.messageQueueUplink.splice(index, 1);
      this.digitalOutputs.deleteMessage(uid);

      if (updateCount) {
        this.updateMessageCount();
      }
    } else {
      index = this.messageQueueDownlink.findIndex((element) => element.UniqueMessageID === uid);
      if (index !== -1) {
        this.messageQueueDownlink.splice(index, 1);
        this.digitalOutputs.deleteMessage(uid);
      }
    }
  }

  private async receiveWeather(
    requestMetar: boolean,
    icaos: string[],
    sentCallback: () => void,
  ): Promise<[AtsuStatusCodes, WeatherMessage]> {
    if (!this.poweredUp) return [AtsuStatusCodes.ComFailed, null];
    if (requestMetar) return this.digitalOutputs.receiveMetar(icaos, sentCallback);
    return this.digitalOutputs.receiveTaf(icaos, sentCallback);
  }

  private async receiveAtis(
    icao: string,
    type: AtisType,
    sentCallback: () => void,
  ): Promise<[AtsuStatusCodes, WeatherMessage]> {
    if (!this.poweredUp) return [AtsuStatusCodes.ComFailed, null];
    return this.digitalOutputs.receiveAtis(icao, type, sentCallback);
  }

  private messageRead(uid: number): void {
    const index = this.messageQueueUplink.findIndex((element) => element.UniqueMessageID === uid);
    if (index !== -1) {
      const updateCount = this.messageQueueUplink[index].Confirmed === false;

      this.messageQueueUplink[index].Confirmed = true;
      this.digitalOutputs.resynchronizeAocMessage(this.messageQueueUplink[index]);

      if (updateCount) {
        this.updateMessageCount();
      }
    }
  }

  private insertMessages(messages: AtsuMessage[]): void {
    messages.forEach((message) => {
      message.UniqueMessageID = ++this.messageCounter;
      message.Timestamp = AtsuTimestamp.fromClock(this.digitalInputs.UtcClock);

      if (message.Direction === AtsuMessageDirection.Uplink) {
        const index = this.blacklistedMessageIds.findIndex((uid) => uid === message.UniqueMessageID);

        if (index === -1) {
          this.messageQueueUplink.unshift(message);
          this.updateMessageCount();
        } else {
          this.blacklistedMessageIds.splice(index, 1);
        }
      } else {
        this.messageQueueDownlink.unshift(message);
      }

      this.digitalOutputs.resynchronizeAocMessage(message);
    });
  }
}
