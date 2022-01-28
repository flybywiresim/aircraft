import { MetarParserType } from '@instruments/common/metarTypes';

/*
    This is based on the work of Frank Boës and his aewx-metar-parser library.
    Copyright (c) 2019 Frank Boës / MIT License
    Github: github.com/fboes/metar-parser.git
 */

function formatMetar(str) {
    return str
        .replace(/{highlight}/g, "<span class='text-theme-highlight'>")
        .replace(/{caution}/g, "<span class='text-yellow-500'>")
        .replace(/{warning}/g, "<span class='text-red-900'>")
        .replace(/{rest}/g, "<span class='text-gray-500'>")
        .replace(/{end}/g, '</span>');
}

export function getColoredMetar(metar: MetarParserType): string {
    let coloredMetar: string = '';

    let mode = 0;
    let hasWind = 0;

    metar.raw_parts.forEach((metarPart) => {
        let match;
        if (mode < 3 && metarPart.match(/^(\d+)(?:\/(\d+))?(SM)?$/)) {
            mode = 3; // no wind reported
        }
        if (mode < 5 && metarPart.match(/^(FEW|SCT|BKN|OVC)(\d+)?/)) {
            mode = 5; // no visibility / conditions reported
        }
        if (mode < 6 && metarPart.match(/^M?\d+\/M?\d+$/)) {
            mode = 6; // end of clouds
        }
        // eslint-disable-next-line default-case
        switch (mode) {
        case 0:
            // ICAO Code
            coloredMetar = `{highlight}${metarPart}{end}`;
            mode = 1;
            break;
        case 1:
            // Observed Date
            match = metarPart.match(/^(\d\d)(\d\d)(\d\d)Z$/);
            if (match) {
                coloredMetar += ` ${match[0]}`;
                mode = 2;
            }
            break;
        case 2:
            // Wind
            match = metarPart.match(/^(\d\d\d|VRB)P?(\d+)(?:G(\d+))?(KT|MPS|KPH)/);
            if (match) {
                if (metar.wind.gust_kts > 30) {
                    coloredMetar += ` {warning}${match[0]}{end}`;
                } else if (metar.wind.gust_kts > 20) {
                    coloredMetar += ` {caution}${match[0]}{end}`;
                } else {
                    coloredMetar += ` ${match[0]}`;
                }
                hasWind = 1;
                mode = 3;
            }
            break;
        case 3:
            // Visibility
            match = metarPart.match(/^(\d+)(?:\/(\d+))?(SM)?$/);
            if (match) {
                if (metar.visibility.meters_float < 1000.0) {
                    coloredMetar += ` {warning}${match[0]}{end}`;
                } else if (metar.visibility.meters_float < 5000.0) {
                    coloredMetar += ` {caution}${match[0]}{end}`;
                } else {
                    coloredMetar += ` ${match[0]}`;
                }
                mode = 4;
            } else if (metarPart === 'CAVOK' || metarPart === 'CLR') {
                coloredMetar += ` ${metarPart}`;
                mode = 5; // no clouds & conditions reported
            } else if (hasWind) {
                // Variable wind direction
                match = metarPart.match(/^(\d+)V(\d+)$/);
                if (match) {
                    coloredMetar += ` ${match[0]}`;
                }
            }
            break;
        case 4:
            // Conditions
            match = metarPart.match(/^(\+|-|VC|RE)?([A-Z][A-Z])([A-Z][A-Z])?([A-Z][A-Z])?$/);
            if (match) {
                if (
                    match[1] === '+'
                    || match[2] === 'FZ' || match[2] === 'TS' || match[2] === 'ST' || match[2] === 'SQ' || match[2] === 'SS' || match[2] === 'DS'
                    || match[3] === 'FZ' || match[3] === 'TS' || match[3] === 'ST' || match[3] === 'SQ' || match[3] === 'SS' || match[3] === 'DS'
                    || match[4] === 'FZ' || match[4] === 'TS' || match[4] === 'ST' || match[4] === 'SQ' || match[4] === 'SS' || match[4] === 'DS'
                ) {
                    coloredMetar += ` {warning}${match[0]}{end}`;
                } else if (
                    match[2] === 'RA' || match[2] === 'SN' || match[2] === 'FG' || match[2] === 'VA'
                    || match[3] === 'RA' || match[3] === 'SN' || match[3] === 'FG' || match[3] === 'VA'
                    || match[4] === 'RA' || match[4] === 'SN' || match[4] === 'FG' || match[4] === 'VA'
                    || (match[2] === 'VC' && match[3] === 'SH')
                ) {
                    coloredMetar += ` {caution}${match[0]}{end}`;
                } else {
                    coloredMetar += ` ${match[0]}`;
                }
            }
            break;
        case 5:
            // eslint-disable-next-line no-debugger
            debugger;
            // Clouds
            match = metarPart.match(/^(FEW|SCT|BKN|OVC)(\d+)(TCU|CB)?/);
            if (match) {
                match[2] = Number(match[2]) * 100;
                if (match[2] <= 300) {
                    coloredMetar += ` {warning}${match[0]}{end}`;
                } else if (match[3] || match[2] < 800) {
                    coloredMetar += ` {caution}${match[0]}{end}`;
                } else {
                    coloredMetar += ` ${match[0]}`;
                }
            }
            break;
        case 6:
            // Temperature
            match = metarPart.match(/^(M?\d+)\/(M?\d+)$/);
            if (match) {
                if (metar.temperature.celsius < -20) {
                    coloredMetar += ` {warning}${match[0]}{end}`;
                } else if (metar.temperature.celsius < 8) {
                    coloredMetar += ` {caution}${match[0]}{end}`;
                } else {
                    coloredMetar += ` ${match[0]}`;
                }
                mode = 7;
            }
            break;
        case 7:
            // Pressure
            match = metarPart.match(/^([QA])(\d+)/);
            if (match) {
                coloredMetar += ` ${match[0]}`;
                mode = 8;
            }
            break;
        case 8:
            // Rest
            match = metarPart.match(/^(.*)$/);
            if (match) {
                coloredMetar += ` {rest}${match[0]}{end}`;
            }
            break;
        }
    });

    return formatMetar(coloredMetar);
}
