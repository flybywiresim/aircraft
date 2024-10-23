import { FmsError, FmsErrorType } from '@fmgc/FmsError';
import { Subject, Subscribable } from '@microsoft/msfs-sdk';
import { Mmo, maxCertifiedAlt } from '@shared/PerformanceConstants';

type FieldFormatTuple = [value: string | null, unitLeading: string | null, unitTrailing: string | null];
export interface DataEntryFormat<T> {
  placeholder: string;
  maxDigits: number;
  format(value: T | null): FieldFormatTuple;
  parse(input: string): Promise<T | null>;
  /**
   * If modified or notify()ed, triggers format() in the input field (i.e. when dependencies to value have changed)
   */
  reFormatTrigger?: Subscribable<boolean>;
}

export class SpeedKnotsFormat implements DataEntryFormat<number> {
  public placeholder = '---';

  public maxDigits = 3;

  private minValue = 0;

  private maxValue = Number.POSITIVE_INFINITY;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    minValue.sub((val) => (this.minValue = val), true);
    maxValue.sub((val) => (this.maxValue = val), true);
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, 'KT'] as FieldFormatTuple;
    }
    return [value.toString(), null, 'KT'] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (Number.isFinite(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class SpeedMachFormat implements DataEntryFormat<number> {
  public placeholder = '.--';

  public maxDigits = 3;

  private minValue = 0;

  private maxValue = Number.POSITIVE_INFINITY;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    minValue.sub((val) => (this.minValue = val), true);
    maxValue.sub((val) => (this.maxValue = val), true);
  }

  public format(value: number) {
    if (!value) {
      return [this.placeholder, null, null] as FieldFormatTuple;
    }
    return [`.${value.toFixed(2).split('.')[1]}`, null, null] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    let nbr = Number(input);
    if (nbr > Mmo && !input.search('.')) {
      nbr = Number(`0.${input}`);
    }
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

// Assumption: All values between 0 and 430 are FL, above are FT
export class AltitudeOrFlightLevelFormat implements DataEntryFormat<number> {
  public placeholder = '-----';

  public maxDigits = 5;

  private minValue = 0;

  private maxValue = maxCertifiedAlt;

  private transAlt: number | null = null;

  reFormatTrigger = Subject.create(false);

  constructor(
    transAlt: Subscribable<number | null> | null = null,
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(maxCertifiedAlt),
  ) {
    minValue.sub((val) => (this.minValue = val), true);
    maxValue.sub((val) => (this.maxValue = val), true);

    if (transAlt !== null) {
      transAlt.sub((val) => {
        this.transAlt = val;
        this.reFormatTrigger.notify();
      });
    }
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, 'FT'] as FieldFormatTuple;
    }
    if (this.transAlt !== null && value >= this.transAlt) {
      return [(value / 100).toFixed(0).toString().padStart(3, '0'), 'FL', null] as FieldFormatTuple;
    }
    return [value.toFixed(0).toString(), null, 'FT'] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    let nbr = Number(input);
    if (nbr < 430) {
      nbr = Number(input) * 100;
    }
    if (!Number.isNaN(nbr) && nbr >= this.minValue && nbr <= this.maxValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class AltitudeFormat implements DataEntryFormat<number> {
  public placeholder = '-----';

  public maxDigits = 5;

  private minValue = 0;

  private maxValue = maxCertifiedAlt;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(maxCertifiedAlt),
  ) {
    minValue.sub((val) => (this.minValue = val), true);
    maxValue.sub((val) => (this.maxValue = val), true);
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, 'FT'] as FieldFormatTuple;
    }
    return [value.toFixed(0).toString(), null, 'FT'] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

/**
 * Unit of value: Feet (i.e. FL * 100)
 */
export class FlightLevelFormat implements DataEntryFormat<number> {
  public placeholder = '---';

  public maxDigits = 3;

  private minValue = 0;

  private maxValue = maxCertifiedAlt;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(maxCertifiedAlt),
  ) {
    minValue.sub((val) => (this.minValue = val), true);
    maxValue.sub((val) => (this.maxValue = val), true);
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, 'FL', null] as FieldFormatTuple;
    }
    const fl = Math.round(value);
    return [fl.toFixed(0).toString().padStart(3, '0'), 'FL', null] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class TropoFormat implements DataEntryFormat<number> {
  public placeholder = '-----';

  public maxDigits = 5;

  private minValue = 1000;

  private maxValue = 60000;

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, 'FT'] as FieldFormatTuple;
    }
    return [value.toFixed(0).toString(), null, 'FT'] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = input.length <= 3 ? Number(input) * 100 : Number(input);
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class LengthFormat implements DataEntryFormat<number> {
  public placeholder = '----';

  public maxDigits = 4;

  private minValue = 0;

  private maxValue = Number.POSITIVE_INFINITY;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    minValue.sub((val) => (this.minValue = val), true);
    maxValue.sub((val) => (this.maxValue = val), true);
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, 'M'] as FieldFormatTuple;
    }
    return [value.toString(), null, 'M'] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class WeightFormat implements DataEntryFormat<number> {
  public placeholder = '---.-';

  public maxDigits = 5;

  private minValue = 0;

  private maxValue = Number.POSITIVE_INFINITY;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    minValue.sub((val) => (this.minValue = val), true);
    maxValue.sub((val) => (this.maxValue = val), true);
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, 'T'] as FieldFormatTuple;
    }
    return [(value / 1000).toFixed(1), null, 'T'] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input) * 1000;
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class PercentageFormat implements DataEntryFormat<number> {
  public placeholder = '--.-';

  public maxDigits = 4;

  public isValidating = Subject.create(false);

  private minValue = 0;

  private maxValue = Number.POSITIVE_INFINITY;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    minValue.sub((val) => (this.minValue = val), true);
    maxValue.sub((val) => (this.maxValue = val), true);
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, '%'] as FieldFormatTuple;
    }
    return [value.toFixed(1), null, '%'] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class TemperatureFormat implements DataEntryFormat<number> {
  public placeholder = '---';

  public maxDigits = 3;

  private minValue = 0;

  private maxValue = Number.POSITIVE_INFINITY;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    minValue.sub((val) => (this.minValue = val), true);
    maxValue.sub((val) => (this.maxValue = val), true);
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, '°C'] as FieldFormatTuple;
    }
    if (value >= 0) {
      return [`+${value.toFixed(0).toString()}`, null, '°C'] as FieldFormatTuple;
    }
    return [value.toFixed(0).toString(), null, '°C'] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class CrzTempFormat implements DataEntryFormat<number> {
  public placeholder = '---';

  public maxDigits = 3;

  private minValue = -99;

  private maxValue = 99;

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, '°C'] as FieldFormatTuple;
    }
    if (value >= 0) {
      return [`+${value.toFixed(0).toString()}`, null, '°C'] as FieldFormatTuple;
    }
    return [value.toFixed(0).toString(), null, '°C'] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    let nbr = Number(input);

    if (nbr > 0 && input.substring(0, 1) !== '+') {
      nbr *= -1;
    }

    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class WindDirectionFormat implements DataEntryFormat<number> {
  public placeholder = '---';

  public maxDigits = 3;

  private minValue = 0;

  private maxValue = 359;

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, '°'] as FieldFormatTuple;
    }
    return [value.toFixed(0).toString().padStart(3, '0'), null, '°'] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class WindSpeedFormat implements DataEntryFormat<number> {
  public placeholder = '---';

  public maxDigits = 3;

  private minValue = 0;

  private maxValue = 250;

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, 'KT'] as FieldFormatTuple;
    }
    return [value.toFixed(0).toString().padStart(3, '0'), null, 'KT'] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class TripWindFormat implements DataEntryFormat<number> {
  public placeholder = '-----';

  public maxDigits = 5;

  private minValue = -250;

  private maxValue = 250;

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, null] as FieldFormatTuple;
    }

    if (value >= 0) {
      return [Math.abs(value).toFixed(0).toString().padStart(3, '0'), 'TL', null] as FieldFormatTuple;
    }
    return [Math.abs(value).toFixed(0).toString().padStart(3, '0'), 'HD', null] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    let sign = +1;
    let number = 0;

    if (input) {
      if (input.substring(0, 2) === 'HD') {
        sign = -1;
        number = Number(input.substring(2));
      } else if (input.substring(0, 1) === '-' || input.substring(0, 1) === 'H') {
        sign = -1;
        number = Number(input.substring(1));
      } else if (input.substring(0, 2) === 'TL') {
        sign = +1;
        number = Number(input.substring(2));
      } else if (input.substring(0, 1) === '+' || input.substring(0, 1) === 'T') {
        sign = +1;
        number = Number(input.substring(1));
      } else if (!Number.isNaN(Number(input))) {
        sign = +1;
        number = Number(input);
      } else {
        return null;
      }
    } else {
      return null;
    }

    const nbr = Number(sign * number);
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class QnhFormat implements DataEntryFormat<number> {
  public placeholder = '----';

  public maxDigits = 5;

  private minHpaValue = 745;

  private maxHpaValue = 1100;

  private minInHgValue = 22.0;

  private maxInHgValue = 32.48;

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, null] as FieldFormatTuple;
    }
    return [value < this.minHpaValue ? value.toFixed(2) : value.toFixed(0), null, null] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (
      (!Number.isNaN(nbr) && nbr >= this.minHpaValue && nbr <= this.maxHpaValue) ||
      (nbr >= this.minInHgValue && nbr <= this.maxInHgValue)
    ) {
      return nbr;
    }
    if (!Number.isNaN(nbr) && nbr > this.minInHgValue * 100 && nbr <= this.maxInHgValue * 100) {
      return nbr / 100;
    }
    throw new FmsError(FmsErrorType.EntryOutOfRange);
  }
}

