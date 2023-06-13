import { Subject, Subscribable } from '@microsoft/msfs-sdk';

export interface DataEntryFormat<T> {
    placeholder: string;
    maxDigits: number;
    format(value: T): string;
    parse(input: string): Promise<T | null>;
    unitLeading: Subject<string>;
    unitTrailing: Subject<string>;
}

export class SpeedKnotsFormat implements DataEntryFormat<number> {
    public placeholder = '---';

    public maxDigits = 3;

    public isValidating = Subject.create(false);

    public unitLeading = Subject.create(null);

    public unitTrailing = Subject.create('KT');

    private minValue = 0;

    private maxValue = Number.POSITIVE_INFINITY;

    constructor(minValue: Subscribable<number> = Subject.create(0), maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY)) {
        minValue.sub((val) => this.minValue = val, true);
        maxValue.sub((val) => this.maxValue = val, true);
    }

    public format(value: number) {
        return value.toString();
    }

    public async parse(input: string) {
        const nbr = Number(input);
        if (Number.isNaN(nbr) === false && nbr <= this.maxValue && nbr >= this.minValue) {
            return Number(input);
        }
        return null;
    }
}

export class SpeedMachFormat implements DataEntryFormat<number> {
    public placeholder = '.--';

    public maxDigits = 3;

    public isValidating = Subject.create(false);

    public unitLeading = Subject.create(null);

    public unitTrailing = Subject.create(null);

    private minValue = 0;

    private maxValue = Number.POSITIVE_INFINITY;

    constructor(minValue: Subscribable<number> = Subject.create(0), maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY)) {
        minValue.sub((val) => this.minValue = val, true);
        maxValue.sub((val) => this.maxValue = val, true);
    }

    public format(value: number) {
        return `.${value.toFixed(2).split('.')[1]}`;
    }

    public async parse(input: string) {
        const nbr = Number(input);
        if (Number.isNaN(nbr) === false && nbr <= this.maxValue && nbr >= this.minValue) {
            return Number(input);
        }
        return null;
    }
}

export class AltitudeOrFlightLevelFormat implements DataEntryFormat<number> {
    public placeholder = '-----';

    public maxDigits = 5;

    public isValidating = Subject.create(false);

    public unitLeading = Subject.create(null);

    public unitTrailing = Subject.create('FT');

    private isFlightLevel = false;

    private minValue = 0;

    private maxValue = Number.POSITIVE_INFINITY;

    constructor(isFlightLevel: Subscribable<boolean> = Subject.create(false),
        minValue: Subscribable<number> = Subject.create(0),
        maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY)) {
        isFlightLevel.sub((val) => this.isFlightLevel = val, true);
        minValue.sub((val) => this.minValue = val, true);
        maxValue.sub((val) => this.maxValue = val, true);
    }

    public format(value: number) {
        if (this.isFlightLevel === true) {
            this.unitLeading.set('FL');
            this.unitTrailing.set(null);
            return (`00${(Math.round(value / 100)).toString()}`).slice(-3);
        }
        this.unitLeading.set(null);
        this.unitTrailing.set('FT');
        return value.toString();
    }

    public async parse(input: string) {
        let nbr = Number(input);
        if (Number.isNaN(nbr) === false && nbr <= this.maxValue && nbr >= this.minValue) {
            if (input.length <= 3 && nbr <= 430) {
                nbr *= 100; // convert FL to ft
                this.isFlightLevel = true;
                this.unitLeading.set('FL');
                this.unitTrailing.set(null);
            } else {
                this.isFlightLevel = false;
                this.unitLeading.set(null);
                this.unitTrailing.set('FT');
            }
            return Number(input);
        }
        return null;
    }
}

export class AltitudeFormat implements DataEntryFormat<number> {
    public placeholder = '-----';

    public maxDigits = 5;

    public isValidating = Subject.create(false);

    public unitLeading = Subject.create(null);

    public unitTrailing = Subject.create('FT');

    private minValue = 0;

    private maxValue = Number.POSITIVE_INFINITY;

    constructor(minValue: Subscribable<number> = Subject.create(0), maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY)) {
        minValue.sub((val) => this.minValue = val, true);
        maxValue.sub((val) => this.maxValue = val, true);
    }

    public format(value: number) {
        return value.toString();
    }

    public async parse(input: string) {
        const nbr = Number(input);
        if (Number.isNaN(nbr) === false && nbr <= (this.maxValue / 100) && nbr >= (this.minValue / 100)) {
            return Number(input); // Convert FL to feet
        }
        return null;
    }
}

export class FlightLevelFormat implements DataEntryFormat<number> {
    public placeholder = '---';

    public maxDigits = 3;

    public isValidating = Subject.create(false);

    public unitLeading = Subject.create('FL');

    public unitTrailing = Subject.create(null);

    private minValue = 0;

    private maxValue = Number.POSITIVE_INFINITY;

