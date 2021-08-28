import { NXDataStore } from "./persistence";

// SI base units
export type Celsius = number; // derived unit
export type HectoPascal = number; // derived unit
export type Kilogram = number;
export type Metre = number;

export class Units {
    private static _metricUnits: boolean;

    static get metricUnits(): boolean {
        if (Units._metricUnits === undefined) {
            NXDataStore.getAndSubscribe<string>('CONFIG_USING_METRIC_UNIT', (key: string, value: string) => {
                Units._metricUnits = value === '1';
            });
        }
        return Units._metricUnits;
    }

    static userToKilogram(value: number): Kilogram {
        return Units.metricUnits ? value : value / 2.20462;
    }

    static kilogramToUser(value: Kilogram): number {
        return Units.metricUnits ? value : value * 2.20462;
    }

    static get userWeightUnit(): 'kg' | 'lbs' {
        // EIS uses S suffix on LB
        return Units.metricUnits ? 'kg' : 'lbs';
    }

    static userToMetre(value: number): Metre {
        return Units.metricUnits ? value : value / 3.28084;
    }

    static metreToUser(value: Metre): number {
        return Units.metricUnits ? value : value * 3.28084;
    }

    static get userLengthUnit(): 'm' | 'ft' {
        return Units.metricUnits ? 'm' : 'ft';
    }

    static userToCelsius(value: number): Celsius {
        return Units.metricUnits ? value : (value - 32) * 5 / 9;
    }

    static celsiusToUser(value: Celsius): number {
        return Units.metricUnits ? value : value * 9 / 5 + 32;
    }

    static get userTemperatureUnit(): '°C' | '°F' {
        return Units.metricUnits ? '°C' : '°F';
    }

    static userToHectopascal(value: number): HectoPascal {
        return Units.metricUnits ? value : value * 33.863886666667;
    }

    static hectopascalToUser(value: Celsius): number {
        return Units.metricUnits ? value : value / 33.863886666667;
    }

    static hectopascalToUserString(value: Celsius): string {
        return Units.metricUnits ? "" + Math.round(value) : (Math.round(value / 0.33863886666667) / 100).toFixed(2);
    }

    static get userPressureUnit(): 'hPa' | 'in.Hg' {
        return Units.metricUnits ? 'hPa' : 'in.Hg';
    }
}
