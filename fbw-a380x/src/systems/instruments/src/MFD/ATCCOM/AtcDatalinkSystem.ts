import { ArraySubject, EventBus, Instrument, Subscription } from '@microsoft/msfs-sdk';
import { AtcFmsMessages, FmsAtcMessages } from '@datalink/atc';
import { AtisMessage, AtisType, AtsuStatusCodes, DatalinkModeCode, DatalinkStatusCode } from '@datalink/common';
import { FmsRouterMessages, RouterFmsMessages } from '@datalink/router';
import { MessageStorage } from './MessageStorage';
import { FmsData } from '@flybywiresim/fbw-sdk';
import { FmsErrorType } from '@fmgc/FmsError';
import { McduMessage, ATCCOMMessage, NXFictionalMessages, NXSystemMessages } from '../shared/NXSystemMessages';

export type AirportAtis = {
  icao: string;
  type: AtisType;
  requested: boolean;
  autoupdate: boolean;
  lastReadAtis: string;
};

export interface AtcErrorMessage {
  message: McduMessage;
  messageText: string;
  backgroundColor: 'white' | 'amber' | 'cyan'; // Whether the message should be colored.
  cleared: boolean; // If message has been cleared from footer
}

export class AtcDatalinkSystem implements Instrument {
  private readonly subscriptions: Subscription[] = [];

  private readonly messageStorage: MessageStorage;

  private readonly publisher = this.bus.getPublisher<FmsAtcMessages & FmsRouterMessages>();

  private readonly sub = this.bus.getSubscriber<AtcFmsMessages & FmsData & RouterFmsMessages & FmsRouterMessages>();

  private requestId: number = 0;

  private routerResponseCallbacks: ((code: AtsuStatusCodes, requestId: number) => boolean)[] = [];

  private genericRequestResponseCallbacks: ((requestId: number) => boolean)[] = [];

  private requestAtsuStatusCodeCallbacks: ((code: AtsuStatusCodes, requestId: number) => boolean)[] = [];

  private atisAutoUpdates: string[] = [];

  private atisReportsPrintActive: boolean = false;

  atcErrors = ArraySubject.create<AtcErrorMessage>();

  private readonly atisAirports: AirportAtis[] = [
    { icao: '', type: AtisType.Departure, requested: false, autoupdate: false, lastReadAtis: '' },
    { icao: '', type: AtisType.Arrival, requested: false, autoupdate: false, lastReadAtis: '' },
    { icao: '', type: AtisType.Arrival, requested: false, autoupdate: false, lastReadAtis: '' },
  ];

  private datalinkStatus: { vhf: DatalinkStatusCode; satellite: DatalinkStatusCode; hf: DatalinkStatusCode } = {
    vhf: DatalinkStatusCode.NotInstalled,
    satellite: DatalinkStatusCode.NotInstalled,
    hf: DatalinkStatusCode.NotInstalled,
  };

  private datalinkMode: { vhf: DatalinkModeCode; satellite: DatalinkModeCode; hf: DatalinkModeCode } = {
    vhf: DatalinkModeCode.None,
    satellite: DatalinkModeCode.None,
    hf: DatalinkModeCode.None,
  };

  constructor(private readonly bus: EventBus) {
    this.messageStorage = new MessageStorage(this.sub);

    // this.backplane.addPublisher('FmBus', new FmsDataPublisher(this.bus));

    this.sub.on('atcResetData').handle(() => {
      this.messageStorage.resetAtcData();
      this.atisAutoUpdates = [];
      this.atisReportsPrintActive = false;

      this.datalinkStatus = {
        vhf: DatalinkStatusCode.NotInstalled,
        satellite: DatalinkStatusCode.NotInstalled,
        hf: DatalinkStatusCode.NotInstalled,
      };

      this.datalinkMode = {
        vhf: DatalinkModeCode.None,
        satellite: DatalinkModeCode.None,
        hf: DatalinkModeCode.None,
      };
    });

    this.sub.on('routerDatalinkStatus').handle((data) => (this.datalinkStatus = data));
    this.sub.on('routerDatalinkMode').handle((data) => (this.datalinkMode = data));

    this.sub.on('atcActiveAtisAutoUpdates').handle((airports) => (this.atisAutoUpdates = airports));
    this.sub.on('atcRequestAtsuStatusCode').handle((response) => {
      this.requestAtsuStatusCodeCallbacks.every((callback, index) => {
        if (callback(response.code, response.requestId)) {
          this.requestAtsuStatusCodeCallbacks.splice(index, 1);
          return false;
        }
        return true;
      });
    });

    this.sub
      .on('fmsOrigin')
      .whenChanged()
      .handle((icao) => {
        this.atisAirports[0].icao = icao;
        console.log('origin airport updated');
      });
    this.sub
      .on('fmsDestination')
      .whenChanged()
      .handle((icao) => {
        this.atisAirports[1].icao = icao;
        console.log('dest airport updated');
      });
    this.sub
      .on('fmsAlternate')
      .whenChanged()
      .handle((icao) => {
        this.atisAirports[2].icao = icao;
        console.log('altn airport updated');
      });
  }

