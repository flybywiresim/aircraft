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

// Assumption: All values between 0 and 430 are FL, above are FT (TODO check corner cases)
export class AltitudeOrFlightLevelFormat implements DataEntryFormat<number> {
    public placeholder = '-----';

    public maxDigits = 5;

    public isValidating = Subject.create(false);

    public unitLeading = Subject.create(null);

    public unitTrailing = Subject.create('FT');

    private isFlightLevel = false;

    private minValue = 0;

    private maxValue = Number.POSITIVE_INFINITY;

    constructor(minValue: Subscribable<number> = Subject.create(0),
        maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY)) {
        minValue.sub((val) => this.minValue = val, true);
        maxValue.sub((val) => this.maxValue = val, true);
    }

    public format(value: number) {
        if (value <= 430) {
            this.unitLeading.set('FL');
            this.unitTrailing.set(null);
            return value.toFixed(0).toString().padStart(3, '0');
        }
        this.unitLeading.set(null);
        this.unitTrailing.set('FT');
        return value.toFixed(0).toString();
    }

    public async parse(input: string) {
        const nbr = Number(input);
        const isWithinRange = (nbr >= this.minValue && nbr <= this.maxValue) || (nbr >= this.minValue / 100 && nbr <= this.maxValue / 100);
        if (Number.isNaN(nbr) === false && isWithinRange) {
            if (input.length <= 3 && nbr <= 430) {
                this.unitLeading.set('FL');
                this.unitTrailing.set(null);
            } else {
                this.unitLeading.set(null);
                this.unitTrailing.set('FT');
            }
            return nbr;
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
        return value.toFixed(0).toString();
    }

    public async parse(input: string) {
        const nbr = Number(input);
        if (Number.isNaN(nbr) === false && nbr <= this.maxValue && nbr >= this.minValue) {
            return Number(input);
        }
        return null;
    }
}

// Unit of value: Feet (i.e. FL * 100)
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
        return fl.toFixed(0).toString().padStart(3, '0');
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
        if (value >= 0) {
            return `+${value.toFixed(0).toString()}`;
        }
        return value.toFixed(0).toString();
    }

    public async parse(input: string) {
        const nbr = Number(input);
        if (Number.isNaN(nbr) === false && nbr <= this.maxValue && nbr >= this.minValue) {
            return Number(input);
        }
        return null;
    }
}

export class WindDirectionFormat implements DataEntryFormat<number> {
    public placeholder = '---';

    public maxDigits = 3;

    public isValidating = Subject.create(false);

    public unitLeading = Subject.create(null);

    public unitTrailing = Subject.create('°');

    private minValue = 0;

    private maxValue = 359;

    public format(value: number) {
        return value.toFixed(0).toString().padStart(3, '0');
    }

    public async parse(input: string) {
        const nbr = Number(input);
        if (Number.isNaN(nbr) === false && nbr <= this.maxValue && nbr >= this.minValue) {
            return Number(input);
        }
        return null;
    }
}

export class WindSpeedFormat implements DataEntryFormat<number> {
    public placeholder = '---';

    public maxDigits = 3;

    public isValidating = Subject.create(false);

    public unitLeading = Subject.create(null);

    public unitTrailing = Subject.create('KT');

    private minValue = 0;

    private maxValue = 250;

    public format(value: number) {
        return value.toFixed(0).toString().padStart(3, '0');
    }

    public async parse(input: string) {
        const nbr = Number(input);
        if (Number.isNaN(nbr) === false && nbr <= this.maxValue && nbr >= this.minValue) {
            return Number(input);
        }
        return null;
    }
}

export class QnhFormat implements DataEntryFormat<number> {
    public placeholder = '----';

    public maxDigits = 4;

    public isValidating = Subject.create(false);

    public unitLeading = Subject.create(null);

    public unitTrailing = Subject.create(null);

    private minHpaValue = 745;

    private maxHpaValue = 1100;

    private minInHgValue = 22.00;

    private maxInHgValue = 32.48;

    public format(value: number) {
        return value.toString();
    }

    public async parse(input: string) {
        const nbr = Number(input);
        if (Number.isNaN(nbr) === false && nbr <= this.maxHpaValue && nbr >= this.minHpaValue) {
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

export class AirportFormat implements DataEntryFormat<string> {
    public placeholder = '----';

    public maxDigits = 4;

    public isValidating = Subject.create(false);

    public unitLeading = Subject.create(null);

    public unitTrailing = Subject.create(null);

    public format(value: string) {
        return value;
    }

    public async parse(input: string) {
        return input;
    }
}

// TODO add coordinate types
