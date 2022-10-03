import { XMLGaugeProps, XMLGaugeStyle } from './BaseGauge';

/** Props for a horizontal gauge */
export interface XMLVerticalGaugeProps extends XMLGaugeProps {
  /** A style */
  style: Partial<XMLVerticalGaugeStyle>,
}

/** A circular gauge style definition */
export interface XMLVerticalGaugeStyle extends XMLGaugeStyle {
  /** TODO Gradation labels on the arc? */
  textIncrement: number,
  /** Where to put the value. */
  valuePos: XMLVerticalGaugeValuePos,
  /** The color of the cursor. */
  cursorColor: string,
}

/**
 * This provides the valid values for the ValuePos tag on a vertical gauge.
 */
export enum XMLVerticalGaugeValuePos {
  /** Starting the enum at 1 to match its value in the stock XMLEngineDisplay.js */
  None = 1
}