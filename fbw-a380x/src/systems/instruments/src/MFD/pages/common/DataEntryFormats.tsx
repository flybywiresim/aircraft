//  Copyright (c) 2024-2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0
import { Subject, Subscribable, Subscription } from '@microsoft/msfs-sdk';
import { Fix } from '@flybywiresim/fbw-sdk';
import { FmsError, FmsErrorType } from '@fmgc/FmsError';
import { Mmo, maxCertifiedAlt } from '@shared/PerformanceConstants';
import { WaypointEntryUtils } from '@fmgc/flightplanning/WaypointEntryUtils';
import { A380FmsError } from 'instruments/src/MFD/shared/A380FmsError';

type FieldFormatTuple = [value: string | null, unitLeading: string | null, unitTrailing: string | null];
const RANGE_FROM_KEY = '{FROM}';
const RANGE_TO_KEY = '{TO}';
const ERROR_UNIT = '{UNIT}';
const FORMAT = '{FORMAT}';
const FORMAT_ERROR_DETAILS_MESSAGE = `FORMAT: ${FORMAT}${ERROR_UNIT}`;
const ENTRY_OUT_OF_RANGE_DETAILS_MESSAGE = `RNG: ${RANGE_FROM_KEY} TO ${RANGE_TO_KEY}${ERROR_UNIT}`;

function getFormattedEntryOutOfRangeError(minValue: string, maxValue: string, unit?: string): A380FmsError {
  return new A380FmsError(
    FmsErrorType.EntryOutOfRange,
    ENTRY_OUT_OF_RANGE_DETAILS_MESSAGE.replace(RANGE_FROM_KEY, minValue)
      .replace(RANGE_TO_KEY, maxValue)
      .replace(ERROR_UNIT, unit ? ` ${unit}` : ''),
  );
}

function getFormattedFormatError(format: string, unit?: string): A380FmsError {
  return new A380FmsError(
    FmsErrorType.FormatError,
    FORMAT_ERROR_DETAILS_MESSAGE.replace(FORMAT, format).replace(ERROR_UNIT, unit ? ` ${unit}` : ''),
  );
}
export interface DataEntryFormat<T, U = T> {
  placeholder: string;
  maxDigits: number;
  maxOverflowDigits?: number;
  unit?: string;
  format(value: T | null): FieldFormatTuple;
  parse(input: string): Promise<U | null>;
  /**
   * If modified or notify()ed, triggers format() in the input field (i.e. when dependencies to value have changed)
   */
  reFormatTrigger?: Subscribable<boolean>;
  destroy?: () => void;
}

class SubscriptionCollector {
  protected readonly subscriptions: Subscription[] = [];

  destroy() {
    for (const s of this.subscriptions) {
      s.destroy();
    }
  }
}

export class SpeedKnotsFormat extends SubscriptionCollector implements DataEntryFormat<number> {
  public readonly placeholder = '---';

  public maxDigits = 3;

  public readonly unit = 'KT';

  private readonly requiredFormat = 'XXX';

  private minValue = 0;

  private maxValue = Number.POSITIVE_INFINITY;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    super();
    this.subscriptions.push(minValue.sub((val) => (this.minValue = val), true));
    this.subscriptions.push(maxValue.sub((val) => (this.maxValue = val), true));
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, this.unit] as FieldFormatTuple;
    }
    return [value.toString(), null, this.unit] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (Number.isNaN(nbr)) {
      throw getFormattedFormatError(this.requiredFormat, this.unit);
    }

    if (nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    } else {
      throw getFormattedEntryOutOfRangeError(this.minValue.toString(), this.maxValue.toString(), this.unit);
    }
  }

  destroy(): void {
    super.destroy();
  }
}

export class SpeedMachFormat extends SubscriptionCollector implements DataEntryFormat<number> {
  public readonly placeholder = '.--';

  public maxDigits = 3;

  private readonly requiredFormat = 'XX';

  private minValue = 0;

  private maxValue = Number.POSITIVE_INFINITY;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    super();
    this.subscriptions.push(minValue.sub((val) => (this.minValue = val), true));
    this.subscriptions.push(maxValue.sub((val) => (this.maxValue = val), true));
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
      throw getFormattedEntryOutOfRangeError(this.minValue.toString(), this.maxValue.toString());
    } else {
      throw getFormattedFormatError(this.requiredFormat);
    }
  }

  destroy(): void {
    super.destroy();
  }
}