export class CostIndexFormat implements DataEntryFormat<number> {
  public placeholder = '--';

  public maxDigits = 3;

  private minValue = 0;

  private maxValue = 999; // DSC-22-FMS-20-100

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, null] as FieldFormatTuple;
    }
    return [value.toString(), null, null] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class VerticalSpeedFormat implements DataEntryFormat<number> {
  public placeholder = '---';

  public maxDigits = 4;

  private minValue = 0;

  private maxValue = Number.POSITIVE_INFINITY;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    minValue.sub((val) => (this.minValue = val), true);
    maxValue.sub((val) => (this.maxValue = val), true);
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, 'FT/MN'] as FieldFormatTuple;
    }
    return [value.toString(), null, 'FT/MN'] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class DescentRateFormat implements DataEntryFormat<number> {
  public placeholder = '----';

  public maxDigits = 4;

  private minValue = Number.NEGATIVE_INFINITY;

  private maxValue = 0;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    minValue.sub((val) => (this.minValue = val), true);
    maxValue.sub((val) => (this.maxValue = val), true);
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, 'FT/MN'] as FieldFormatTuple;
    }
    return [value.toString(), null, 'FT/MN'] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    let nbr = Number(input);

    if (nbr > 0) {
      nbr *= -1;
    }

    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class AirportFormat implements DataEntryFormat<string> {
  public placeholder = '----';

  public maxDigits = 4;

  public format(value: string) {
    if (!value) {
      return [this.placeholder, null, null] as FieldFormatTuple;
    }
    return [value, null, null] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '' || input === this.placeholder) {
      return null;
    }

    return input;
  }
}

