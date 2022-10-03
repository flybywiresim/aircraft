import { CompositeLogicXMLHost } from '../../../data/';
import { ComponentProps } from '../../FSComponent';

//
// Basic interface and type definitions for any XML gauge.
//

/** Base props for an XML gauge. */
export interface XMLGaugeProps extends ComponentProps {
  /** The style definiton. */
  style: Partial<XMLGaugeStyle>,
  /** The minimum value. */
  minimum: CompositeLogicXMLElement,
  /** The maximum value. */
  maximum: CompositeLogicXMLElement,
  /** A list of color zones. */
  colorZones: Array<XMLGaugeColorZone>,
  /** A list of colir lines. */
  colorLines: Array<XMLGaugeColorLine>,
  /** The first possible value. */
  value1: CompositeLogicXMLElement,
  /** The second possible value for dual elements. */
  value2: CompositeLogicXMLElement,
  /** The title of the gauge. */
  title: string,
  /** The units measured by the gauge. */
  unit: string,
  /** The length of individual graduations. */
  graduationLength: number,
  /** Do the graduations have text? */
  graduationHasText: boolean,
  /** Text at the beginning of the gauge. */
  beginText: string,
  /** Text at the end of the gauge. */
  endText: string,
  /** The label of the first cursor. */
  cursorText1: string,
  /** The labe of the second cursor, for  */
  cursorText2: string,
  /** The class ID of the gauge. */
  id: string,
  /**Any triggers for blinking the element red. */
  // TODO We added yellow blink in our extended gauges, maybe do that too at some point.
  redBlink: CompositeLogicXMLElement
  /** A reference bug definition, if present. */
  referenceBugs: Array<XMLGaugeReferenceBug>
}

/**
 * I don't want to make the logic host a defined part of the base gauge
 * interface, because I feel like that breaks abstraction boundaries and
 * ties this code too much to our specific implementation.   But I don't()
 * want people to have to subclass their own type of every gauge type in
 * order to pass the logic host in as a prop, so I'll make an additonal
 * interface for that which can be mixed in by people who want to use it.
 */
export interface XMLHostedLogicGauge {
  /** The logic host. */
  logicHost: CompositeLogicXMLHost
}

/** An XML gauge style definition. */
export interface XMLGaugeStyle {
  /** TODO The scaling ratio on the gauge? */
  sizePercent: number,
  /** Left margin. */
  marginLeft: number,
  /** Right margin. */
  marginRight: number,
  /** Top margin. */
  marginTop: number,
  /** Bottom margin. */
  marginBottom: number
}

/** A color zone definition. */
export interface XMLGaugeColorZone {
  /** The name of the color to use. */
  color: string,
  /** The beginning value of the zone. */
  begin: CompositeLogicXMLElement,
  /** The ending value of the zone. */
  end: CompositeLogicXMLElement,
  /** An optional linear smoothing factor for value updates. */
  smoothFactor?: number
}

/** A color line definition. */
export interface XMLGaugeColorLine {
  /** The name of the color to use. */
  color: string,
  /** The value position of the color line. */
  position: CompositeLogicXMLElement,
  /** An optional linear smoothing factor for value updates. */
  smoothFactor?: number
}

/** Style for a reference bug. */
export interface XMLGaugeReferenceBugStyle extends XMLGaugeStyle {
  /** The color of the bug. */
  color: string,
}

/** A reference bug definition. */
export interface XMLGaugeReferenceBug {
  /** The positioning logic. */
  position: CompositeLogicXMLElement,
  /** Logic to toggle display on and off. */
  displayLogic: CompositeLogicXMLElement,
  /** An optional style to use. */
  style?: Partial<XMLGaugeReferenceBugStyle>,
  /** An optional linear smoothing factor for value updates. */
  smoothFactor?: number
}