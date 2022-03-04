/**
 * Options for creating a number formatter.
 */
export type NumberFormatterOptions = {
  /** The precision to which to round the number. A value of 0 denotes no rounding. */
  precision: number,

  /** Rounding behavior. Always round down = -1. Always round up = +1. Normal rounding = 0. */
  round: -1 | 0 | 1,

  /** The maximum number of digits to enforce. */
  maxDigits: number,

  /** Whether to force trailing zeroes after the decimal point. */
  forceDecimalZeroes: boolean,

  /** The number of digits to which to pad with zeroes in front of the decimal point. */
  pad: number,

  /** Whether to show commas. */
  showCommas: boolean,

  /** Whether to force the display of a positive sign. */
  forceSign: boolean,

  /** The string to use for NaN. */
  nanString: string;
};

/**
 * A utility class for creating number formatters.
 */
export class NumberFormatter {
  public static readonly DEFAULT_OPTIONS: NumberFormatterOptions = {
    precision: 0,
    round: 0,
    maxDigits: Infinity,
    forceDecimalZeroes: true,
    pad: 1,
    showCommas: false,
    forceSign: false,
    nanString: 'NaN'
  };

  private static readonly roundFuncs = {
    [-1]: Math.floor,
    [0]: Math.round,
    [1]: Math.ceil
  }

  /**
   * Formats a number to a string.
   * @param precision The precision to which to round the number. A value of 0 denotes no rounding.
   * @param roundFunc The rounding function to use.
   * @param maxDigits The maximum number of digits to enforce.
   * @param forceDecimalZeroes Whether to force trailing zeroes after the decimal point.
   * @param pad The number of digits to which to pad with zeroes in front of the decimal point.
   * @param showCommas Whether to show commas.
   * @param forceSign Whether to force the display of a positive sign.
   * @param nanString The string to use for NaN.
   * @param number The number to format.
   * @returns A formatted string.
   */
  private static formatNumber(
    precision: number,
    roundFunc: (number: number) => number,
    maxDigits: number,
    forceDecimalZeroes: boolean,
    pad: number,
    showCommas: boolean,
    forceSign: boolean,
    nanString: string,
    number: number
  ): string {
    if (isNaN(number)) {
      return nanString;
    }

    const sign = number < 0 ? '-' : '+';
    const abs = Math.abs(number);
    let formatted: string;
    if (precision != 0) {
      const rounded = roundFunc(abs / precision) * precision;
      const precisionString = `${precision}`;
      const decimalIndex = precisionString.indexOf('.');
      if (decimalIndex >= 0) {
        formatted = rounded.toFixed(precisionString.length - decimalIndex - 1);
      } else {
        formatted = `${rounded}`;
      }
    } else {
      formatted = `${abs}`;
    }

    let decimalIndex = formatted.indexOf('.');
    if (!forceDecimalZeroes && decimalIndex >= 0) {
      formatted = formatted.replace(/0+$/, '');
      if (formatted.indexOf('.') == formatted.length - 1) {
        formatted = formatted.substring(0, formatted.length - 1);
      }
    }

    decimalIndex = formatted.indexOf('.');
    if (decimalIndex >= 0 && formatted.length - 1 > maxDigits) {
      const shift = Math.max(maxDigits - decimalIndex, 0);
      const shiftPrecision = Math.pow(0.1, shift);
      formatted = (roundFunc(abs / shiftPrecision) * shiftPrecision).toFixed(shift);
    }
    formatted;

    if (pad === 0) {
      formatted = formatted.replace(/^0\./, '.');
    } else if (pad > 1) {
      decimalIndex = formatted.indexOf('.');
      if (decimalIndex < 0) {
        decimalIndex = formatted.length;
      }
      formatted = formatted.padStart(pad + formatted.length - decimalIndex, '0');
    }

    if (showCommas) {
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      formatted = parts.join('.');
    }

    return ((forceSign || sign === '-') ? sign : '') + formatted;
  }

  /**
   * Creates a number formatter.
   * @param options Options to customize the formatter.
   * @returns A number formatter.
   */
  public static create(options: Partial<NumberFormatterOptions>): (number: number) => string {
    const optsToUse = Object.assign({}, NumberFormatter.DEFAULT_OPTIONS);
    Object.assign(optsToUse, options);

    return (NumberFormatter.formatNumber as any).bind(
      undefined,
      optsToUse.precision,
      NumberFormatter.roundFuncs[optsToUse.round],
      optsToUse.maxDigits,
      optsToUse.forceDecimalZeroes,
      optsToUse.pad,
      optsToUse.showCommas,
      optsToUse.forceSign,
      optsToUse.nanString
    );
  }
}