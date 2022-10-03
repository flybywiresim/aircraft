import { EventBus } from '../../../data';
import { XMLGaugeProps, XMLGaugeStyle } from './BaseGauge';

/** Props for a cylinder gauge */
export interface XMLCylinderGaugeProps extends XMLGaugeProps {
  /** An event bus for leaning events. */
  bus: EventBus,
  /** The number of columns in the gauge. */
  numColumns: CompositeLogicXMLElement,
  /** The number of boxes each column should have. */
  numRows: CompositeLogicXMLElement,
  /** What's the order of the hottest cylinders? */
  tempOrder?: Array<number>,
  /** The gauge styling. */
  style: Partial<XMLCylinderGaugeStyle>
}

/** A cylinder gauge style definition. */
export interface XMLCylinderGaugeStyle extends XMLGaugeStyle {
  /** Increment used for text value display. */
  textIncrement: number
  /** Should there be a redline present? */
  redline?: boolean,
  /** Should we show peak temperatures when leaning? */
  peakTemps?: boolean,
}