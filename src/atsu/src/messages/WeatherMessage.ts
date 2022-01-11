//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessageType, AtsuMessageDirection, AtsuMessageResponseStatus, AtsuMessageSerializationFormat, AtsuMessage } from './AtsuMessage';

/**
 * Defines the general weather message format
 */
export class WeatherMessage extends AtsuMessage {
    public Airports = new Map<string, string[]>();

    constructor() {
        super();
        this.Direction = AtsuMessageDirection.Input;
    }

    public serialize(format: AtsuMessageSerializationFormat) {
        let type = '';
        switch (this.Type) {
        case AtsuMessageType.METAR:
            type = 'METAR';
            break;
        case AtsuMessageType.TAF:
            type = 'TAF';
            break;
        default:
            type = 'ATIS';
            break;
        }

        let message = '';

        if (format === AtsuMessageSerializationFormat.MCDU) {
            for (const airport of this.Airports.entries()) {
                message += `{cyan}${type} ${airport[0]}{end}\n`;

                // eslint-disable-next-line no-loop-func
                airport[1].forEach((line) => {
                    if (line.startsWith('D-ATIS')) {
                        message += `{amber}${line}{end}\n`;
                    } else {
                        message += `{green}${line}{end}\n`;
                    }
                });

                message += '{white}------------------------{end}';
            }
        } else {
            for (const airport of this.Airports.entries()) {
                message += `${type} ${airport[0]}\n`;

                // eslint-disable-next-line no-loop-func
                airport[1].forEach((line) => message += `${line}`);

                message += '{white}------------------------{end}';
            }
        }

        return message;
    }
}

export { AtsuMessageType, AtsuMessageDirection, AtsuMessageResponseStatus, AtsuMessageSerializationFormat, AtsuMessage };