  init(): void {}
  onUpdate(): void {}

  destroy() {
    for (const s of this.subscriptions) {
      s.destroy();
    }
  }

  showAtcErrorMessage(errorType: FmsErrorType) {
    switch (errorType) {
      case FmsErrorType.EntryOutOfRange:
        this.addMessageToQueue(NXSystemMessages.entryOutOfRange, undefined, undefined);
        break;
      case FmsErrorType.FormatError:
        this.addMessageToQueue(NXSystemMessages.formatError, undefined, undefined);
        break;
      case FmsErrorType.NotInDatabase:
        this.addMessageToQueue(NXSystemMessages.notInDatabase, undefined, undefined);
        break;
      case FmsErrorType.NotYetImplemented:
        this.addMessageToQueue(NXFictionalMessages.notYetImplemented, undefined, undefined);
        break;
      default:
        break;
    }
  }
  clearLatestAtcErrorMessage() {
    const arr = this.atcErrors.getArray();
    const index = arr.findIndex((val) => !val.cleared);

    if (index > -1) {
      if (arr[index].message.isTypeTwo) {
        const old = arr[index];
        old.cleared = true;

        this.atcErrors.set(arr);
      } else {
        this.atcErrors.removeAt(index);
      }
    }
  }

  public addMessageToQueue(
    message: ATCCOMMessage,
    _isResolvedOverride: (() => boolean) | undefined = undefined,
    _onClearOverride: (() => void) | undefined = undefined,
  ) {
    const msg: AtcErrorMessage = {
      message: message,
      messageText: message.text,
      backgroundColor: message.isAmber ? 'amber' : 'white',
      cleared: false,
    };

    const exists = this.atcErrors.getArray().findIndex((el) => el.messageText === msg.messageText && el.cleared);
    if (exists !== -1) {
      this.atcErrors.removeAt(exists);
    }
    this.atcErrors.insert(msg, 0);
  }

  public async receiveAtcAtis(airport: string, type: AtisType): Promise<AtsuStatusCodes> {
    return new Promise<AtsuStatusCodes>((resolve, _reject) => {
      const requestId = this.requestId++;
      this.publisher.pub('atcRequestAtis', { icao: airport, type, requestId }, true, false);
      this.requestAtsuStatusCodeCallbacks.push((response: AtsuStatusCodes, id: number) => {
        if (id === requestId) resolve(response);
        return id === requestId;
      });
    });
  }

  public getAtisAirports(): AirportAtis[] {
    return this.atisAirports;
  }

  public setAtisAirport(airportData: AirportAtis, index: number): void {
    this.atisAirports[index] = airportData;
  }

  public atisReports(icao: string): AtisMessage[] {
    if (this.messageStorage.atisReports.has(icao)) {
      return this.messageStorage.atisReports.get(icao)!;
    }
    return [];
  }

  public atisAutoUpdateActive(icao: string): boolean {
    return this.atisAutoUpdates.findIndex((airport) => icao === airport) !== -1;
  }

  public async deactivateAtisAutoUpdate(icao: string): Promise<AtsuStatusCodes> {
    return new Promise<AtsuStatusCodes>((resolve, _reject) => {
      const requestId = this.requestId++;
      this.publisher.pub('atcDeactivateAtisAutoUpdate', { icao, requestId }, true, false);
      this.genericRequestResponseCallbacks.push((id: number) => {
        if (id === requestId) resolve(AtsuStatusCodes.Ok);
        return id === requestId;
      });
    });
  }

  public async activateAtisAutoUpdate(icao: string, type: AtisType): Promise<AtsuStatusCodes> {
    return new Promise<AtsuStatusCodes>((resolve, _reject) => {
      const requestId = this.requestId++;
      this.publisher.pub('atcActivateAtisAutoUpdate', { icao, type, requestId }, true, false);
      this.genericRequestResponseCallbacks.push((id: number) => {
        if (id === requestId) resolve(AtsuStatusCodes.Ok);
        return id === requestId;
      });
    });
  }

  public getDatalinkStatus(value: 'vhf' | 'satcom' | 'hf'): DatalinkStatusCode {
    switch (value) {
      case 'vhf':
        return this.datalinkStatus.vhf;
      case 'satcom':
        return this.datalinkStatus.satellite;
      case 'hf':
        return this.datalinkStatus.hf;
      default:
        return DatalinkStatusCode.NotInstalled;
    }
  }

  public getDatalinkMode(value: 'vhf' | 'satcom' | 'hf'): DatalinkModeCode {
    switch (value) {
      case 'vhf':
        return this.datalinkMode.vhf;
      case 'satcom':
        return this.datalinkMode.satellite;
      case 'hf':
        return this.datalinkMode.hf;
      default:
        return DatalinkModeCode.None;
    }
  }
}
