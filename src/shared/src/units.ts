import { NXDataStore } from "./persistence";

// SI base units
export type Celsius = number; // derived unit
export type HectoPascal = number; // derived unit
export type KiloGram = number;
export type Metre = number;

// USCS base units
export type Fahrenheit = number;
export type Foot = number;
export type Pound = number;

export type InchOfMercury = number;

export class Units {
    private static _metricUnits: boolean;

    static get metricUnits(): boolean {
        if (Units._metricUnits === undefined) {
            NXDataStore.getAndSubscribe('CONFIG_USING_METRIC_UNIT', (key: string, value: string) => {
                Units._metricUnits = value === '1';
            });
        }
        return Units._metricUnits;
    }

    static poundToKilogram(value: Pound): KiloGram {
        return value / 2.204625
    }

    static kilogramToPound(value: KiloGram): Pound {
        return value * 2.204625;
    }

    static userToKilogram(value: Pound): KiloGram {
        return Units.metricUnits ? value : Units.poundToKilogram(value);
    }

    static kilogramToUser(value: KiloGram): Pound {
        return Units.metricUnits ? value : Units.kilogramToPound(value);
    }

    static get userWeightUnit(): 'kg' | 'lbs' {
        // EIS uses S suffix on LB
        return Units.metricUnits ? 'kg' : 'lbs';
    }

    static footToMetre(value: Foot): Metre {
        return value / 3.28084;
    }

    static metreToFoot(value: Metre): Foot {
        return value * 3.28084;
    }

    static userToMetre(value: Foot): Metre {
        return Units.metricUnits ? value : Units.footToMetre(value);
    }

    static metreToUser(value: Metre): Foot {
        return Units.metricUnits ? value : Units.metreToFoot(value);
    }

    static get userLengthUnit(): 'm' | 'ft' {
        return Units.metricUnits ? 'm' : 'ft';
    }

    static fahrenheitToCelsius(value: Fahrenheit): Celsius {
        return (value - 32) * 5 / 9;
    }

    static celsiusToFahrenheit(value: Celsius): Fahrenheit {
        return (value - 32) * 5 / 9;
    }

    static userToCelsius(value: Fahrenheit): Celsius {
        return Units.metricUnits ? value : Units.fahrenheitToCelsius(value);
    }

    static celsiusToUser(value: Celsius): Fahrenheit {
        return Units.metricUnits ? value : Units.celsiusToFahrenheit(value);
    }

    static get userTemperatureUnit(): '°C' | '°F' {
        return Units.metricUnits ? '°C' : '°F';
    }

    static inchOfMercuryToHectopascal(value: InchOfMercury): HectoPascal {
        return value * 33.863886666667;
    }

    static hectopascalToInchOfMercury(value: HectoPascal): InchOfMercury {
        return value / 33.863886666667;
    }

    static userToHectopascal(value: InchOfMercury): HectoPascal {
        return Units.metricUnits ? value : Units.inchOfMercuryToHectopascal(value);
    }

    static hectopascalToUser(value: Celsius): InchOfMercury {
        return Units.metricUnits ? value : Units.hectopascalToInchOfMercury(value);
    }

    static hectopascalToUserString(value: Celsius): string {
        return Units.metricUnits ? "" + Math.round(value) : (Math.round(Units.hectopascalToInchOfMercury(value)) / 100).toFixed(2);
    }

    static get userPressureUnit(): 'hPa' | 'in.Hg' {
        return Units.metricUnits ? 'hPa' : 'in.Hg';
    }
}
