/* eslint-disable jsdoc/check-indentation */

import { NumberUnitInterface, Unit, UnitFamily, UnitType } from '../../math';

/**
 * A utility class for creating duration formatters.
 *
 * Each duration formatter is a function which generates output strings from input duration values. The formatting
 * behavior of a formatter is defined by its format template.
 *
 * Format templates are strings which contain zero or more fragments enclosed by curly braces (`{}`); For a given
 * format template, an output string is generated from an input duration by replacing each fragment in the template
 * with a string generated from the input. The parts of the template string that are not contained in any fragment are
 * passed to the output unchanged. Each fragment defines how its replacement string is generated. There are two types
 * of fragments:
 * * Sign fragment. In EBNF notation, these take the form `['+'], ('-' | '–')`. Each sign fragment is replaced with
 * a character representing the sign of the input. The negative sign character is defined by the last character of
 * the fragment definition. The positive sign character (`+`) is included in the replacement if and only if it
 * appears in the fragment definition.
 * * Numeric fragment. In EBNF notation, these take the form
 * `{x}, ['?'], ['.', [{x}], ['(', {x}, ')']]`
 * where `x = 'H' | 'M' | 'S' | 'h' | 'm' | 's'`. Each numeric fragment is replaced with the numeric value of the
 * duration in hours, minutes, or seconds, depending on which character is used for `x`. With uppercase letters, the
 * entire portion of the input value is used. With lowercase letters, only the portion of the input value that does not
 * divide evenly into the next smallest unit is used (for hours, which is the largest unit, there is no difference
 * between using `'H'` and `'h'`).
 *   * The number of `x` characters to the left of the decimal point (including all characters if no decimal point is
 * present) in the definition controls the number of leading zeroes with which the output will be padded.
 *   * If the optional `'?'` character is present, the output will drop all digits to the left of the decimal point if
 * all such digits are equal to 0.
 *   * The total number of `x` characters to the right of the decimal point in the definition controls the decimal
 * precision of the output. Trailing zeroes to the right of the decimal point will be added to the output to a number
 * of decimal places equal to the number of non-parenthetical `x` characters to the right of the decimal point in the
 * definition. If there are no `x` characters to the right of the decimal point in the definition, then the output will
 * have infinite decimal precision with no extraneous trailing zeroes.
 *   * Rounding behavior is always round down.
 *
 * @example <caption>Formatting to hours-minutes-seconds</caption>
 * const formatter = DurationFormatter.create('{h}:{mm}:{ss}');
 * console.log(formatter(3616000));  // 1:00:16
 * console.log(formatter(36016900)); // 10:00:16
 *
 * @example <caption>Formatting to hours-minutes-seconds with decimal precision</caption>
 * const formatter = DurationFormatter.create('{h}:{mm}:{ss.s(s)}');
 * console.log(formatter(3600000)); // 1:00:00.0
 * console.log(formatter(3600550)); // 1:00:00.55
 *
 * @example <caption>Formatting to minutes-seconds</caption>
 * const formatter = DurationFormatter.create('{MM}:{ss}');
 * console.log(formatter(600000));  // 10:00
 * console.log(formatter(4200000)); // 70:00.
 *
 * @example <caption>Formatting with signs</caption>
 * const formatter = DurationFormatter.create('{-}{h}:{mm}');
 * console.log(formatter(3600000));  // 1:00
 * console.log(formatter(-3600000)); // -1:00
 *
 * const formatterWithPositiveSign = DurationFormatter.create('{+-}{h}:{mm}');
 * console.log(formatterWithPositiveSign(3600000));  // +1:00
 */
export class DurationFormatter {
  private static readonly FORMAT_REGEXP = /({[^{}]*})/;
  private static readonly SIGN_FRAGMENT_REGEX = /^\+?[-–]$/;
  private static readonly NUM_FRAGMENT_REGEXP = /^(([HMShms])+)(\?)?(?:(\.(\2*)(?:\((\2+)\))?)?)$/;

  private static readonly NUM_FRAGMENT_UNIT_INFO = {
    ['h']: { unit: UnitType.HOUR, mod: Infinity },
    ['m']: { unit: UnitType.MINUTE, mod: 60 },
    ['s']: { unit: UnitType.SECOND, mod: 60 },
    ['H']: { unit: UnitType.HOUR, mod: Infinity },
    ['M']: { unit: UnitType.MINUTE, mod: Infinity },
    ['S']: { unit: UnitType.SECOND, mod: Infinity }
  };

  private static readonly NUM_FRAGMENT_ROUND_FUNCS = {
    ['+']: Math.ceil,
    ['-']: Math.floor,
    ['~']: Math.round
  };

