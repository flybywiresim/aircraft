// @ts-strict-ignore
import { NXFictionalMessages, NXSystemMessages } from '../messages/NXSystemMessages';
import { Column } from './A320_Neo_CDU_Format';
import { Keypad } from './A320_Neo_CDU_Keypad';

export type SelectedCallback = (
  /** The parsed and formatted value. */
  value: string | number | null,
) => void;

export class CDU_Field {
  protected currentValue: string | number | null = null;

  constructor(
    protected mcdu,
    protected selectedCallback: SelectedCallback,
  ) {}
  setOptions(options: CDU_SingleValueFieldOptions) {
    for (const option in options) {
      this[option] = options[option];
    }
  }

  getValue() {
    return '';
  }

  onSelect(_value?: string | number | null) {
    this.selectedCallback(this.currentValue);
  }

  getFieldAsColumnParameters() {
    const text = this.getValue();
    let color = Column.white;

    if (text.includes('[color]amber')) {
      color = Column.amber;
    } else if (text.includes('[color]red')) {
      color = Column.red;
    } else if (text.includes('[color]green')) {
      color = Column.green;
    } else if (text.includes('[color]cyan')) {
      color = Column.cyan;
    } else if (text.includes('[color]magenta')) {
      color = Column.magenta;
    } else if (text.includes('[color]yellow')) {
      color = Column.yellow;
    } else if (text.includes('[color]inop')) {
      color = Column.inop;
    }

    return [
      this.onSelect.bind(this),
      text
        .replace('[color]white', '')
        .replace('[color]amber', '')
        .replace('[color]red', '')
        .replace('[color]green', '')
        .replace('[color]cyan', '')
        .replace('[color]magenta', '')
        .replace('[color]yellow', '')
        .replace('[color]inop', ''),
      color,
    ];
  }
}

/**
 * @description Placeholder field that shows "NOT YET IMPLEMENTED" message when selected
 */
export class CDU_InopField extends CDU_Field {
  private value;

  // mcdu is A320_Neo_CDU_MainDisplay, but typing it would be a circular ref
  /**
   * @param inopColor whether to append "[color]inop" to the value
   */
  constructor(mcdu, value: string, inopColor: boolean = true) {
    super(mcdu, () => {});
    this.value = inopColor ? `${value}[color]inop` : value;
  }
  getValue() {
    return this.value;
  }

  onSelect() {
    this.mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
    super.onSelect();
  }
}

interface CDU_SingleValueFieldOptions {
  /** Default false. */
  clearable?: boolean;
  /** Default "". */
  emptyValue?: string;
  /** Default Infinity. */
  maxLength?: number;
  /** Default Infinity. */
  minValue?: number;
  /** Default Infinity. */
  maxValue?: number;
  /** Default undefined. */
  maxDisplayedDecimalPlaces?: number;
  /** Default "". */
  prefix?: string;
  /** Default "". */
  suffix?: string;
  /** Default undefined. */
  isValid?: (value: string | number | null) => boolean;
}

export class CDU_SingleValueField extends CDU_Field {
  protected clearable = false;
  protected emptyValue = '';
  protected maxLength = Infinity;
  protected minValue = -Infinity;
  protected maxValue = Infinity;
  protected prefix = '';
  protected suffix = '';
  protected maxDisplayedDecimalPlaces?: number;
  protected isValid?: (value: string | number | null) => boolean;

  constructor(
    mcdu, // A320_Neo_CDU_MainDisplay, but typing it would be a circular ref
    protected type: string | number,
    protected currentValue: string | number | null,
    options: CDU_SingleValueFieldOptions,
    selectedCallback: SelectedCallback,
  ) {
    super(mcdu, selectedCallback);
    this.setOptions(options);
  }

  /**
   * @returns {string}
   */
  getValue() {
    let value = this.currentValue;
    if (value === '' || value == null) {
      return this.emptyValue;
    }
    if (this.type === 'number' && isFinite(this.maxDisplayedDecimalPlaces)) {
      value = Number(value).toFixed(this.maxDisplayedDecimalPlaces);
    }
    return `${this.prefix}${value}${this.suffix}`;
  }

  /**
   * @param {*} value
   */
  setValue(value) {
    // Custom isValid callback
    if (value.length === 0 || (this.isValid && !this.isValid(value))) {
      this.mcdu.setScratchpadMessage(NXSystemMessages.formatError);
      return false;
    }

    switch (this.type) {
      case 'string':
        // Check max length
        if (value.length > this.maxLength) {
          this.mcdu.setScratchpadMessage(NXSystemMessages.formatError);
          return false;
        }
        break;
      case 'int': {
        // Make sure value is an integer and is within the min/max
        const valueAsInt = Number.parseInt(value, 10);
        if (!isFinite(valueAsInt) || value.includes('.')) {
          this.mcdu.setScratchpadMessage(NXSystemMessages.formatError);
          return false;
        }
        if (valueAsInt > this.maxValue || valueAsInt < this.minValue) {
          this.mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
          return false;
        }
        value = valueAsInt;
        break;
      }
      case 'number': {
        // Make sure value is a valid number and is within the min/max
        const valueAsFloat = Number.parseFloat(value);
        if (!isFinite(valueAsFloat)) {
          this.mcdu.setScratchpadMessage(NXSystemMessages.formatError);
          return false;
        }
        if (valueAsFloat > this.maxValue || valueAsFloat < this.minValue) {
          this.mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
          return false;
        }
        value = valueAsFloat;
        break;
      }
    }
    // Update the value
    this.currentValue = value;
    return true;
  }
  clearValue() {
    if (this.clearable) {
      if (this.type === 'string') {
        this.currentValue = '';
      } else {
        this.currentValue = null;
      }
    } else {
      this.mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
    }
  }
  onSelect(value?: string | number | null) {
    if (value === Keypad.clrValue) {
      this.clearValue();
    } else {
      if (!this.setValue(value)) {
        this.mcdu.setScratchpadUserData(value);
      }
    }
    super.onSelect();
  }
}

// TODO: Create classes for multi value fields