export class NavaidIdentFormat implements DataEntryFormat<string> {
  public maxDigits = 4;

  constructor(public placeholder = '----') {}

  public format(value: string) {
    if (!value) {
      return [this.placeholder, null, null] as FieldFormatTuple;
    }
    return [value, null, null] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '' || input === this.placeholder) {
      return null;
    }

    return input;
  }
}

export class AirwayFormat implements DataEntryFormat<string> {
  public placeholder = '---';

  public maxDigits = 5;

  public format(value: string) {
    if (!value) {
      return [this.placeholder, null, null] as FieldFormatTuple;
    }
    return [value, null, null] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '' || input === this.placeholder) {
      return null;
    }

    return input;
  }
}

export class DropdownFieldFormat implements DataEntryFormat<string> {
  public placeholder = '';

  public maxDigits = 6;

  constructor(numDigits: number) {
    this.maxDigits = numDigits;
    this.placeholder = '-'.repeat(numDigits);
  }

  public format(value: string) {
    if (!value) {
      return [this.placeholder, null, null] as FieldFormatTuple;
    }
    return [value, null, null] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '' || input === this.placeholder) {
      return null;
    }

    return input;
  }
}

export class WaypointFormat implements DataEntryFormat<string> {
  public placeholder = '-------';

  public maxDigits = 7;

