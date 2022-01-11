//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessageType, AtsuMessageDirection, AtsuMessageResponseStatus, AtsuMessageSerializationFormat, AtsuMessage } from './AtsuMessage';

/**
 * Defines the general freetext message format
 */
export class FreetextMessage extends AtsuMessage {
    public Lines : string[] = [];

    constructor() {
        super();
        this.Type = AtsuMessageType.Freetext;
        this.Direction = AtsuMessageDirection.Output;
        this.Status = AtsuMessageResponseStatus.Open;
    }

    public serialize(_format: AtsuMessageSerializationFormat) {
        let message = '';

        this.Lines.forEach((line) => {
            message += `${line}\n`;
        });
        message.slice(0, -1);

        return message;
    }
}

export { AtsuMessageType, AtsuMessageDirection, AtsuMessageResponseStatus, AtsuMessageSerializationFormat, AtsuMessage };
