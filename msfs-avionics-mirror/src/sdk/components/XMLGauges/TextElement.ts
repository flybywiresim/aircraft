/// <reference types="msfstypes/Pages/VCockpit/Instruments/Shared/utils/XMLLogic" />

import { ComponentProps } from '../FSComponent';
import { XMLGaugeStyle } from './';

/** Props for an XML text element. */
export interface XMLTextElementProps extends ComponentProps {
  /** The HTML class of the element. */
  class?: string,
  /** The left side text. */
  left?: XMLTextColumnProps,
  /** The central text. */
  center?: XMLTextColumnProps,
  /** The right side text. */
  right?: XMLTextColumnProps
  /** Style information. */
  style?: Partial<XMLGaugeStyle>
}

/** The configuration of an individual column of text. */
export interface XMLTextColumnProps {
  /** The HTML class of the element. */
  class?: string,
  /** The text content of the column. */
  content: CompositeLogicXMLElement,
  /** The color of the text. */
  color?: CompositeLogicXMLElement,
  /** The font size to use. */
  fontSize?: string
}