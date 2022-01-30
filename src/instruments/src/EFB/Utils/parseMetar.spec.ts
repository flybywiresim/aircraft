import { ColorCode } from '../../Common/metarTypes';
import { parseMetar } from './parseMetar';

describe('Test parseMetar when provided with', () => {
    test('an empty value, throws an error', () => {
        // empty metar string
        expect(() => {
            parseMetar('');
        }).toThrow(new Error('Not enough METAR information found'));
    });

    test('an incomplete value, throws an error', () => {
        // empty metar string
        expect(() => {
            parseMetar('EDDM 291250Z');
        }).toThrow(new Error('Not enough METAR information found'));
    });

    test('a normal value returns an object representation of that value', () => {
        const metarObject = parseMetar('EDDM 291350Z 26017KT 9999 DZ BKN027 09/00 Q1025 NOSIG');
        expect(metarObject.icao).toBe('EDDM');
        expect(metarObject.observed.getUTCDate()).toBe(29);
        expect(metarObject.observed.getUTCHours()).toBe(13);
        expect(metarObject.observed.getUTCMinutes()).toBe(50);
        expect(metarObject.wind.speed_kts).toBe(17);
        expect(metarObject.wind.gust_kts).toBe(17);
        expect(metarObject.wind.degrees).toBe(260);
        expect(metarObject.wind.degrees_from).toBe(260);
        expect(metarObject.wind.degrees_to).toBe(260);
        expect(metarObject.visibility.meters_float).toBe(9999);
        expect(metarObject.visibility.meters).toBe('10000');
        expect(metarObject.visibility.miles_float).toBe(6.213090551181102);
        expect(metarObject.visibility.miles).toBe('6');
        expect(metarObject.conditions).toHaveLength(1);
        expect(metarObject.conditions[0].code).toBe('DZ');
        expect(metarObject.clouds).toHaveLength(1);
        expect(metarObject.clouds[0].code).toBe('BKN');
        expect(metarObject.clouds[0].base_feet_agl).toBe(2700);
        expect(metarObject.temperature.celsius).toBe(9);
        expect(metarObject.dewpoint.celsius).toBe(0);
        expect(metarObject.barometer.mb).toBe(1025);
        expect(metarObject.barometer.hg).toBe(30.2682377);
        expect(metarObject.barometer.kpa).toBe(102.5);
        expect(metarObject.color_codes).toEqual(
            [ColorCode.Highlight, // EDDM
                ColorCode.None, // 291350Z
                ColorCode.None, // 26017KT
                ColorCode.None, // 9999
                ColorCode.None, // DZ
                ColorCode.None, // BKN027
                ColorCode.None, // 09/00
                ColorCode.None, // Q1025
                ColorCode.Info], // NOSIG
        );
    });

    test('a complex value returns an object representation of that value', () => {
        // eslint-disable-next-line max-len
        const metarObject = parseMetar('KJFK 291451Z 34027G34KT 300V020 1/4SM R04R/1600V2800FT +SN BLSN FZFG VV007 M09/M11 A2967 RMK AO2 PK WND 34035/1420 SLP046 SNINCR 1/8 P0000 60002 T10941111 51001');
        expect(metarObject.icao).toBe('KJFK');
        expect(metarObject.observed.getUTCDate()).toBe(29);
        expect(metarObject.observed.getUTCHours()).toBe(14);
        expect(metarObject.observed.getUTCMinutes()).toBe(51);
        expect(metarObject.wind.speed_kts).toBe(27);
        expect(metarObject.wind.gust_kts).toBe(34);
        expect(metarObject.wind.degrees).toBe(340);
        expect(metarObject.wind.degrees_from).toBe(300);
        expect(metarObject.wind.degrees_to).toBe(20);
        expect(metarObject.visibility.miles).toBe('0.5');
        expect(metarObject.visibility.miles_float).toBe(0.25);
        expect(metarObject.visibility.meters).toBe('500');
        expect(metarObject.visibility.meters_float).toBe(402.336);
        expect(metarObject.conditions).toHaveLength(6);
        expect(metarObject.conditions[0].code).toBe('+');
        // @ts-ignore
        expect(metarObject.conditions[1].code).toBe('SN');
        // @ts-ignore
        expect(metarObject.conditions[2].code).toBe('BL');
        // @ts-ignore
        expect(metarObject.conditions[3].code).toBe('SN');
        // @ts-ignore
        expect(metarObject.conditions[4].code).toBe('FZ');
        // @ts-ignore
        expect(metarObject.conditions[5].code).toBe('FG');
        expect(metarObject.clouds).toHaveLength(1);
        expect(metarObject.clouds[0].code).toBe('VV');
        expect(metarObject.clouds[0].base_feet_agl).toBe(700);
        expect(metarObject.temperature.celsius).toBe(-9);
        expect(metarObject.dewpoint.celsius).toBe(-11);
        expect(metarObject.barometer.mb).toBe(1004.741349708642);
        expect(metarObject.barometer.hg).toBe(29.67);
        expect(metarObject.barometer.kpa).toBe(100.4741349708642);
        expect(metarObject.color_codes).toHaveLength(metarObject.raw_parts.length);
        expect(metarObject.color_codes).toEqual(
            [ColorCode.Highlight, // KJFK
                ColorCode.None, // 291451Z
                ColorCode.Warning, // 34027G34KT
                ColorCode.None, // 300V020
                ColorCode.Warning, // 1/4SM
                ColorCode.None, // R04R/1600V2800FT
                ColorCode.Warning, // +SN
                ColorCode.Caution, // BLSN
                ColorCode.Warning, // FZFG
                ColorCode.Caution, // VV007
                ColorCode.Caution, // M09/M11
                ColorCode.None, // A2967
                ColorCode.Info, // RMK
                ColorCode.Info, // AO2
                ColorCode.Info, // PK
                ColorCode.Info, // WND
                ColorCode.Info, // 34035/1420
                ColorCode.Info, // SLP046
                ColorCode.Info, // SNINCR
                ColorCode.Info, // 1/8
                ColorCode.Info, // P0000
                ColorCode.Info, // 60002
                ColorCode.Info, // T10941111
                ColorCode.Info], // 51001
        );
    });
});
