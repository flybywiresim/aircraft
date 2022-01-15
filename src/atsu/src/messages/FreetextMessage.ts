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

    public serialize(format: AtsuMessageSerializationFormat) {
        let message = '';

        if (format === AtsuMessageSerializationFormat.MCDU) {
            this.Lines.forEach((line) => {
                message += `{green}${line}{end}\n`;
            });
            message += '{white}------------------------{end}\n';
        } else {
            this.Lines.forEach((line) => message += `${line}\n`);
        }

        return message;
    }
}

export { AtsuMessageType, AtsuMessageDirection, AtsuMessageResponseStatus, AtsuMessageSerializationFormat, AtsuMessage };
