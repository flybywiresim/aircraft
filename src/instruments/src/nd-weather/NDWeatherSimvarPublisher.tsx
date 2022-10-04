import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from 'msfssdk';

export interface NDWeatherSimvars {
    weatherActive: number;
    ndRange: number;
  }

export enum PFDVars {
  weatherActive = 'L:XMLVAR_A320_WeatherRadar_Sys',
  ndRange = 'L:A32NX_EFIS_L_ND_RANGE',

}

/** A publisher to poll and publish nav/com simvars. */
export class NDWeatherSimvarPublisher extends SimVarPublisher<NDWeatherSimvars> {
    private static simvars = new Map<keyof NDWeatherSimvars, SimVarDefinition>([
        ['weatherActive', { name: PFDVars.weatherActive, type: SimVarValueType.Number }],
        ['ndRange', { name: PFDVars.ndRange, type: SimVarValueType.Number }],
    ])

    public constructor(bus: EventBus) {
        super(NDWeatherSimvarPublisher.simvars, bus);
    }
}
