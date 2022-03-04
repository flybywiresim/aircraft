import { XMLGaugeProps, XMLGaugeStyle } from './BaseGauge';

/** Props for a horizontal gauge */
export interface XMLDoubleHorizontalGaugeProps extends XMLGaugeProps {
  /** A style */
  style: Partial<XMLDoubleHorizontalGaugeStyle>,
}

/** A circular gauge style definition */
export interface XMLDoubleHorizontalGaugeStyle extends XMLGaugeStyle {
  /** TODO Gradation labels on the arc? */
  textIncrement: number,
  /** The value precision. */
  valuePrecision: number,
  /** Where to put the value. */
  valuePos: XMLDoubleHorizontalGaugeValuePos,
  /** What kind of pointer to use. */
  pointerStyle: 'standard' | 'arrow'
}

/**
 * The possible locations for value text.
 * This is treated as though it may have multiple options in the original
 * source.  For the sake of future expansion we'll make this an enum even
 * though it currently only has one option.  Maybe it can be used for future
 * expansion.
 */
export enum XMLDoubleHorizontalGaugeValuePos {
  /** Starting the enum at 2 to match its value in the stock XMLEngineDisplay.js */
  Right = 2
}