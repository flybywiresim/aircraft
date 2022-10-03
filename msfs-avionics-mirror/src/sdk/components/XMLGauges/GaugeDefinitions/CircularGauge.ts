import { XMLGaugeProps, XMLGaugeStyle } from './BaseGauge';

/** Props for a circular gauge */
export interface XMLCircularGaugeProps extends XMLGaugeProps {
  /** A style */
  style: Partial<XMLCircularGaugeStyle>,
}

/** A circular gauge style definition */
export interface XMLCircularGaugeStyle extends XMLGaugeStyle {
  /** TODO What text color to force? */
  forceTextColor: string,
  /** TODO Gradation labels on the arc? */
  textIncrement: number,
  /** The arc position to begin on. */
  beginAngle: number,
  /** The arc position to end on. */
  endAngle: number,
  /** The style of cursor to use. */
  cursorType: XMLCircularGaugeCursor,
  /** Where to put the value. */
  valuePos: XMLCircularGaugeValuePos,
  /** The precision to use in text display. */
  valuePrecision: number
}

/**
 * The style of cursor to use on a circular gauge.
 * This is treated as though it may have multiple options in the original
 * source.  For the sake of future expansion we'll make this an enum even
 * though it currently only has one option.  Maybe it can be used for future
 * expansion.
 */
export enum XMLCircularGaugeCursor {
  /** Starting the enum at 1 to match its value in the stock XMLEngineDisplay.js */
  Triangle = 1
}

/**
 * The possible locations for value text.
 * This is treated as though it may have multiple options in the original
 * source.  For the sake of future expansion we'll make this an enum even
 * though it currently only has one option.  Maybe it can be used for future
 * expansion.
 */
export enum XMLCircularGaugeValuePos {
  /** Starting the enum at 1 to match its value in the stock XMLEngineDisplay.js */
  End = 1
}