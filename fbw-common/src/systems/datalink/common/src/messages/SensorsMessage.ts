//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessage, AtsuMessageType, AtsuMessageSerializationFormat } from './AtsuMessage';
import { OooiState } from '../types';

export class SensorsMessage extends AtsuMessage {
    public OooiState: OooiState = OooiState.Unknown;

    public NoseGearDown: boolean = false;

    public ParkingBrakeSet: boolean = false;

    public Latitude: number = undefined;

    public Longitude: number = undefined;

    public Altitude: number = undefined;

    public GroundSpeed: number = undefined;

    public FuelOnBoard: number = 0;

    constructor() {
        super();
        this.Type = AtsuMessageType.Sensors;
        this.Station = 'AOC';
    }

    public static deserialize(jsonData: Record<string, unknown> | SensorsMessage): SensorsMessage {
        const retval = new SensorsMessage();

        AtsuMessage.deserialize(jsonData, retval);
        retval.OooiState = jsonData.OooiState as OooiState;
        retval.NoseGearDown = jsonData.NoseGearDown as boolean;
        retval.ParkingBrakeSet = jsonData.ParkingBrakeSet as boolean;
        retval.Latitude = jsonData.Latitude as number | undefined;
        retval.Longitude = jsonData.Longitude as number | undefined;
        retval.Altitude = jsonData.Altitude as number | undefined;
        retval.GroundSpeed = jsonData.GroundSpeed as number | undefined;
        retval.FuelOnBoard = jsonData.FuelOnBoard as number;

        return retval;
    }

    public serialize(_format: AtsuMessageSerializationFormat): string {
        let state = 'UNK';
        switch (this.OooiState) {
        case OooiState.OutGate:
            state = 'OUT';
            break;
        case OooiState.OffGround:
            state = 'OFF';
            break;
        case OooiState.InGate:
            state = 'IN';
            break;
        case OooiState.OnGround:
            state = 'ON';
            break;
        default:
            break;
        }

        return 'AOC SENSORS\n'
            + `OOOI: ${state}\n`
            + `NOSE STRUT: ${this.NoseGearDown === true ? 'ON GND' : 'IN AIR'}\n`
            + `PARKING BRAKE: ${this.ParkingBrakeSet === true ? 'SET' : 'RLSD'}\n`
            + `LATITUDE: ${Number(this.Latitude).toFixed(4).toString()}\n`
            + `LONGITUDE: ${Number(this.Longitude).toFixed(4).toString()}\n`
            + `ALTITUDE: ${Math.round(this.Altitude).toString()}\n`
            + `GROUND SPEED: ${Math.round(this.GroundSpeed).toString()}\n`
            + `FOB: ${Number(this.FuelOnBoard).toFixed(1).toString()}`;
    }
}
