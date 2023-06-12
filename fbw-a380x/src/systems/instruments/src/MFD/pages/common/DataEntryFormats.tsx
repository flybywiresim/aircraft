import { Subject } from '@microsoft/msfs-sdk';

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

    public format(value: number) {
        return value.toString();
    }

    public async parse(input: string) {
        if (Number.isNaN(Number(input)) === false) {
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

    public format(value: number) {
        return `.${value.toFixed(2).split('.')[1]}`;
    }

    public async parse(input: string) {
        if (Number.isNaN(Number(input)) === false) {
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

    public format(value: number) {
        return value.toString();
    }

    public async parse(input: string) {
        if (Number.isNaN(Number(input)) === false) {
            if (input.length <= 3) {
                this.unitLeading.set('FL');
                this.unitTrailing.set(null);
            } else {
                this.unitLeading.set(null);
                this.unitTrailing.set('FT');
            }
            return Number(input);
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

    public format(value: number) {
        return value.toString();
    }

    public async parse(input: string) {
        if (Number.isNaN(Number(input)) === false) {
            return Number(input);
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

    public format(value: number) {
        return value.toString();
    }

    public async parse(input: string) {
        if (Number.isNaN(Number(input)) === false) {
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

    public format(value: number) {
        return value.toFixed(1);
    }

    public async parse(input: string) {
        if (Number.isNaN(Number(input)) === false) {
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

    public format(value: number) {
        return value.toFixed(1);
    }

    public async parse(input: string) {
        if (Number.isNaN(Number(input)) === false) {
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

    public format(value: number) {
        return value.toString();
    }

    public async parse(input: string) {
        if (Number.isNaN(Number(input)) === false) {
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

    public format(value: number) {
        return value.toString();
    }

    public async parse(input: string) {
        if (Number.isNaN(Number(input)) === false) {
            return Number(input);
        }
        return null;
    }
}

// TODO add coordinate types
