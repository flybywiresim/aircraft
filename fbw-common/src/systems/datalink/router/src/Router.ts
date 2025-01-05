//  Copyright (c) 2021, 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { EventBus } from '@microsoft/msfs-sdk';
import {
  DatalinkModeCode,
  DatalinkStatusCode,
  AtsuStatusCodes,
  CpdlcMessage,
  AtsuMessage,
  AtsuMessageNetwork,
  AtsuMessageType,
  AtisMessage,
  MetarMessage,
  TafMessage,
  WeatherMessage,
  FreetextMessage,
} from '../../common/src';
import { MsfsConnector } from './msfs/MsfsConnector';
import { Vdl } from './vhf/VDL';
import { HoppieConnector } from './webinterfaces/HoppieConnector';
import { NXApiConnector } from './webinterfaces/NXApiConnector';
import { DigitalInputs } from './DigitalInputs';
import { DigitalOutputs } from './DigitalOutputs';

enum ActiveCommunicationInterface {
  None,
  VHF,
  HF,
  SATCOM,
}

export class Router {
  private readonly digitalInputs: DigitalInputs;

  private readonly digitalOutputs: DigitalOutputs;

  private communicationInterface: ActiveCommunicationInterface = ActiveCommunicationInterface.None;

  private vdl: Vdl = new Vdl();

  private waitedComUpdate = 0;

  private waitedTimeHoppie = 0;

  private waitedTimeNXApi = 0;

  private firstPollHoppie = true;

  private transmissionSimulationTimeouts: number[] = [];

  private poweredUp: boolean = false;

  private lastUpdateTime: number = -1;

  private removeTransmissionTimeout(timeout: number): void {
    const index = this.transmissionSimulationTimeouts.findIndex((value) => value === timeout);
    if (index >= 0) this.transmissionSimulationTimeouts.splice(index, 1);
  }

  private enqueueReceivedMessages(messages: AtsuMessage[]): void {
    switch (this.communicationInterface) {
      case ActiveCommunicationInterface.VHF:
        messages.forEach((message) => {
          // ignore empty messages (happens sometimes in CPDLC with buggy ATC software)
          if (message.Message.length !== 0) {
            const transmissionTime = this.vdl.enqueueInboundMessage(message);

            const timeout = window.setTimeout(() => {
              this.vdl.dequeueInboundMessage(transmissionTime);

              if (this.poweredUp) {
                if (message.Type === AtsuMessageType.Freetext) {
                  this.digitalOutputs.receivedFreetextMesage(message as FreetextMessage);
                } else if (message.Type === AtsuMessageType.CPDLC) {
                  this.digitalOutputs.receivedCpdlcMessage(message as CpdlcMessage);
                } else {
                  console.error('ERROR: Unknown message received in datalink');
                }
              }

              this.removeTransmissionTimeout(timeout);
            }, transmissionTime);
            this.transmissionSimulationTimeouts.push(timeout);
          }
        });
        break;
      case ActiveCommunicationInterface.HF:
      case ActiveCommunicationInterface.SATCOM:
      case ActiveCommunicationInterface.None:
      default:
        break;
    }
  }

  constructor(
    private readonly bus: EventBus,
    synchronizedAtc: boolean,
    synchronizedAoc: boolean,
  ) {
    HoppieConnector.activateHoppie();

    this.digitalInputs = new DigitalInputs(this.bus, synchronizedAtc, synchronizedAoc);
    this.digitalOutputs = new DigitalOutputs(this.bus, synchronizedAtc, synchronizedAoc);

    this.digitalInputs.addDataCallback('connect', (callsign: string) => Router.connect(callsign));
    this.digitalInputs.addDataCallback('disconnect', () => Router.disconnect());
    this.digitalInputs.addDataCallback('stationAvailable', (callsign: string) => this.isStationAvailable(callsign));
    this.digitalInputs.addDataCallback('sendFreetextMessage', (message, force) => this.sendMessage(message, force));
    this.digitalInputs.addDataCallback('sendCpdlcMessage', (message, force) => this.sendMessage(message, force));
    this.digitalInputs.addDataCallback('sendDclMessage', (message, force) => this.sendMessage(message, force));
    this.digitalInputs.addDataCallback('sendOclMessage', (message, force) => this.sendMessage(message, force));
    this.digitalInputs.addDataCallback(
      'requestAtis',
      async (icao, type, requestSent): Promise<[AtsuStatusCodes, WeatherMessage]> => {
        if (this.communicationInterface === ActiveCommunicationInterface.None || !this.poweredUp) {
          return [AtsuStatusCodes.ComFailed, null];
        }

        const message = new AtisMessage();
        return NXApiConnector.receiveAtis(icao, type, message)
          .then(() => this.simulateWeatherRequestResponse([AtsuStatusCodes.Ok, message], requestSent))
          .catch((_err) => [AtsuStatusCodes.ComFailed, null]);
      },
    );
    this.digitalInputs.addDataCallback('requestWeather', async (icaos, metar, requestSent) =>
      this.receiveWeather(metar, icaos, requestSent),
    );
  }

