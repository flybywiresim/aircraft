import { XMLGaugeProps, XMLGaugeStyle } from './BaseGauge';

/** Props for a horizontal gauge */
export interface XMLDoubleVerticalGaugeProps extends XMLGaugeProps {
  /** A style */
  style: Partial<XMLDoubleVerticalGaugeStyle>,
}

/** A circular gauge style definition */
export interface XMLDoubleVerticalGaugeStyle extends XMLGaugeStyle {
  /** TODO Gradation labels on the arc? */
  textIncrement: number,
  /** TODO Height of the gauge in what? */
  height: number
}