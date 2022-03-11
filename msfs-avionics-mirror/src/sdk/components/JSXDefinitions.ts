/* eslint-disable @typescript-eslint/no-namespace */
import { NodeReference } from './FSComponent';

/**
 * The JSX definitions for transpilation.
 */
export namespace JSXDefinitions {

  /**
   * The intrinsic DOM elements that can be defined.
   */
  export interface IntrinsicElements {
    [elemName: string]: any;

    /** A reference to the HTML element node. */
    ref?: NodeReference<any>;
  }
}
