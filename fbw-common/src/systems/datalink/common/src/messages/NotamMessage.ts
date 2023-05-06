//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessageSerializationFormat } from 'datalink/common/src/messages/AtsuMessage';
import { AtsuTimestamp } from 'datalink/common/src/messages/AtsuTimestamp';
import { AtsuMessage, AtsuMessageType } from './AtsuMessage';

export class NotamMessage extends AtsuMessage {
    public Identifier: string = '';

    public Icao: string = '';

    public Text: string = '';

    public CreatedTimestamp: AtsuTimestamp = null;

    public EffectiveTimestamp: AtsuTimestamp = null;

    public ExpireTimestamp: AtsuTimestamp = null;

    public RawMessage: string = '';

    constructor() {
        super();
        this.Type = AtsuMessageType.NOTAM;
        this.Station = 'AOC';
    }

    public serialize(_format: AtsuMessageSerializationFormat): string {
        return this.RawMessage;
    }
}