export class AltitudeOrFlightLevelFormat extends SubscriptionCollector implements DataEntryFormat<number> {
  public placeholder = '-----';

  public maxDigits = 5;

  private minValue = 0;

  private readonly requiredFormat = 'FOR ALT XXXXX FOR FL XXX';

  private maxValue = maxCertifiedAlt;

  private transAlt: number | null = null;

  reFormatTrigger = Subject.create(false);

  constructor(
    transAlt: Subscribable<number | null> | null = null,
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(maxCertifiedAlt),
  ) {
    super();
    this.subscriptions.push(minValue.sub((val) => (this.minValue = val), true));
    this.subscriptions.push(maxValue.sub((val) => (this.maxValue = val), true));

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
    if (input.length <= 3) {
      nbr = Number(input) * 100;
    }

    if (Number.isNaN(nbr)) {
      throw getFormattedFormatError(this.requiredFormat);
    } else if (nbr > this.maxValue || nbr < this.minValue) {
      throw new A380FmsError(FmsErrorType.EntryOutOfRange);
    }

    return nbr;
  }

  destroy(): void {
    super.destroy();
  }
}

export class AltitudeFormat extends SubscriptionCollector implements DataEntryFormat<number> {
  public readonly placeholder = '-----';

  public maxDigits = 5;

  public readonly unit = 'FT';

  private readonly requiredFormat = 'XXXXX';

  private minValue = 0;

  private maxValue = maxCertifiedAlt;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(maxCertifiedAlt),
  ) {
    super();
    this.subscriptions.push(minValue.sub((val) => (this.minValue = val), true));
    this.subscriptions.push(maxValue.sub((val) => (this.maxValue = val), true));
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, this.unit] as FieldFormatTuple;
    }
    return [value.toFixed(0).toString(), null, this.unit] as FieldFormatTuple;
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
      throw new A380FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw getFormattedFormatError(this.requiredFormat, this.unit);
    }
  }

  destroy(): void {
    super.destroy();
  }
}

/**
 * Unit of value: Feet (i.e. FL * 100)
 */
export class FlightLevelFormat extends SubscriptionCollector implements DataEntryFormat<number> {
  public readonly placeholder = '---';

  public readonly maxDigits = 3;

  public readonly maxOverflowDigits = 3;

  public readonly unit = 'FL';

  private readonly requiredFormat = `FL XXX`;

  private minValue = 0;

  private maxValue = maxCertifiedAlt;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(maxCertifiedAlt / 100),
  ) {
    super();
    this.subscriptions.push(minValue.sub((val) => (this.minValue = val), true));
    this.subscriptions.push(maxValue.sub((val) => (this.maxValue = val), true));
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, this.unit, null] as FieldFormatTuple;
    }
    const fl = Math.round(value);
    return [fl.toFixed(0).toString().padStart(3, '0'), this.unit, null] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    // Accept "FL" followed by 1 to 3 digits, e.g. "FL30" or "FL300"
    let nbr: number = Number(input);
    if (Number.isNaN(nbr)) {
      const flMatch = input.match(/^FL(\d{1,3})$/i);
      if (flMatch) {
        nbr = Number(flMatch[1]);
      }
    }

    if (nbr > this.maxValue || nbr < this.minValue) {
      throw new A380FmsError(FmsErrorType.EntryOutOfRange);
    } else if (Number.isNaN(nbr)) {
      throw getFormattedFormatError(this.requiredFormat);
    }

    return nbr;
  }

  destroy(): void {
    super.destroy();
  }
}

export const RADIO_ALTITUDE_NODH_VALUE = -2;
export class RadioAltitudeFormat extends SubscriptionCollector implements DataEntryFormat<number> {
  public placeholder = '-----';

  public maxDigits = 5;

  private minValue = 0;

  private maxValue = maxCertifiedAlt;

  constructor(
    minValue: Subscribable<number> = Subject.create(1),
    maxValue: Subscribable<number> = Subject.create(maxCertifiedAlt),
  ) {
    super();
    this.subscriptions.push(minValue.sub((val) => (this.minValue = val), true));
    this.subscriptions.push(maxValue.sub((val) => (this.maxValue = val), true));
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, 'FT'] as FieldFormatTuple;
    }
    if (value === RADIO_ALTITUDE_NODH_VALUE) {
      return ['NO DH', null, null] as FieldFormatTuple;
    }
    return [value.toFixed(0).toString(), null, 'FT'] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    if (input === 'NO DH' || input === 'NODH' || input === 'NONE' || input === 'NO') {
      return RADIO_ALTITUDE_NODH_VALUE;
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

  destroy(): void {
    super.destroy();
  }
}

