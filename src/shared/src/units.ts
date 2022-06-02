import { NXDataStore } from './persistence';

// SI base units
export type Celsius = number; // derived unit
export type HectoPascal = number; // derived unit
export type KiloGram = number;
export type Metre = number;
export type Litre = number;

// USCS base units
export type Fahrenheit = number;
export type Foot = number;
export type Pound = number;
export type Gallon = number;

export type InchOfMercury = number;

export class Units {
    private static mMetricUnits: boolean;

    static get usingMetric(): boolean {
        if (Units.mMetricUnits === undefined) {
            NXDataStore.getAndSubscribe('CONFIG_USING_METRIC_UNIT', (_: string, value: string) => {
                Units.mMetricUnits = value === '1';
            });
        }
        return Units.mMetricUnits;
    }

    static poundToKilogram(value: Pound): KiloGram {
        return value / 2.204625;
    }

    static kilogramToPound(value: KiloGram): Pound {
        return value * 2.204625;
    }

    static userToKilogram(value: Pound): KiloGram {
        return Units.usingMetric ? value : Units.poundToKilogram(value);
    }

    static kilogramToUser(value: KiloGram): Pound | KiloGram {
        return Units.usingMetric ? value : Units.kilogramToPound(value);
    }

    static get userWeightSuffixEis2(): 'kg' | 'lbs' {
        // EIS uses S suffix on LB
        return Units.usingMetric ? 'kg' : 'lbs';
    }

    static footToMetre(value: Foot): Metre {
        return value / 3.28084;
    }

    static metreToFoot(value: Metre): Foot {
        return value * 3.28084;
    }

    static userToMetre(value: Foot): Metre {
        return Units.usingMetric ? value : Units.footToMetre(value);
    }

    static metreToUser(value: Metre): Foot | Metre {
        return Units.usingMetric ? value : Units.metreToFoot(value);
    }

    static get userLengthSuffixEis2(): 'm' | 'ft' {
        return Units.usingMetric ? 'm' : 'ft';
    }

    static fahrenheitToCelsius(value: Fahrenheit): Celsius {
        return (value - 32) * 5 / 9;
    }

    static celsiusToFahrenheit(value: Celsius): Fahrenheit {
        return (value * 9 / 5) + 32;
    }

    static userToCelsius(value: Fahrenheit): Celsius {
        return Units.usingMetric ? value : Units.fahrenheitToCelsius(value);
    }

    static celsiusToUser(value: Celsius): Fahrenheit | Celsius {
        return Units.usingMetric ? value : Units.celsiusToFahrenheit(value);
    }

    static get userTemperatureSuffixEis2(): '°C' | '°F' {
        return Units.usingMetric ? '°C' : '°F';
    }

    static inchOfMercuryToHectopascal(value: InchOfMercury): HectoPascal {
        return value * 33.863886666667;
    }

    static hectopascalToInchOfMercury(value: HectoPascal): InchOfMercury {
        return value / 33.863886666667;
    }

    static userToHectopascal(value: InchOfMercury): HectoPascal {
        return Units.usingMetric ? value : Units.inchOfMercuryToHectopascal(value);
    }

    static hectopascalToUser(value: Celsius): InchOfMercury {
        return Units.usingMetric ? value : Units.hectopascalToInchOfMercury(value);
    }

    static hectopascalToUserString(value: Celsius): string {
        return Units.usingMetric ? `${Math.round(value)}` : (Math.round(Units.hectopascalToInchOfMercury(value)) / 100).toFixed(2);
    }

    static get userPressureSuffixEis2(): 'hPa' | 'in.Hg' {
        return Units.usingMetric ? 'hPa' : 'in.Hg';
    }

    static gallonToLitre(value: number): Litre {
        return value * 3.78541;
    }

    static litreToGallon(value: number): Gallon {
        return value / 3.78541;
    }

    static litreToUser(value: number): Litre | Gallon {
        return Units.usingMetric ? value : value * 0.264172052358148;
    }

    static userToLitre(value: number): Litre {
        return Units.usingMetric ? value : value / 0.264172052358148;
    }

    static get userVolumeSuffixEis2(): 'l' | 'gal' {
        return Units.usingMetric ? 'l' : 'gal';
    }
}