  /**
   * Creates a function which formats durations, expressed as numeric values, to strings. The formatting behavior of
   * the function is defined by a specified format template. For more information on format templates and their syntax,
   * please refer to the {@link DurationFormatter} class documentation.
   * @param format A template defining how the function formats durations.
   * @param unit The unit type in which the input duration values are expressed.
   * @param nanString The string to output when the input duration is `NaN`. Defaults to `'NaN'`.
   * @returns A function which formats durations, expressed as numeric values, to strings.
   */
  public static create(format: string, unit: Unit<UnitFamily.Duration>, nanString = 'NaN'): (duration: number) => string {
    const builder = DurationFormatter.createBuilder(format);

    return (duration: number): string => {
      if (isNaN(duration)) {
        return nanString;
      }

      return builder.reduce((string, part) => string + part(duration, unit), '');
    };
  }

  /**
   * Creates a function which formats durations, expressed as {@link NumberUnitInterface} objects, to strings. The
   * formatting behavior of the function is defined by a specified format template. For more information on format
   * templates and their syntax, please refer to the {@link DurationFormatter} class documentation.
   * @param format A template defining how the function formats durations.
   * @param nanString The string to output when the input duration is `NaN`. Defaults to `'NaN'`.
   * @returns A function which formats durations, expressed as {@link NumberUnitInterface} objects, to strings.
   */
  public static createForNumberUnit(format: string, nanString = 'NaN'): (duration: NumberUnitInterface<UnitFamily.Duration>) => string {
    const builder = DurationFormatter.createBuilder(format);

    return (duration: NumberUnitInterface<UnitFamily.Duration>): string => {
      if (duration.isNaN()) {
        return nanString;
      }

      return builder.reduce((string, part) => string + part(duration.number, duration.unit), '');
    };
  }

  /**
   * Creates an output string builder from a format template.
   * @param format A format template.
   * @returns An output string builder which conforms to the specified format template.
   */
  private static createBuilder(format: string): ((duration: number, unit: Unit<UnitFamily.Duration>) => string)[] {
    const split = format.split(DurationFormatter.FORMAT_REGEXP);

    return split.map((string): (duration: number, unit: Unit<UnitFamily.Duration>) => string => {
      if (string.match(DurationFormatter.FORMAT_REGEXP)) {
        return DurationFormatter.parseFragment(string.substring(1, string.length - 1));
      } else {
        return (): string => string;
      }
    });
  }

  /**
   * Parses a format template fragment and returns a function which generates a string from an input duration according
   * to the rules defined by the fragment. If the fragment is malformed, this method returns a function which always
   * generates an empty string.
   * @param fragment A format template fragment definition.
   * @returns A function which generates a string from an input duration in milliseconds according to the rules defined
   * by the template fragment.
   */
  private static parseFragment(fragment: string): (duration: number, unit: Unit<UnitFamily.Duration>) => string {
    const signMatch = fragment.match(DurationFormatter.SIGN_FRAGMENT_REGEX);
    if (signMatch) {
      const negSign = signMatch[0][signMatch[0].length - 1];
      const posSign = signMatch[0].length === 2 ? '+' : '';
      return (duration: number): string => {
        return duration < 0 ? negSign : posSign;
      };
    }

    const numMatch = fragment.match(DurationFormatter.NUM_FRAGMENT_REGEXP);

    if (!numMatch) {
      return (): string => '';
    }

    const unitInfo = DurationFormatter.NUM_FRAGMENT_UNIT_INFO[numMatch[2] as 'h' | 'm' | 's'];
    const pad = numMatch[1].length;
    const dropZero = !!numMatch[3];

    const formatLeftFunc = dropZero
      ? (
        (input: number): string => {
          const rounded = Math.floor(input);
          return rounded === 0 ? '' : rounded.toString().padStart(pad, '0');
        }
      )
      : (
        (input: number): string => Math.floor(input).toString().padStart(pad, '0')
      );

    if (numMatch[4]) {
      if (numMatch[4].length === 1) {
        return (duration: number, unit: Unit<UnitFamily.Duration>): string => {
          const converted = unitInfo.unit.convertFrom(Math.abs(duration), unit) % unitInfo.mod;
          const decimal = converted % 1;
          return `${formatLeftFunc(converted)}${decimal.toString().substring(1)}`;
        };
      }

      const forcedDecimalPlaces = numMatch[5]?.length ?? 0;
      const unforcedDecimalPlaces = numMatch[6]?.length ?? 0;
      const totalDecimalPlaces = forcedDecimalPlaces + unforcedDecimalPlaces;

      const factor = Math.pow(10, totalDecimalPlaces);

      return (duration: number, unit: Unit<UnitFamily.Duration>): string => {
        const converted = unitInfo.unit.convertFrom(Math.abs(duration), unit) % unitInfo.mod;
        const decimal = converted % 1;
        const decimalRounded = Math.floor(decimal * factor) / factor;

        return `${formatLeftFunc(converted)}.${decimalRounded.toString().substring(2).padEnd(forcedDecimalPlaces, '0')}`;
      };
    } else {
      return (duration: number, unit: Unit<UnitFamily.Duration>): string => {
        return formatLeftFunc(unitInfo.unit.convertFrom(Math.abs(duration), unit) % unitInfo.mod);
      };
    }
  }
}