export class TropoFormat implements DataEntryFormat<number> {
  public readonly placeholder = '-----';

  public readonly unit = 'FT';

  public maxDigits = 5;

  private readonly requiredFormat = 'FOR ALT XXXXX FOR FL XXX';

  private minValue = 1000;

  private maxValue = 60000;

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, this.unit] as FieldFormatTuple;
    }
    return [value.toFixed(0).toString(), null, this.unit] as FieldFormatTuple;
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
      throw getFormattedFormatError(this.requiredFormat);
    }
  }
}

export class LengthFormat extends SubscriptionCollector implements DataEntryFormat<number> {
  public readonly placeholder = '----';

  public readonly unit = 'M';

  public maxDigits = 4;

  private readonly requiredFormat = 'XXXX';

  private minValue = 0;

  private maxValue = Number.POSITIVE_INFINITY;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    super();
    this.subscriptions.push(minValue.sub((val) => (this.minValue = val), true));
    this.subscriptions.push(maxValue.sub((val) => (this.maxValue = val), true));
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, this.unit] as FieldFormatTuple;
    }
    return [value.toString(), null, this.unit] as FieldFormatTuple;
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
      throw new A380FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw getFormattedFormatError(this.requiredFormat, this.unit);
    }
  }

  destroy(): void {
    super.destroy();
  }
}

export class WeightFormat extends SubscriptionCollector implements DataEntryFormat<number> {
  public readonly placeholder = '---.-';

  public readonly unit = 'T';

  public maxDigits = 5;

  private readonly requiredFormat = 'XXX.X';

  private minValue = 0;

  private maxValue = Number.POSITIVE_INFINITY;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    super();
    this.subscriptions.push(minValue.sub((val) => (this.minValue = val), true));
    this.subscriptions.push(maxValue.sub((val) => (this.maxValue = val), true));
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, this.unit] as FieldFormatTuple;
    }
    return [(value / 1000).toFixed(1), null, this.unit] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input) * 1000;

    if (Number.isNaN(nbr)) {
      throw getFormattedFormatError(this.requiredFormat, this.unit);
    }

    if (nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    } else {
      throw getFormattedEntryOutOfRangeError(
        (this.minValue / 1000).toFixed(1),
        (this.maxValue / 1000).toFixed(1),
        this.unit,
      );
    }
  }

  destroy(): void {
    super.destroy();
  }
}

export class PercentageFormat extends SubscriptionCollector implements DataEntryFormat<number> {
  public readonly placeholder = '--.-';

  public maxDigits = 4;

  public readonly isValidating = Subject.create(false);

  public readonly unit = '%';

  private readonly requiredFormat = 'XX.X';

  private minValue = 0;

  private maxValue = Number.POSITIVE_INFINITY;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    super();
    this.subscriptions.push(minValue.sub((val) => (this.minValue = val), true));
    this.subscriptions.push(maxValue.sub((val) => (this.maxValue = val), true));
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, this.unit] as FieldFormatTuple;
    }
    return [value.toFixed(1), null, this.unit] as FieldFormatTuple;
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
      throw getFormattedEntryOutOfRangeError(this.minValue.toFixed(1), this.maxValue.toFixed(1), this.unit);
    } else {
      throw getFormattedFormatError(this.requiredFormat, this.unit);
    }
  }

  destroy(): void {
    super.destroy();
  }
}

export class TemperatureFormat extends SubscriptionCollector implements DataEntryFormat<number> {
  public readonly placeholder = '---';

  public maxDigits = 3;

  public readonly unit = '°C';

  private readonly requiredFormat = '+/-XX';

  private minValue = 0;

  private maxValue = Number.POSITIVE_INFINITY;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    super();
    this.subscriptions.push(minValue.sub((val) => (this.minValue = val), true));
    this.subscriptions.push(maxValue.sub((val) => (this.maxValue = val), true));
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, this.unit] as FieldFormatTuple;
    }
    if (value >= 0) {
      return [`+${value.toFixed(0).toString()}`, null, this.unit] as FieldFormatTuple;
    }
    return [value.toFixed(0).toString(), null, this.unit] as FieldFormatTuple;
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
      throw getFormattedEntryOutOfRangeError(this.minValue.toString(), this.maxValue.toString(), this.unit);
    } else {
      throw getFormattedFormatError(this.requiredFormat, this.unit);
    }
  }

  destroy(): void {
    super.destroy();
  }
}