  public format(value: string) {
    if (!value) {
      return [this.placeholder, null, null] as FieldFormatTuple;
    }
    return [value, null, null] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '' || input === this.placeholder) {
      return null;
    }

    return input;
  }
}

export class LongAlphanumericFormat implements DataEntryFormat<string> {
  public placeholder = '----------';

  public maxDigits = 10;

  public format(value: string) {
    if (!value) {
      return [this.placeholder, null, null] as FieldFormatTuple;
    }
    return [value, null, null] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '' || input === this.placeholder) {
      return null;
    }

    return input;
  }
}

export class PaxNbrFormat implements DataEntryFormat<number> {
  public placeholder = '---';

  public maxDigits = 3;

  private minValue = 0;

  private maxValue = 999;

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, null] as FieldFormatTuple;
    }
    return [value.toFixed(0).toString(), null, null] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

// Stored in minutes
export class TimeHHMMFormat implements DataEntryFormat<number> {
  public placeholder = '--:--';

  public maxDigits = 4;

  private minValue = 0;

  private maxValue = 90;

  public format(value: number) {
    if (!value) {
      return [this.placeholder, null, null] as FieldFormatTuple;
    }
    const hours = Math.abs(Math.floor(value / 60))
      .toFixed(0)
      .padStart(2, '0');
    const minutes = Math.abs(value % 60)
      .toFixed(0)
      .padStart(2, '0');
    return [`${hours}:${minutes}`, null, null] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const replacedInput = input.replace(':', '');
    let hours = 0;
    let minutes = 0;
    minutes = Number(replacedInput.slice(-2));
    if (replacedInput.length > 2) {
      hours = Number(replacedInput.slice(0, -2));
    }
    if (minutes < 0 || minutes > 59 || hours < 0 || hours > 23) {
      return null;
    }

    const nbr = minutes + hours * 60;
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

/**
 * Stored in seconds
 */
export class TimeHHMMSSFormat implements DataEntryFormat<number> {
  public placeholder = '--:--:--';

  public maxDigits = 6;

  private minValue = 0;

  private maxValue = 86400;

  public format(value: number) {
    if (!value) {
      return [this.placeholder, null, null] as FieldFormatTuple;
    }
    const hours = Math.abs(Math.floor(value / 3600))
      .toFixed(0)
      .padStart(2, '0');
    const minutes = Math.abs(Math.floor(value / 60) % 60)
      .toFixed(0)
      .padStart(2, '0');
    const seconds = Math.abs(value % 60)
      .toFixed(0)
      .padStart(2, '0');
    return [`${hours}:${minutes}:${seconds}`, null, null] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const replacedInput = input.replace(':', '');
    if (replacedInput.length < 4) {
      return null;
    }

    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    minutes = Number(replacedInput.slice(2, 4));
    hours = Number(replacedInput.slice(0, 2));
    if (replacedInput.length > 4) {
      seconds = Number(replacedInput.slice(-2));
    }
    if (seconds < 0 || seconds > 59 || minutes < 0 || minutes > 59 || hours < 0 || hours > 23) {
      return null;
    }

    const nbr = seconds + minutes * 60 + hours * 3600;
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class LatitudeFormat implements DataEntryFormat<number> {
  public placeholder = '----.--';

  public maxDigits = 7;

  private minValue = -90;

  private maxValue = 90;

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, null] as FieldFormatTuple;
    }
    return [value.toFixed(0).toString(), null, null] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class HeadingFormat implements DataEntryFormat<number> {
  public placeholder = '---.-';

  public maxDigits = 5;

  private minValue = 0;

  private maxValue = 360.0;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    minValue.sub((val) => (this.minValue = val), true);
    maxValue.sub((val) => (this.maxValue = val), true);
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, '°T'] as FieldFormatTuple;
    }
    return [value.toFixed(1), null, '°T'] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

// Still need to find a way to store whether course is true or magnetic
export class InboundCourseFormat implements DataEntryFormat<number> {
  public placeholder = '---';

  public maxDigits = 4;

  private minValue = 0;

  private maxValue = 360.0;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    minValue.sub((val) => (this.minValue = val), true);
    maxValue.sub((val) => (this.maxValue = val), true);
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, '°'] as FieldFormatTuple;
    }
    return [value.toFixed(0), null, '°'] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class HoldDistFormat implements DataEntryFormat<number> {
  public placeholder = '--.-';

  public maxDigits = 4;

  private minValue = 0;

  private maxValue = 99.9;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    minValue.sub((val) => (this.minValue = val), true);
    maxValue.sub((val) => (this.maxValue = val), true);
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, 'NM'] as FieldFormatTuple;
    }
    return [value.toFixed(1), null, 'NM'] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class HoldTimeFormat implements DataEntryFormat<number> {
  public placeholder = '-.-';

  public maxDigits = 3;

  private minValue = 0;

  private maxValue = 9.9;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    minValue.sub((val) => (this.minValue = val), true);
    maxValue.sub((val) => (this.maxValue = val), true);
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, 'MN'] as FieldFormatTuple;
    }
    return [value.toFixed(1), null, 'MN'] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class FrequencyILSFormat implements DataEntryFormat<number> {
  public placeholder = '---.--';

  public maxDigits = 6;

  private minValue = 108.0;

  private maxValue = 111.95;

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, null] as FieldFormatTuple;
    }
    return [value.toFixed(2), null, null] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class FrequencyVORDMEFormat implements DataEntryFormat<number> {
  public placeholder = '---.--';

  public maxDigits = 6;

  private minValue = 108.0;

  private maxValue = 117.95;

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, null] as FieldFormatTuple;
    }
    return [value.toFixed(2), null, null] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class FrequencyADFFormat implements DataEntryFormat<number> {
  public placeholder = '----.-';

  public maxDigits = 6;

  private minValue = 190.0;

  private maxValue = 1750.0;

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, null] as FieldFormatTuple;
    }
    return [value.toFixed(1), null, null] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

