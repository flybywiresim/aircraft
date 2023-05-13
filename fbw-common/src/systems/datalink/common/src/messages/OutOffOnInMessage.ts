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

        const outGate = jsonData.OutGate as { icao: string; timestamp: Record<string, unknown>; fuel: number };
        const offGround = jsonData.OffGround as { timestamp: Record<string, unknown>; fuel: number };
        const onGround = jsonData.OnGround as { timestamp: Record<string, unknown>; fuel: number };
        const inGate = jsonData.InGate as { icao: string; timestamp: Record<string, unknown>; fuel: number };

        AtsuMessage.deserialize(jsonData, retval);

        retval.OutGate.icao = outGate.icao;
        retval.OutGate.fuel = outGate.fuel;
        if (outGate.timestamp !== null) retval.OutGate.timestamp = AtsuTimestamp.deserialize(outGate.timestamp);

        retval.OffGround.fuel = offGround.fuel;
        if (offGround.timestamp !== null) retval.OffGround.timestamp = AtsuTimestamp.deserialize(offGround.timestamp);

        retval.OnGround.fuel = onGround.fuel;
        if (onGround.timestamp !== null) retval.OnGround.timestamp = AtsuTimestamp.deserialize(onGround.timestamp);

        retval.InGate.icao = inGate.icao;
        retval.InGate.fuel = inGate.fuel;
        if (inGate.timestamp !== null) retval.InGate.timestamp = AtsuTimestamp.deserialize(inGate.timestamp);

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