export class CrzTempFormat implements DataEntryFormat<number> {
  public readonly placeholder = '---';

  public readonly unit = '°C';

  private readonly requiredFormat = '+/-XXX';

  public maxDigits = 3;

  private minValue = -99;

  private maxValue = 99;

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, this.unit] as FieldFormatTuple;
    }
    if (value >= 0) {
      return [`+${value.toFixed(0).toString()}`, null, this.unit] as FieldFormatTuple;
    }
    return [value.toFixed(0).toString(), null, this.unit] as FieldFormatTuple;
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
      throw getFormattedEntryOutOfRangeError(this.minValue.toString(), this.maxValue.toString(), 'C');
    } else {
      throw getFormattedFormatError(this.requiredFormat, 'C');
    }
  }
}

export class WindDirectionFormat implements DataEntryFormat<number> {
  public readonly placeholder = '---';

  public readonly unit = '°';

  public maxDigits = 3;

  private readonly requiredFormat = 'XXX';

  private minValue = 0;

  private maxValue = 359;

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, this.unit] as FieldFormatTuple;
    }
    return [value.toFixed(0).toString().padStart(3, '0'), null, this.unit] as FieldFormatTuple;
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
      throw getFormattedEntryOutOfRangeError(this.minValue.toString(), this.maxValue.toString(), this.unit);
    } else {
      throw getFormattedFormatError(this.requiredFormat, this.unit);
    }
  }
}

export class WindSpeedFormat implements DataEntryFormat<number> {
  public readonly placeholder = '---';

  public readonly unit = 'KT';

  public maxDigits = 3;

  private minValue = 0;

  private maxValue = 250;

  private readonly requiredFormat = 'XXX';

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, this.unit] as FieldFormatTuple;
    }
    return [value.toFixed(0).toString().padStart(3, '0'), null, this.unit] as FieldFormatTuple;
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
      throw getFormattedEntryOutOfRangeError(this.minValue.toString(), this.maxValue.toString(), this.unit);
    } else {
      throw getFormattedFormatError(this.requiredFormat, this.unit);
    }
  }
}

export class TripWindFormat implements DataEntryFormat<number> {
  public placeholder = '-----';

  public maxDigits = 5;

  private readonly requiredFormat = '+/-XXX';

  public readonly unit = 'KT';

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
    } else {
      sign = +1;
      number = Number(input);
    }

    if (Number.isNaN(number)) {
      throw getFormattedFormatError(this.requiredFormat);
    }

    const nbr = Number(sign * number);
    if (nbr <= this.maxValue && nbr >= this.minValue) {
      return nbr;
    } else {
      throw getFormattedEntryOutOfRangeError(this.minValue.toString(), this.maxValue.toString(), this.unit);
    }
  }
}

export class QnhFormat implements DataEntryFormat<number> {
  public placeholder = '----';

  public maxDigits = 5;

  private readonly requiredFormat = 'XXXX';

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

    const nbr = Number.parseFloat(input);

    if (Number.isNaN(nbr)) {
      throw getFormattedFormatError(this.requiredFormat);
    }

    const hpa = input.indexOf('.') === -1 && input.length >= 3;
    const minValue = hpa ? this.minHpaValue : this.minInHgValue;
    const maxValue = hpa ? this.maxHpaValue : this.maxInHgValue;

    if (nbr >= minValue && nbr <= maxValue) {
      return nbr;
    } else {
      throw getFormattedEntryOutOfRangeError(
        hpa ? minValue.toString() : minValue.toFixed(2),
        hpa ? maxValue.toString() : maxValue.toFixed(2),
      );
    }
  }
}

export class CostIndexFormat implements DataEntryFormat<number> {
  public placeholder = '--';

  public maxDigits = 3;

  private minValue = 0;

  private maxValue = 999; // DSC-22-FMS-20-100

  private readonly requiredFormat = 'XXX';

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
      throw getFormattedEntryOutOfRangeError(this.minValue.toString(), this.maxValue.toString());
    } else {
      throw getFormattedFormatError(this.requiredFormat);
    }
  }
}

