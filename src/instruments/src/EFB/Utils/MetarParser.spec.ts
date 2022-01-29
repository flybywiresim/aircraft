import { ColorCode } from '../../Common/metarTypes';
import { MetarParser } from './MetarParser';

describe('MetarParser', () => {
    test('Empty METAR Test', () => {
        // empty metar string
        expect(() => {
            MetarParser('');
        }).toThrow(new Error('Not enough METAR information found'));
    });

    test('Too Short METAR Test', () => {
        // empty metar string
        expect(() => {
            MetarParser('EDDM 291250Z');
        }).toThrow(new Error('Not enough METAR information found'));
    });

    test('Normal none color METAR Test', () => {
        const metarObject = MetarParser('EDDM 291350Z 26017KT 9999 DZ BKN027 09/00 Q1025 NOSIG');
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
        expect(metarObject.color_codes).toEqual(expect.arrayContaining(
            [ColorCode.Highlight, 0, 0, 0, 0, 0, 0, ColorCode.Info],
        ));
    });
});
