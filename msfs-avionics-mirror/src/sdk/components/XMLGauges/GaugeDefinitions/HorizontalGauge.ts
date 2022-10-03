import { XMLGaugeProps, XMLGaugeStyle } from './BaseGauge';

/** Props for a horizontal gauge */
export interface XMLHorizontalGaugeProps extends XMLGaugeProps {
  /** A style */
  style: Partial<XMLHorizontalGaugeStyle>,
}

/** A circular gauge style definition */
export interface XMLHorizontalGaugeStyle extends XMLGaugeStyle {
  /** TODO Gradation labels on the arc? */
  textIncrement: number,
  /** Where to put the value. */
  valuePos: XMLHorizontalGaugeValuePos,
  /** What kind of pointer to use. */
  pointerStyle: 'standard' | 'arrow',
  /** The color of the cursor. */
  cursorColor: string,
  /** TODO Width in pixels? as a float. */
  width: number,
  /** TODO dunno what this does yet */
  reverseY: boolean
  /** The precision of the value as an int. */
  valuePrecision: number
}

/**
 * This provides the valid values for the ValuePos tag on a horizontal gauge.
 */
export enum XMLHorizontalGaugeValuePos {
  /** Starting the enum at 1 to match its value in the stock XMLEngineDisplay.js */
  End = 1,
  Right
}