export class VerticalSpeedFormat extends SubscriptionCollector implements DataEntryFormat<number> {
  public placeholder = '---';

  public maxDigits = 4;

  public readonly unit = 'FT/MN';

  private readonly requiredFormat = '+/-XXXX';

  private minValue = 0;

  private maxValue = Number.POSITIVE_INFINITY;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    super();
    this.subscriptions.push(minValue.sub((val) => (this.minValue = val), true));
    this.subscriptions.push(maxValue.sub((val) => (this.maxValue = val), true));
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, this.unit] as FieldFormatTuple;
    }
    return [value.toString(), null, this.unit] as FieldFormatTuple;
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
      throw new A380FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw getFormattedFormatError(this.requiredFormat, this.unit);
    }
  }

  destroy(): void {
    super.destroy();
  }
}

export class DescentRateFormat extends SubscriptionCollector implements DataEntryFormat<number> {
  public placeholder = '----';

  public maxDigits = 4;

  public readonly unit = 'FT/MN';

  private readonly requiredFormat = '-XXXX';

  private minValue = Number.NEGATIVE_INFINITY;

  private maxValue = 0;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    super();
    this.subscriptions.push(minValue.sub((val) => (this.minValue = val), true));
    this.subscriptions.push(maxValue.sub((val) => (this.maxValue = val), true));
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, this.unit] as FieldFormatTuple;
    }
    return [value.toString(), null, this.unit] as FieldFormatTuple;
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
      throw getFormattedEntryOutOfRangeError(this.minValue.toString(), this.maxValue.toString(), this.unit);
    } else {
      throw getFormattedFormatError(this.requiredFormat, this.unit);
    }
  }

  destroy(): void {
    super.destroy();
  }
}

export class FixFormat implements DataEntryFormat<Fix, string> {
  public readonly placeholder = '-------';

  public readonly maxDigits = 7;

  private readonly requiredFormat = 'XXXXX';

  async parse(input: string): Promise<string | null> {
    if (input.trim().length === 0) {
      return null;
    }

    if (WaypointEntryUtils.isPlaceFormat(input) || WaypointEntryUtils.isRunwayFormat(input)) {
      return input;
    }

    throw getFormattedFormatError(this.requiredFormat);
  }

  format(value: Fix | null): FieldFormatTuple {
    if (!value) {
      return [this.placeholder, null, null];
    }

    return [value.ident, null, null];
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
  public readonly placeholder = '---';

  public maxDigits = 3;

  private readonly requiredFormat = 'XXX';

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
      throw getFormattedEntryOutOfRangeError(this.minValue.toString(), this.maxValue.toString());
    } else {
      throw getFormattedFormatError(this.requiredFormat);
    }
  }
}

// Stored in minutes
export class TimeHHMMFormat implements DataEntryFormat<number> {
  public placeholder = '--:--';

  public maxDigits = 4;

  private readonly requiredFormat = 'HHMM';

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
      throw new A380FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw getFormattedFormatError(this.requiredFormat);
    }
  }
}

/**
 * Stored in seconds
 */
export class TimeHHMMSSFormat implements DataEntryFormat<number> {
  public readonly placeholder = '--:--:--';

  public maxDigits = 6;

  private readonly requiredFormat = 'HHMMSS';

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
      throw new A380FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw getFormattedFormatError(this.requiredFormat);
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
      throw new A380FmsError(FmsErrorType.EntryOutOfRange);
    } else {
      throw new A380FmsError(FmsErrorType.FormatError);
    }
  }
}

export class HeadingFormat extends SubscriptionCollector implements DataEntryFormat<number> {
  public readonly placeholder = '---.-';

  public maxDigits = 5;

  public readonly unit = '°';

  private readonly requiredFormat = 'XXX.X';

  private minValue = 0;

  private maxValue = 360.0;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    super();
    this.subscriptions.push(minValue.sub((val) => (this.minValue = val), true));
    this.subscriptions.push(maxValue.sub((val) => (this.maxValue = val), true));
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
      throw getFormattedEntryOutOfRangeError(
        this.minValue.toFixed(1).padStart(4, '0'),
        this.maxValue.toFixed(1),
        this.unit,
      );
    } else {
      throw getFormattedFormatError(this.requiredFormat, this.unit);
    }
  }

  destroy(): void {
    super.destroy();
  }
}