    constructor(minValue: Subscribable<number> = Subject.create(0), maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY)) {
        minValue.sub((val) => this.minValue = val, true);
        maxValue.sub((val) => this.maxValue = val, true);
    }

    public format(value: number) {
        const fl = Math.round(value / 100);
        return (`00${fl.toString()}`).slice(-3);
    }

    public async parse(input: string) {
        const nbr = Number(input);
        if (Number.isNaN(nbr) === false && nbr <= (this.maxValue / 100) && nbr >= (this.minValue / 100)) {
            return Number(input) * 100; // Convert FL to feet
        }
        return null;
    }
}

export class LengthFormat implements DataEntryFormat<number> {
    public placeholder = '----';

    public maxDigits = 4;

    public isValidating = Subject.create(false);

    public unitLeading = Subject.create(null);

    public unitTrailing = Subject.create('M');

    private minValue = 0;

    private maxValue = Number.POSITIVE_INFINITY;

    constructor(minValue: Subscribable<number> = Subject.create(0), maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY)) {
        minValue.sub((val) => this.minValue = val, true);
        maxValue.sub((val) => this.maxValue = val, true);
    }

    public format(value: number) {
        return value.toString();
    }

    public async parse(input: string) {
        const nbr = Number(input);
        if (Number.isNaN(nbr) === false && nbr <= this.maxValue && nbr >= this.minValue) {
            return Number(input);
        }
        return null;
    }
}

export class WeightFormat implements DataEntryFormat<number> {
    public placeholder = '---.-';

    public maxDigits = 5;

    public isValidating = Subject.create(false);

    public unitLeading = Subject.create(null);

    public unitTrailing = Subject.create('T');

    private minValue = 0;

    private maxValue = Number.POSITIVE_INFINITY;

    constructor(minValue: Subscribable<number> = Subject.create(0), maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY)) {
        minValue.sub((val) => this.minValue = val, true);
        maxValue.sub((val) => this.maxValue = val, true);
    }

    public format(value: number) {
        return value.toFixed(1);
    }

    public async parse(input: string) {
        const nbr = Number(input);
        if (Number.isNaN(nbr) === false && nbr <= this.maxValue && nbr >= this.minValue) {
            return Number(input);
        }
        return null;
    }
}

export class PercentageFormat implements DataEntryFormat<number> {
    public placeholder = '--.-';

    public maxDigits = 4;

    public isValidating = Subject.create(false);

    public unitLeading = Subject.create(null);

    public unitTrailing = Subject.create('%');

    private minValue = 0;

    private maxValue = Number.POSITIVE_INFINITY;

    constructor(minValue: Subscribable<number> = Subject.create(0), maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY)) {
        minValue.sub((val) => this.minValue = val, true);
        maxValue.sub((val) => this.maxValue = val, true);
    }

    public format(value: number) {
        return value.toFixed(1);
    }

    public async parse(input: string) {
        const nbr = Number(input);
        if (Number.isNaN(nbr) === false && nbr <= this.maxValue && nbr >= this.minValue) {
            return Number(input);
        }
        return null;
    }
}

export class TemperatureFormat implements DataEntryFormat<number> {
    public placeholder = '---';

    public maxDigits = 3;

    public isValidating = Subject.create(false);

    public unitLeading = Subject.create(null);

    public unitTrailing = Subject.create('°C');

    private minValue = 0;

    private maxValue = Number.POSITIVE_INFINITY;

    constructor(minValue: Subscribable<number> = Subject.create(0), maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY)) {
        minValue.sub((val) => this.minValue = val, true);
        maxValue.sub((val) => this.maxValue = val, true);
    }

    public format(value: number) {
        return value.toString();
    }

    public async parse(input: string) {
        const nbr = Number(input);
        if (Number.isNaN(nbr) === false && nbr <= this.maxValue && nbr >= this.minValue) {
            return Number(input);
        }
        return null;
    }
}

export class CostIndexFormat implements DataEntryFormat<number> {
    public placeholder = '--';

    public maxDigits = 2;

    public isValidating = Subject.create(false);

    public unitLeading = Subject.create(null);

    public unitTrailing = Subject.create(null);

    private minValue = 0;

    private maxValue = 999; // DSC-22-FMS-20-100

    public format(value: number) {
        return value.toString();
    }

    public async parse(input: string) {
        const nbr = Number(input);
        if (Number.isNaN(nbr) === false && nbr <= this.maxValue && nbr >= this.minValue) {
            return Number(input);
        }
        return null;
    }
}

export class VerticalSpeedFormat implements DataEntryFormat<number> {
    public placeholder = '---';

    public maxDigits = 4;

    public isValidating = Subject.create(false);

    public unitLeading = Subject.create(null);

    public unitTrailing = Subject.create('FT/MN');

    private minValue = 0;

    private maxValue = Number.POSITIVE_INFINITY;

    constructor(minValue: Subscribable<number> = Subject.create(0), maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY)) {
        minValue.sub((val) => this.minValue = val, true);
        maxValue.sub((val) => this.maxValue = val, true);
    }

    public format(value: number) {
        return value.toString();
    }

    public async parse(input: string) {
        const nbr = Number(input);
        if (Number.isNaN(nbr) === false && nbr <= this.maxValue && nbr >= this.minValue) {
            return Number(input);
        }
        return null;
    }
}

// TODO add coordinate types
