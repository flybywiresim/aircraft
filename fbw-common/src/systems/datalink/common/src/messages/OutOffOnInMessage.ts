//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessage, AtsuMessageType, AtsuMessageSerializationFormat } from './AtsuMessage';
import { AtsuTimestamp } from '../types/AtsuTimestamp';

export class OutOffOnInMessage extends AtsuMessage {
    public OutGate: { icao: string; timestamp: AtsuTimestamp; fuel: number } = {
        icao: '',
        timestamp: null,
        fuel: 0,
    };

    public OffGround: { timestamp: AtsuTimestamp; fuel: number } = {
        timestamp: null,
        fuel: 0,
    };

    public OnGround: { timestamp: AtsuTimestamp; fuel: number } = {
        timestamp: null,
        fuel: 0,
    };

    public InGate: { icao: string; timestamp: AtsuTimestamp; fuel: number } = {
        icao: '',
        timestamp: null,
        fuel: 0,
    };

    constructor() {
        super();
        this.Type = AtsuMessageType.OOOI;
        this.Station = 'AOC';
    }

    public static deserialize(jsonData: Record<string, unknown> | OutOffOnInMessage): OutOffOnInMessage {
        const retval = new OutOffOnInMessage();

        AtsuMessage.deserialize(jsonData, retval);
        retval.OutGate = jsonData.OutGate as { icao: string; timestamp: AtsuTimestamp; fuel: number };
        retval.OffGround = jsonData.OffGround as { timestamp: AtsuTimestamp; fuel: number };
        retval.OnGround = jsonData.OnGround as { timestamp: AtsuTimestamp; fuel: number };
        retval.InGate = jsonData.InGate as { icao: string; timestamp: AtsuTimestamp; fuel: number };

        return retval;
    }

    public serialize(_format: AtsuMessageSerializationFormat): string {
        return 'OOOI\n'
            + `OUT:${this.OutGate.icao},${this.OutGate.timestamp.fmsTimestamp()},${this.OutGate.fuel}\n`
            + `OFF:${this.OffGround.timestamp.fmsTimestamp()},${this.OffGround.fuel}\n`
            + `ON:${this.OnGround.timestamp.fmsTimestamp()},${this.OnGround.fuel}\n`
            + `IN:${this.InGate.icao},${this.InGate.timestamp.fmsTimestamp()},${this.InGate.fuel}`;
    }
}