// Still need to find a way to store whether course is true or magnetic
export class InboundCourseFormat extends SubscriptionCollector implements DataEntryFormat<number> {
  public placeholder = '---';

  public maxDigits = 4;

  public readonly unit = '°';

  private readonly requiredFormat = 'XXX';

  private minValue = 0;

  private maxValue = 360.0;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    super();
    this.subscriptions.push(minValue.sub((val) => (this.minValue = val), true));
    this.subscriptions.push(maxValue.sub((val) => (this.maxValue = val), true));
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, this.unit] as FieldFormatTuple;
    }
    return [value.toFixed(0), null, this.unit] as FieldFormatTuple;
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
      throw getFormattedEntryOutOfRangeError(this.minValue.toFixed(0), this.maxValue.toFixed(0), this.unit);
    } else {
      throw getFormattedFormatError(this.requiredFormat, this.unit);
    }
  }

  destroy(): void {
    super.destroy();
  }
}

export class HoldDistFormat extends SubscriptionCollector implements DataEntryFormat<number> {
  public placeholder = '--.-';

  public maxDigits = 4;

  public readonly unit = 'NM';

  private readonly requiredFormat = 'XX.X';

  private minValue = 0;

  private maxValue = 99.9;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    super();
    this.subscriptions.push(minValue.sub((val) => (this.minValue = val), true));
    this.subscriptions.push(maxValue.sub((val) => (this.maxValue = val), true));
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, this.unit] as FieldFormatTuple;
    }
    return [value.toFixed(1), null, this.unit] as FieldFormatTuple;
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
      throw getFormattedEntryOutOfRangeError(this.minValue.toFixed(1), this.maxValue.toFixed(1), this.unit);
    } else {
      throw getFormattedFormatError(this.requiredFormat, this.unit);
    }
  }

  destroy(): void {
    super.destroy();
  }
}

export class HoldTimeFormat extends SubscriptionCollector implements DataEntryFormat<number> {
  public readonly placeholder = '-.-';

  public maxDigits = 3;

  public readonly unit = 'MN';

  private readonly requiredFormat = 'X.X';

  private minValue = 0;

  private maxValue = 9.9;

  constructor(
    minValue: Subscribable<number> = Subject.create(0),
    maxValue: Subscribable<number> = Subject.create(Number.POSITIVE_INFINITY),
  ) {
    super();
    this.subscriptions.push(minValue.sub((val) => (this.minValue = val), true));
    this.subscriptions.push(maxValue.sub((val) => (this.maxValue = val), true));
  }

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, this.unit] as FieldFormatTuple;
    }
    return [value.toFixed(1), null, this.unit] as FieldFormatTuple;
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
      throw getFormattedEntryOutOfRangeError(this.minValue.toFixed(1), this.maxValue.toFixed(1), this.unit);
    } else {
      throw getFormattedFormatError(this.requiredFormat, this.unit);
    }
  }

  destroy(): void {
    super.destroy();
  }
}

export class FrequencyILSFormat implements DataEntryFormat<number> {
  public placeholder = '---.--';

  public maxDigits = 6;

  private readonly requiredFormat = 'XXX.XX';

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
      throw getFormattedEntryOutOfRangeError(this.minValue.toFixed(2), this.maxValue.toFixed(2));
    } else {
      throw getFormattedFormatError(this.requiredFormat);
    }
  }
}

export class FrequencyVORDMEFormat implements DataEntryFormat<number> {
  public readonly placeholder = '---.--';

  public maxDigits = 6;

  private readonly requiredFormat = 'XXX.XX';

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
      throw getFormattedEntryOutOfRangeError(this.minValue.toFixed(2), this.maxValue.toFixed(2));
    } else {
      throw getFormattedFormatError(this.requiredFormat);
    }
  }
}

export class FrequencyADFFormat implements DataEntryFormat<number> {
  public placeholder = '----.-';

  public maxDigits = 6;

  private readonly requiredFormat = 'XXXX.X';

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
      throw getFormattedEntryOutOfRangeError(this.minValue.toFixed(1), this.maxValue.toFixed(1));
    } else {
      throw getFormattedFormatError(this.requiredFormat);
    }
  }
}

// Still need to find a way to store whether course is true or magnetic
/** Negative number indicates back course */
export class LsCourseFormat extends SubscriptionCollector implements DataEntryFormat<number> {
  public placeholder = '----';

