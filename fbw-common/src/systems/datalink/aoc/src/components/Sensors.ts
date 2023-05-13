//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { OooiState, SensorsMessage } from '@datalink/common';
import { Arinc429Word } from '@shared/arinc429';
import { OutOffOnIn } from './OutOffOnIn';
import { DigitalInputs } from '../DigitalInputs';
import { DigitalOutputs } from '../DigitalOutputs';

export class Sensors {
    private oooiState: OooiState = OooiState.Unknown;

    public NoseGearDown: boolean = false;

    public ParkingBrakeSet: boolean = false;

    public Latitude: Arinc429Word = Arinc429Word.empty();

    public Longitude: Arinc429Word = Arinc429Word.empty();

    public Altitude: Arinc429Word = Arinc429Word.empty();

    public GroundSpeed: Arinc429Word = Arinc429Word.empty();

    public FuelOnBoard: number = 0;

    private dataChanged: boolean = false;

    private publisher: NodeJS.Timer = null;

    constructor(digitalInputs: DigitalInputs, private digitalOutputs: DigitalOutputs) {
        digitalInputs.addDataCallback('noseGearCompressed', (compressed: boolean) => {
            this.dataChanged ||= this.NoseGearDown !== compressed;
            this.NoseGearDown = compressed;
        });
        digitalInputs.addDataCallback('parkingBrakeSet', (set: boolean) => {
            this.dataChanged ||= this.ParkingBrakeSet !== set;
            this.ParkingBrakeSet = set;
        });
        digitalInputs.addDataCallback('currentLatitude', (lat: Arinc429Word) => {
            this.dataChanged ||= this.Latitude !== lat;
            this.Latitude = lat;
        });
        digitalInputs.addDataCallback('currentLongitude', (long: Arinc429Word) => {
            this.dataChanged ||= this.Longitude !== long;
            this.Longitude = long;
        });
        digitalInputs.addDataCallback('currentAltitude', (altitude: Arinc429Word) => {
            this.dataChanged ||= this.Altitude !== altitude;
            this.Altitude = altitude;
        });
        digitalInputs.addDataCallback('groundSpeed', (speed: Arinc429Word) => {
            this.dataChanged ||= this.GroundSpeed !== speed;
            this.GroundSpeed = speed;
        });
        digitalInputs.addDataCallback('fuelOnBoard', (fob: number) => {
            this.dataChanged ||= this.FuelOnBoard !== fob;
            this.FuelOnBoard = fob;
        });
    }

    public powerUp(): void {
        if (this.publisher === null) {
            this.publisher = setInterval(() => {
                if (this.dataChanged === true) {
                    const message = new SensorsMessage();

                    message.OooiState = this.oooiState;
                    message.NoseGearDown = this.NoseGearDown;
                    message.ParkingBrakeSet = this.ParkingBrakeSet;
                    if (this.Latitude.isNormalOperation()) message.Latitude = this.Latitude.value;
                    if (this.Longitude.isNormalOperation()) message.Longitude = this.Longitude.value;
                    if (this.Altitude.isNormalOperation()) message.Altitude = this.Altitude.value;
                    if (this.GroundSpeed.isNormalOperation()) message.GroundSpeed = this.GroundSpeed.value;
                    message.FuelOnBoard = this.FuelOnBoard;

                    this.digitalOutputs.resynchronizeSensors(message);
                    this.dataChanged = false;
                }
            }, 1000);
        }
    }

    public powerDown(): void {
        this.oooiState = OooiState.Unknown;
        this.NoseGearDown = false;
        this.ParkingBrakeSet = false;
        this.Latitude = Arinc429Word.empty();
        this.Longitude = Arinc429Word.empty();
        this.Altitude = Arinc429Word.empty();
        this.GroundSpeed = Arinc429Word.empty();
        this.FuelOnBoard = 0;

        if (this.publisher !== null) {
            clearInterval(this.publisher);
            this.publisher = null;
        }
    }

    public update(oooiSystem: OutOffOnIn): void {
        this.dataChanged ||= this.oooiState !== oooiSystem.state();
        this.oooiState = oooiSystem.state();
    }
}
