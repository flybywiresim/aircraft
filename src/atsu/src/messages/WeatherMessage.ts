//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessageType, AtsuMessageDirection, AtsuMessageSerializationFormat, AtsuMessage } from './AtsuMessage';
import { wordWrap } from '../Common';

/**
 * Defines the general weather message format
 */
export class WeatherMessage extends AtsuMessage {
    public Reports = [];

    constructor() {
        super();
        this.Direction = AtsuMessageDirection.Uplink;
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

        if (format === AtsuMessageSerializationFormat.MCDU || format === AtsuMessageSerializationFormat.MCDUMonitored) {
            this.Reports.forEach((report) => {
                message += `{cyan}${type} ${report.airport}{end}\n`;

                // eslint-disable-next-line no-loop-func
                wordWrap(report.report, 25).forEach((line) => {
                    if (line.startsWith('D-ATIS')) {
                        message += `{amber}${line}{end}\n`;
                    } else if (line === 'NO METAR AVAILABLE' || line === 'NO TAF AVAILABLE') {
                        message += `{amber}${line}{end}\n`;
                    } else {
                        message += `{green}${line}{end}\n`;
                    }
                });

                message += '{white}------------------------{end}\n';
            });
        } else {
            this.Reports.forEach((report) => {
                message += `${type} ${report.airport}\n`;

                // eslint-disable-next-line no-loop-func
                message += `${report.report}\n`;

                message += '------------------------\n';
            });
        }

        return message;
    }
}