// Still need to find a way to store whether course is true or magnetic
/** Negative number indicates back course */
export class LsCourseFormat implements DataEntryFormat<number> {
  public placeholder = '----';

  public maxDigits = 4;

  private minValue = -360;

  private maxValue = 360.0;

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, '°'] as FieldFormatTuple;
    }
    return [`${value < 0 ? 'B' : 'F'}${Math.abs(value).toFixed(0).padStart(3, '0')}`, null, '°'] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    let numberPart = input;
    let sign = +1;
    if (input.length === 4) {
      if (input[0] === 'F' || input[0] === 'B') {
        sign = input[0] === 'B' ? -1 : +1;
        numberPart = input.substring(1, 4);
      } else {
        numberPart = input.substring(0, 3);
      }
    }

    // FIXME Delete next line as soon as back course is implemented
    if (input[0] === 'B') throw new FmsError(FmsErrorType.FormatError);

    const nbr = Number(numberPart);
    if (!Number.isNaN(nbr) && nbr <= this.maxValue && nbr >= this.minValue) {
      return sign * nbr;
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}

export class SquawkFormat implements DataEntryFormat<number> {
  public placeholder = '----';

  public maxDigits = 4;

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, null] as FieldFormatTuple;
    }
    return [value.toFixed(0).padStart(this.maxDigits, '0'), null, null] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (!Number.isNaN(nbr) && /^[0-7]{4}$/.test(input)) {
      return nbr;
    }
    if (!/^[0-7]{4}$/.test(input)) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new FmsError(FmsErrorType.FormatError);
    }
  }
}
