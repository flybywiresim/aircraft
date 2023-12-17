import { EventBus, Metar as MsfsMetar, SimbriefClient } from '@microsoft/msfs-sdk';
import { Metar as FbwApiMetar, MetarResponse as FbwApiMetarResponse } from '@flybywiresim/api-client';

import { FlypadClientEvents, FlypadServerEvents } from './FlypadEvents';
import { MetarParserType } from '../../../instruments/src';
import { parseMetar } from '../parseMetar';

export class FlypadServer {
    private readonly eventSub = this.bus.getSubscriber<FlypadClientEvents>();

    private readonly eventPub = this.bus.getPublisher<FlypadServerEvents>();

    constructor(private readonly bus: EventBus) {
        RegisterViewListener('JS_LISTENER_FACILITY', () => {
            this.eventPub.pub('fps_Initialized', undefined, true);
        });

        this.eventSub.on('fpc_HelloWorld').handle(() => this.handleHelloWorld());
        this.eventSub.on('fpc_GetMetar').handle((icao) => this.handleGetMetar(icao));
        this.eventSub.on('fpc_GetSimbriefOfp').handle((icao) => this.handleGetSimbriefOfp(icao));
    }

    private handleHelloWorld(): void {
        this.eventPub.pub('fps_HelloWorld', 'hello I am stupid and fat', true);
    }

    private async handleGetMetar(icao: string): Promise<void> {
        const source: string = 'MSFS';

        let metar: MetarParserType;
        switch (source) {
        default:
        case 'MSFS': {
            let msfsMetar: MsfsMetar;

            // Catch parsing error separately
            try {
                msfsMetar = await Coherent.call('GET_METAR_BY_IDENT', icao);
                if (msfsMetar.icao !== icao.toUpperCase()) {
                    throw new Error('No METAR available');
                }
            } catch (err) {
                console.log(`Error while retrieving Metar: ${err}`);
            }

            try {
                metar = parseMetar(msfsMetar.metarString);
            } catch (err) {
                console.log(`Error while parsing Metar ("${msfsMetar.metarString}"): ${err}`);
            }

            break;
        }
        case 'API': {
            let fbwApiMetar: FbwApiMetarResponse;

            // Catch parsing error separately
            try {
                fbwApiMetar = await FbwApiMetar.get(icao, 'vatsim');
                if (fbwApiMetar.icao !== icao.toUpperCase()) {
                    throw new Error('No METAR available');
                }
            } catch (err) {
                console.log(`Error while retrieving Metar: ${err}`);
            }

            try {
                metar = parseMetar(fbwApiMetar.metar);
            } catch (err) {
                console.log(`Error while parsing Metar ("${fbwApiMetar.metar}"): ${err}`);
            }

            break;
        }
        }

        this.eventPub.pub('fps_SendMetar', metar, true);
    }

    private async handleGetSimbriefOfp(): Promise<void> {
        const pilotID = await SimbriefClient.getSimbriefUserIDFromUsername('benjozork');
        const ofp = await SimbriefClient.getOfp(pilotID);

        this.eventPub.pub('fps_SendSimbriefOfp', ofp, true);
    }
}
