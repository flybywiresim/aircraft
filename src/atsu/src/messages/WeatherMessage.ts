//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessageType, AtsuMessageDirection, AtsuMessageResponseStatus, AtsuMessageSerializationFormat, AtsuMessage } from './AtsuMessage';

/**
 * Defines the general weather message format
 */
export class WeatherMessage extends AtsuMessage {
    public Reports = [];

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
            this.Reports.forEach((report) => {
                message += `{cyan}${type} ${report.airport}{end}\n`;

                // eslint-disable-next-line no-loop-func
                report.report.forEach((line) => {
                    if (line.startsWith('D-ATIS')) {
                        message += `{amber}${line}{end}\n`;
                    } else {
                        message += `{green}${line}{end}\n`;
                    }
                });

                message += '{white}------------------------{end}';
            });
        } else {
            this.Reports.forEach((report) => {
                message += `${type} ${report.airport}\n`;

                // eslint-disable-next-line no-loop-func
                report.report.forEach((line) => message += `${line}`);

                message += '{white}------------------------{end}';
            });
        }

        return message;
    }
}

export { AtsuMessageType, AtsuMessageDirection, AtsuMessageResponseStatus, AtsuMessageSerializationFormat, AtsuMessage };