  public initialize(): void {
    this.digitalInputs.initialize();
    this.digitalInputs.connectedCallback();
  }

  public powerUp(): void {
    this.digitalInputs.powerUp();
    this.poweredUp = true;
  }

  public powerDown(): void {
    this.poweredUp = false;
    this.digitalInputs.powerDown();

    this.transmissionSimulationTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.transmissionSimulationTimeouts = [];

    this.vdl.reinitialize();
  }

  public update(): void {
    const currentTimestamp = new Date().getTime();

    // update the communication interface states
    this.vdl.vhf3.updateDatalinkStates(this.digitalInputs.Vhf3Powered, this.digitalInputs.Vhf3DataMode);

    // find the best communication
    if (this.vdl.vhf3.datalinkStatus === DatalinkStatusCode.DlkAvail && this.poweredUp) {
      this.communicationInterface = ActiveCommunicationInterface.VHF;
    } else {
      this.communicationInterface = ActiveCommunicationInterface.None;
    }

    if (this.waitedComUpdate >= 30000) {
      this.vdl.simulateTransmissionTimes(this.digitalInputs.FlightPhase);
      this.waitedComUpdate = 0;
    } else if (this.lastUpdateTime >= 0) {
      this.waitedComUpdate += currentTimestamp - this.lastUpdateTime;
    }

    this.digitalOutputs.sendDatalinkStatus({
      vhf: this.vhf3DatalinkStatus(),
      satellite: this.satcomDatalinkStatus(),
      hf: DatalinkStatusCode.NotInstalled,
    });
    this.digitalOutputs.sendDatalinkMode({
      vhf: this.vhf3DatalinkMode(),
      satellite: DatalinkModeCode.None,
      hf: DatalinkModeCode.None,
    });

    if (HoppieConnector.pollInterval() <= this.waitedTimeHoppie) {
      HoppieConnector.poll().then((retval) => {
        if (retval[0] === AtsuStatusCodes.Ok) {
          // delete all data in the first call (Hoppie stores old data)
          if (!this.firstPollHoppie && this.poweredUp) {
            this.enqueueReceivedMessages(retval[1]);
          }
          this.firstPollHoppie = false;
        }
      });
      this.waitedTimeHoppie = 0;
    } else if (this.lastUpdateTime >= 0) {
      this.waitedTimeHoppie += currentTimestamp - this.lastUpdateTime;
    }

    if (NXApiConnector.pollInterval() <= this.waitedTimeNXApi) {
      NXApiConnector.poll().then((retval) => {
        if (retval[0] === AtsuStatusCodes.Ok && this.poweredUp) {
          this.enqueueReceivedMessages(retval[1]);
        }
      });
      this.waitedTimeNXApi = 0;
    } else if (this.lastUpdateTime >= 0) {
      this.waitedTimeNXApi += currentTimestamp - this.lastUpdateTime;
    }

    this.lastUpdateTime = currentTimestamp;
  }

  private static async connect(flightNo: string): Promise<AtsuStatusCodes> {
    return NXApiConnector.connect(flightNo).then((code) => {
      if (code === AtsuStatusCodes.TelexDisabled) code = AtsuStatusCodes.Ok;

      if (code === AtsuStatusCodes.Ok) {
        return HoppieConnector.connect(flightNo).then((code) => {
          if (code === AtsuStatusCodes.NoHoppieConnection) code = AtsuStatusCodes.Ok;
          return code;
        });
      }

      return code;
    });
  }

  private static async disconnect(): Promise<AtsuStatusCodes> {
    let retvalNXApi = await NXApiConnector.disconnect();
    if (retvalNXApi === AtsuStatusCodes.TelexDisabled) retvalNXApi = AtsuStatusCodes.Ok;

    let retvalHoppie = HoppieConnector.disconnect();
    if (retvalHoppie === AtsuStatusCodes.NoHoppieConnection) retvalHoppie = AtsuStatusCodes.Ok;

    if (retvalNXApi !== AtsuStatusCodes.Ok) return retvalNXApi;
    return retvalHoppie;
  }

