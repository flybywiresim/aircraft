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
});
