import { CircleVector, LegDefinition } from '../../flightplan';
import { AbstractFlightPathLegRenderer } from './AbstractFlightPathLegRenderer';
import { GeoProjectionPathStreamStack } from './GeoProjectionPathStreamStack';

/**
 * Renders flight plan leg paths one vector at a time, optionally excluding the ingress and/or egress transition
 * vectors. The rendering behavior for each vector is controlled by a function passed to the class constructor.
 */
export class CustomFlightPathLegRenderer<Args extends any[]> extends AbstractFlightPathLegRenderer<Args> {
  /**
   * Constructor.
   * @param renderVector A function which renders individual flight path vectors.
   */
  constructor(
    protected readonly renderVector: (
      vector: CircleVector,
      isIngress: boolean,
      isEgress: boolean,
      leg: LegDefinition,
      context: CanvasRenderingContext2D,
      streamStack: GeoProjectionPathStreamStack,
      ...args: Args
    ) => void
  ) {
    super();
  }
}