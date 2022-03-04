import { EventBus } from '../../../data';
import { XMLGaugeSpec } from '../XMLGaugeAdapter';

/** Properties of a column group. */
export interface GaugeColumnGroupProps {
  /** The HTML class name to use for the column group. */
  id?: string,
  /** An event bus for our contained gauges that need it. */
  bus: EventBus;
  /** The columns in the group. */
  columns: Array<GaugeColumnProps>
}

/** Properties of a gauge column. */
export interface GaugeColumnProps {
  /** The HTML class name to use for the column. */
  id?: string,
  /** The width of the column, in percent of the parent. */
  width?: number
  /** The gauges in the group. */
  gauges: Array<XMLGaugeSpec>
}