  private async receiveWeatherData(
    requestMetar: boolean,
    icaos: string[],
    index: number,
    message: WeatherMessage,
  ): Promise<AtsuStatusCodes> {
    let retval = AtsuStatusCodes.Ok;

    if (index < icaos.length) {
      if (requestMetar === true) {
        const storedMetarSrc = NXDataStore.get('CONFIG_METAR_SRC', 'MSFS');

        if (storedMetarSrc === 'MSFS') {
          retval = await MsfsConnector.receiveMsfsMetar(icaos[index], message).then(() =>
            this.receiveWeatherData(requestMetar, icaos, index + 1, message),
          );
        } else {
          retval = await NXApiConnector.receiveMetar(icaos[index], message).then(() =>
            this.receiveWeatherData(requestMetar, icaos, index + 1, message),
          );
        }
      } else {
        retval = await NXApiConnector.receiveTaf(icaos[index], message).then(() =>
          this.receiveWeatherData(requestMetar, icaos, index + 1, message),
        );
      }
    }

    return retval;
  }

  private async simulateWeatherRequestResponse(
    data: [AtsuStatusCodes, WeatherMessage],
    sentCallback: () => void,
  ): Promise<[AtsuStatusCodes, WeatherMessage]> {
    return new Promise((resolve, _reject) => {
      // simulate the request transmission
      const requestTimeout = this.vdl.enqueueOutboundPacket();
      let timeout = window.setTimeout(() => {
        this.vdl.dequeueOutboundMessage(requestTimeout);
        this.removeTransmissionTimeout(timeout);

        if (!this.poweredUp) return;

        sentCallback();

        const processingTimeout = 300 + Math.floor(Math.random() * 500);

        // simulate some remote processing time
        timeout = window.setTimeout(() => {
          this.removeTransmissionTimeout(timeout);

          // simulate the response transmission
          const responseTimeout = this.vdl.enqueueInboundMessage(data[1]);
          timeout = window.setTimeout(() => {
            this.vdl.dequeueInboundMessage(responseTimeout);
            this.removeTransmissionTimeout(timeout);

            if (this.poweredUp) resolve(data);
          }, responseTimeout);

          this.transmissionSimulationTimeouts.push(timeout);
        }, processingTimeout);

        this.transmissionSimulationTimeouts.push(timeout);
      }, requestTimeout);

      this.transmissionSimulationTimeouts.push(timeout);
    });
  }

  private async receiveWeather(
    requestMetar: boolean,
    icaos: string[],
    requestSent: () => void,
  ): Promise<[AtsuStatusCodes, WeatherMessage]> {
    if (this.communicationInterface === ActiveCommunicationInterface.None || !this.poweredUp) {
      return [AtsuStatusCodes.ComFailed, null];
    }

    let message = undefined;
    if (requestMetar === true) {
      message = new MetarMessage();
    } else {
      message = new TafMessage();
    }

    return this.receiveWeatherData(requestMetar, icaos, 0, message).then((code) =>
      this.simulateWeatherRequestResponse([code, message], requestSent),
    );
  }

  private async isStationAvailable(callsign: string): Promise<AtsuStatusCodes> {
    return HoppieConnector.isStationAvailable(callsign);
  }

  private async sendMessage(message: AtsuMessage, force: boolean): Promise<AtsuStatusCodes> {
    if (this.communicationInterface === ActiveCommunicationInterface.None || !this.poweredUp) {
      return AtsuStatusCodes.ComFailed;
    }

    return new Promise<AtsuStatusCodes>((resolve, _reject) => {
      const transmissionTime = this.vdl.enqueueOutboundMessage(message);

      const timeout = window.setTimeout(() => {
        this.vdl.dequeueOutboundMessage(transmissionTime);
        this.removeTransmissionTimeout(timeout);

        if (message.Type < AtsuMessageType.AOC) {
          if (message.Network === AtsuMessageNetwork.FBW) {
            NXApiConnector.sendTelexMessage(message).then((code) => resolve(code));
          } else {
            HoppieConnector.sendTelexMessage(message, force).then((code) => resolve(code));
          }
        } else if (message.Type === AtsuMessageType.DCL) {
          HoppieConnector.sendTelexMessage(message, force).then((code) => resolve(code));
        } else if (message.Type < AtsuMessageType.ATC) {
          HoppieConnector.sendCpdlcMessage(message as CpdlcMessage, force).then((code) => resolve(code));
        } else {
          resolve(AtsuStatusCodes.UnknownMessage);
        }
      });

      // register the transmission simulation for later management
      this.transmissionSimulationTimeouts.push(timeout);
    });
  }

  private vhf3DatalinkStatus(): DatalinkStatusCode {
    if (!this.poweredUp) return DatalinkStatusCode.Inop;
    return this.vdl.vhf3.datalinkStatus;
  }

  private vhf3DatalinkMode(): DatalinkModeCode {
    if (!this.poweredUp) return DatalinkModeCode.None;
    return this.vdl.vhf3.datalinkMode;
  }

  private satcomDatalinkStatus(): DatalinkStatusCode {
    if (NXDataStore.get('MODEL_SATCOM_ENABLED') === '1') {
      return DatalinkStatusCode.DlkNotAvail;
    }
    return DatalinkStatusCode.NotInstalled;
  }
}
