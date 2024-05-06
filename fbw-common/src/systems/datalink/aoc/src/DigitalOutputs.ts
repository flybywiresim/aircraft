//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { EventBus, EventSubscriber, Publisher } from '@microsoft/msfs-sdk';
import { AtcAocRouterMessages } from '../../router/src';
import {
  AtisType,
  AtsuMessage,
  AtsuMessageType,
  AtsuStatusCodes,
  FreetextMessage,
  SimVarSources,
  WeatherMessage,
} from '../../common/src';
import { AocFmsMessages } from './databus/FmsBus';

export class DigitalOutputs {
  private requestId: number = 0;

  private subscriber: EventSubscriber<AtcAocRouterMessages> = null;

  private publisher: Publisher<AtcAocRouterMessages & AocFmsMessages> = null;

  private sendMessageCallbacks: ((requestId: number, code: AtsuStatusCodes) => boolean)[] = [];

  private requestSentCallbacks: ((requestId: number) => boolean)[] = [];

  private weatherResponseCallbacks: ((requestId: number, response: [AtsuStatusCodes, WeatherMessage]) => boolean)[] =
    [];

  constructor(
    private readonly bus: EventBus,
    private readonly synchronizedRouter: boolean,
  ) {
    this.subscriber = this.bus.getSubscriber<AtcAocRouterMessages>();
    this.publisher = this.bus.getPublisher<AtcAocRouterMessages & AocFmsMessages>();

    this.subscriber.on('routerSendMessageResponse').handle((response) => {
      this.sendMessageCallbacks.every((callback, index) => {
        if (callback(response.requestId, response.status)) {
          this.sendMessageCallbacks.splice(index, 1);
          return false;
        }
        return true;
      });
    });

    this.subscriber.on('routerRequestSent').handle((response) => {
      this.requestSentCallbacks.every((callback, index) => {
        if (callback(response)) {
          this.requestSentCallbacks.splice(index, 1);
          return false;
        }
        return true;
      });
    });

    this.subscriber.on('routerReceivedWeather').handle((response) => {
      this.weatherResponseCallbacks.every((callback, index) => {
        if (callback(response.requestId, response.response)) {
          this.weatherResponseCallbacks.splice(index, 1);
          return false;
        }
        return true;
      });
    });
  }

  public powerDown(): void {
    this.publisher.pub('aocResetData', true, true, false);
  }

  public async sendMessage(message: FreetextMessage, force: boolean): Promise<AtsuStatusCodes> {
    return new Promise<AtsuStatusCodes>((resolve, _reject) => {
      const requestId = this.requestId++;
      this.publisher.pub('routerSendFreetextMessage', { requestId, message, force }, this.synchronizedRouter, false);
      this.sendMessageCallbacks.push((id: number, code: AtsuStatusCodes) => {
        if (id === requestId) resolve(code);
        return id === requestId;
      });
    });
  }

  public async receiveAtis(
    icao: string,
    type: AtisType,
    sentCallback: () => void,
  ): Promise<[AtsuStatusCodes, WeatherMessage]> {
    return new Promise<[AtsuStatusCodes, WeatherMessage]>((resolve, _reject) => {
      const requestId = this.requestId++;
      this.publisher.pub('routerRequestAtis', { requestId, icao, type }, this.synchronizedRouter, false);
      this.requestSentCallbacks.push((id: number) => {
        if (id === requestId) sentCallback();
        return id === requestId;
      });
      this.weatherResponseCallbacks.push((id, response) => {
        if (id === requestId) resolve(response);
        return requestId === id;
      });
    });
  }

  public async receiveMetar(icaos: string[], sentCallback: () => void): Promise<[AtsuStatusCodes, WeatherMessage]> {
    return new Promise<[AtsuStatusCodes, WeatherMessage]>((resolve, _reject) => {
      const requestId = this.requestId++;
      this.publisher.pub('routerRequestMetar', { requestId, icaos }, this.synchronizedRouter, false);
      this.requestSentCallbacks.push((id: number) => {
        if (id === requestId) sentCallback();
        return id === requestId;
      });
      this.weatherResponseCallbacks.push((id, response) => {
        if (id === requestId) resolve(response);
        return requestId === id;
      });
    });
  }

  public async receiveTaf(icaos: string[], sentCallback: () => void): Promise<[AtsuStatusCodes, WeatherMessage]> {
    return new Promise<[AtsuStatusCodes, WeatherMessage]>((resolve, _reject) => {
      const requestId = this.requestId++;
      this.publisher.pub('routerRequestTaf', { requestId, icaos }, this.synchronizedRouter, false);
      this.requestSentCallbacks.push((id: number) => {
        if (id === requestId) sentCallback();
        return id === requestId;
      });
      this.weatherResponseCallbacks.push((id, response) => {
        if (id === requestId) resolve(response);
        return requestId === id;
      });
    });
  }

  public sendAtsuSystemStatus(status: AtsuStatusCodes): void {
    this.publisher.pub('aocSystemStatus', status, true, false);
  }

  public sendPrintMessage(message: AtsuMessage): void {
    this.publisher.pub('aocPrintMessage', message, true, false);
  }

  public deleteMessage(uid: number): void {
    this.publisher.pub('aocDeleteMessage', uid, true, false);
  }

  public resynchronizeAocMessage(message: AtsuMessage): void {
    if (message.Type === AtsuMessageType.Freetext) {
      this.publisher.pub('aocResynchronizeFreetextMessage', message as FreetextMessage, true, false);
    } else {
      this.publisher.pub('aocResynchronizeWeatherMessage', message as WeatherMessage, true, false);
    }
  }

  public setCompanyMessageCount(count: number): void {
    SimVar.SetSimVarValue(SimVarSources.companyMessageCount, 'number', count);
  }
}
