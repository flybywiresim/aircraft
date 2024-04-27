//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { EventBus, EventSubscriber, Publisher } from '@microsoft/msfs-sdk';
import { AocFmsMessages, FmsAocMessages } from './databus/FmsBus';
import { FreetextMessage } from '../../common/src/messages/FreetextMessage';
import { AtsuStatusCodes } from '../../common/src/AtsuStatusCodes';
import { AtisType } from '../../common/src/messages/AtisMessage';
import { WeatherMessage } from '../../common/src/messages/WeatherMessage';
import { AtsuMessage } from '../../common/src/messages/AtsuMessage';
import { AtcAocMessages } from '../../atc/src/databus/AtcAocBus';
import { FwcDataBusTypes } from '../../common/src/databus/FwcBus';
import { ClockDataBusTypes } from '../../common/src/databus/ClockBus';
import { RouterAtcAocMessages } from '../../router/src';
import { Clock } from '../../common/src/types/Clock';

export type AocDigitalInputCallbacks = {
  receivedFreetextMessage: (message: FreetextMessage) => void;
  ignoreIncomingMessage: (uid: number) => void;
  sendFreetextMessage: (message: FreetextMessage) => Promise<AtsuStatusCodes>;
  requestAtis: (icao: string, type: AtisType, sentCallback: () => void) => Promise<[AtsuStatusCodes, WeatherMessage]>;
  requestWeather: (
    icaos: string[],
    requestMetar: boolean,
    sentCallback: () => void,
  ) => Promise<[AtsuStatusCodes, WeatherMessage]>;
  registerMessages: (messages: AtsuMessage[]) => void;
  messageRead: (messageId: number) => void;
  removeMessage: (messageId: number) => void;
};

export class DigitalInputs {
  private callbacks: AocDigitalInputCallbacks = {
    receivedFreetextMessage: null,
    ignoreIncomingMessage: null,
    sendFreetextMessage: null,
    requestAtis: null,
    requestWeather: null,
    registerMessages: null,
    messageRead: null,
    removeMessage: null,
  };

  private subscriber: EventSubscriber<
    AtcAocMessages & ClockDataBusTypes & FmsAocMessages & FwcDataBusTypes & RouterAtcAocMessages
  > = null;

  private publisher: Publisher<AocFmsMessages> = null;

  private poweredUp: boolean = false;

  public UtcClock: Clock;

  public CompanyMessageCount: number = 0;

  private resetData(): void {
    this.UtcClock = new Clock(0, 0, 0, 0, 0, 0, 0);
    this.CompanyMessageCount = 0;
  }

  constructor(private readonly bus: EventBus) {
    this.resetData();
  }

  public initialize(): void {
    this.subscriber = this.bus.getSubscriber<
      AtcAocMessages & ClockDataBusTypes & FmsAocMessages & FwcDataBusTypes & RouterAtcAocMessages
    >();
    this.publisher = this.bus.getPublisher<AocFmsMessages>();

    this.subscriber.on('utcYear').handle((year: number) => {
      if (this.poweredUp) this.UtcClock.year = year;
    });
    this.subscriber.on('utcMonth').handle((month: number) => {
      if (this.poweredUp) this.UtcClock.month = month;
    });
    this.subscriber.on('utcDayOfMonth').handle((dayOfMonth: number) => {
      if (this.poweredUp) this.UtcClock.dayOfMonth = dayOfMonth;
    });
    this.subscriber.on('utcHour').handle((hour: number) => {
      if (this.poweredUp) this.UtcClock.hour = hour;
    });
    this.subscriber.on('utcMinute').handle((minute: number) => {
      if (this.poweredUp) this.UtcClock.minute = minute;
    });
    this.subscriber.on('utcSecond').handle((second: number) => {
      if (this.poweredUp) this.UtcClock.second = second;
    });
    this.subscriber.on('utcSecondsOfDay').handle((seconds: number) => {
      if (this.poweredUp) this.UtcClock.secondsOfDay = seconds;
    });
    this.subscriber.on('companyMessageCount').handle((count: number) => {
      if (this.poweredUp) this.CompanyMessageCount = count;
    });
    this.subscriber.on('routerReceivedFreetextMessage').handle((data) => {
      if (this.callbacks.receivedFreetextMessage !== null) {
        this.callbacks.receivedFreetextMessage(data);
      }
    });
    this.subscriber.on('ignoreIncomingAts623Message').handle((uid: number) => {
      if (this.callbacks.ignoreIncomingMessage !== null) {
        this.callbacks.ignoreIncomingMessage(uid);
      }
    });
    this.subscriber.on('aocSendFreetextMessage').handle((data) => {
      if (this.callbacks.sendFreetextMessage !== null) {
        this.callbacks.sendFreetextMessage(data.message).then((status) => {
          this.publisher.pub('aocTransmissionResponse', { requestId: data.requestId, status }, true, false);
        });
      }
    });
    this.subscriber.on('aocRequestAtis').handle((data) => {
      if (this.callbacks.requestAtis !== null) {
        this.callbacks
          .requestAtis(data.icao, data.type, () =>
            this.publisher.pub('aocRequestSentToGround', data.requestId, true, false),
          )
          .then((response) => {
            this.publisher.pub('aocWeatherResponse', { requestId: data.requestId, data: response }, true, false);
          });
      }
    });
    this.subscriber.on('aocRequestWeather').handle((data) => {
      if (this.callbacks.requestWeather !== null) {
        this.callbacks
          .requestWeather(data.icaos, data.requestMetar, () =>
            this.publisher.pub('aocRequestSentToGround', data.requestId, true, false),
          )
          .then((response) => {
            this.publisher.pub('aocWeatherResponse', { requestId: data.requestId, data: response }, true, false);
          });
      }
    });
    this.subscriber.on('aocRegisterFreetextMessages').handle((messages) => {
      if (this.callbacks.registerMessages !== null) {
        this.callbacks.registerMessages(messages);
      }
    });
    this.subscriber.on('aocRegisterWeatherMessages').handle((messages) => {
      if (this.callbacks.registerMessages !== null) {
        this.callbacks.registerMessages(messages);
      }
    });
    this.subscriber.on('aocMessageRead').handle((messageId) => {
      if (this.callbacks.messageRead !== null) {
        this.callbacks.messageRead(messageId);
      }
    });
    this.subscriber.on('aocRemoveMessage').handle((messageId) => {
      if (this.callbacks.removeMessage !== null) {
        this.callbacks.removeMessage(messageId);
      }
    });
  }

  public powerUp(): void {
    this.poweredUp = true;
  }

  public powerDown(): void {
    this.poweredUp = false;
    this.resetData();
  }

  public addDataCallback<K extends keyof AocDigitalInputCallbacks>(
    event: K,
    callback: AocDigitalInputCallbacks[K],
  ): void {
    this.callbacks[event] = callback;
  }
}
