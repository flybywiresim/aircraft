// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

type ColorValue = 'amber' | 'red' | 'green' | 'cyan' | 'white' | 'magenta' | 'yellow' | 'inop';
interface ColorAttribute {
  color: ColorValue;
}

type SizeValue = 'small' | 'big';
interface SizeAttribute {
  size: SizeValue;
}

interface AlignAttribute {
  alignRight: boolean;
}

type Attribute = ColorAttribute | SizeAttribute | AlignAttribute;

/** Used to displayed data on a mcdu page when using the formatting helper */
export class Column {
  public static left: AlignAttribute = { alignRight: false };
  public static right: AlignAttribute = { alignRight: true };
  public static small: SizeAttribute = { size: 'small' };
  public static big: SizeAttribute = { size: 'big' };
  public static amber: ColorAttribute = { color: 'amber' };
  public static red: ColorAttribute = { color: 'red' };
  public static green: ColorAttribute = { color: 'green' };
  public static cyan: ColorAttribute = { color: 'cyan' };
  public static white: ColorAttribute = { color: 'white' };
  public static magenta: ColorAttribute = { color: 'magenta' };
  public static yellow: ColorAttribute = { color: 'yellow' };
  public static inop: ColorAttribute = { color: 'inop' };

  public raw: string;
  protected color: string;
  public length: number;
  public anchorPos: number;
  protected size: string | null;

  /**
   * @param index - valid range from 0 to 23
   * @param text - text to be displayed
   * @param att - attributes of the text, e.g. text size, color and/or alignment
   */
  constructor(
    protected index: number,
    text: string,
    ...att: Attribute[]
  ) {
    this.index = index;
    this.raw = text;
    const colorAttr = att.find((e) => 'color' in e);
    this.color = colorAttr?.color ?? Column.white.color;
    this.length = text.length;
    this.anchorPos = att.find((e) => 'alignRight' in e) ? index - this.length + 1 : index;
    const sizeAttr = att.find((e) => 'size' in e);
    this.size = sizeAttr ? sizeAttr.size : null;
  }

  /**
   * Returns a styled/formatted string.
   */
  get text(): string {
    return `${this.size !== null ? '{' + this.size + '}' : ''}{${this.color}}${this.raw}{end}${this.size !== null ? '{end}' : ''}`;
  }

  /**
   * @param text - text to be displayed
   */
  set text(text: string) {
    this.raw = text;
    this.length = text.length;

    // if text is right aligned => update anchor position
    if (this.index !== this.anchorPos) {
      this.anchorPos = this.index - this.length + 1;
    }
  }

  /**
   * @param att - attributes of the text, e.g. text size and/or color
   */
  updateAttributes(...att: { color?: string; size?: string }[]) {
    const colorAttr = att.find((e) => e.color) as { color: string } | undefined;
    this.color = colorAttr?.color ?? this.color;
    const sizeAttr = att.find((e) => e.size);
    this.size = sizeAttr?.size ?? this.size;
  }

  /**
   * @param text - text to be displayed
   * @param att - attributes of the text, e.g. text size and/or color
   */
  update(text: string, ...att: { color?: string; size?: string }[]) {
    this.text = text;
    this.updateAttributes(...att);
  }
}

/**
 * Returns a formatted mcdu page template
 * @param lines - mcdu lines
 * @returns mcdu template
 */
export const FormatTemplate = (lines: Column[][]): string[][] => lines.map((line) => FormatLine(...line));

/**
 * Returns a formatted mcdu line
 * @param {...Column} columns
 * @returns {string[]}
 */
export function FormatLine(...columns: Column[]): string[] {
  columns.sort((a, b) => a.anchorPos - b.anchorPos);

  let line = ''.padStart(24);
  let pos = -1; // refers to an imaginary index on the 24 char limited mcdu line
  let index = 0; // points at the "cursor" of the actual line

  for (const column of columns) {
    /* --------> populating text from left to right --------> */
    const newStart = column.anchorPos;
    const newEnd = newStart + column.length;

    // prevent adding empty or invalid stuff
    if (column.length === 0 || newEnd < 0 || newStart > 23 || newEnd <= pos) {
      continue;
    }

    if (pos === -1) {
      pos = 0;
    }

    // removes text overlap
    column.raw = column.raw.slice(
      Math.max(0, pos - newStart),
      Math.min(column.length, Math.max(1, column.length + 24 - newEnd)),
    );

    const limMin = Math.max(0, newStart - pos);
    const limMax = Math.min(24, newEnd - pos);

    line = line.slice(0, index + limMin) + column.text + line.slice(index + limMax);
    index += limMin + column.text.length;
    pos = newEnd;
  }

  // '{small}{end}{big}{end}' fixes the lines "jumping" (line moves up or down a few pixels) when entering small and large content into the same line.
  return [line.replace(/\s/g, '{sp}') + '{small}{end}{big}{end}'];
}