  public maxDigits = 4;

  public readonly unit = '°';

  private minValue = -360;

  private maxValue = 360.0;

  private readonly displayMinValue = 0;

  private readonly requiredFormat = 'FXXX';

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, this.unit] as FieldFormatTuple;
    }
    return [
      `${value < 0 ? 'B' : 'F'}${Math.abs(value).toFixed(0).padStart(3, '0')}`,
      null,
      this.unit,
    ] as FieldFormatTuple;
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

    // FIXME Delete next line and change required format as soon as back course is implemented
    if (input[0] === 'B') throw getFormattedFormatError(this.requiredFormat);

    const nbr = Number(numberPart);

    if (Number.isNaN(nbr)) {
      throw getFormattedFormatError(this.requiredFormat);
    }

    if (nbr <= this.maxValue && nbr >= this.minValue) {
      return sign * nbr;
    } else {
      throw getFormattedEntryOutOfRangeError(this.displayMinValue.toString(), this.maxValue.toFixed(0), this.unit);
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

    throw new A380FmsError(FmsErrorType.FormatError);
  }
}

/**
 * FIX INFO radial
 */
export class RadialFormat implements DataEntryFormat<number> {
  public readonly placeholder = '---';

  public readonly maxDigits = 4;

  public readonly unit = '°';

  private readonly requiredFormat = 'XXX';

  private readonly minValue = 0;

  private readonly maxValue = 360.0;

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, null] as FieldFormatTuple;
    }

    return [value.toFixed(0).padStart(3, '0'), null, '°'] as FieldFormatTuple;
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
      throw getFormattedEntryOutOfRangeError(this.minValue.toString(), this.maxValue.toFixed(0), this.unit);
    } else {
      throw getFormattedFormatError(this.requiredFormat, this.unit);
    }
  }
}

/**
 * FIX INFO radius
 */
export class RadiusFormat implements DataEntryFormat<number> {
  public readonly placeholder = '----';

  public readonly maxDigits = 4;

  public readonly unit = 'NM';

  private readonly requiredFormat = 'XXXX';

  private readonly minValue = 1;

  private readonly maxValue = 9999;

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, null] as FieldFormatTuple;
    }

    return [value.toFixed(0), null, this.unit] as FieldFormatTuple;
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
      throw getFormattedEntryOutOfRangeError(this.minValue.toString(), this.maxValue.toString(), this.unit);
    } else {
      throw getFormattedFormatError(this.requiredFormat, this.unit);
    }
  }
}

export class RnpFormat implements DataEntryFormat<number> {
  public readonly placeholder = '--.-';

  public readonly maxDigits = 4;

  private readonly minValue = 0.01;

  private readonly maxValue = 20.0;

  public readonly unit = 'NM';

  private readonly requiredFormat = 'X.XX';

  public format(value: number) {
    if (value === null || value === undefined) {
      return [this.placeholder, null, null] as FieldFormatTuple;
    }
    return [value > 10.0 ? value.toFixed(1) : value.toFixed(2), null, this.unit] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    const nbr = Number(input);
    if (Number.isNaN(nbr)) {
      throw getFormattedFormatError(this.requiredFormat, this.unit);
    }
    if (nbr > this.maxValue || nbr < this.minValue) {
      throw getFormattedEntryOutOfRangeError(this.minValue.toFixed(2), this.maxValue.toFixed(1), this.unit);
    }

    return nbr;
  }
}

export class FuelPenaltyPercentFormat implements DataEntryFormat<number> {
  public readonly placeholder = '+000.0'; // Always exists even if cleared

  readonly maxDigits = 6;

  private readonly minValue = 0;

  private readonly maxValue = 999.9;

  private readonly unit = '%';

  format(value: number): FieldFormatTuple {
    if (value === null || value === undefined) {
      return [this.placeholder, null, this.unit] as FieldFormatTuple;
    }

    return ['+' + value.toFixed(1).padStart(5, '0'), null, this.unit] as FieldFormatTuple;
  }

  public async parse(input: string) {
    if (input === '') {
      return null;
    }

    // Validate format (+)NNN.N.
    if (!/^[+]?\d{1,3}(?:\.\d)?$/.test(input)) {
      throw new FmsError(FmsErrorType.FormatError);
    }

    const numberInput = Number(input);

    if (numberInput < this.minValue || numberInput > this.maxValue) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    }

    return numberInput;
  }
}
