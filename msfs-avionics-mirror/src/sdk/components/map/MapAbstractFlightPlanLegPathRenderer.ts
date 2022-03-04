import { GeoCircle, GeoPoint, GeoProjection, PathStream } from '../..';
import { FlightPathUtils, FlightPathVector, LegDefinition } from '../../flightplan';

/**
 * Renders flight plan leg paths one vector at a time, optionally excluding the ingress and/or egress transition
 * vectors.
 */
export abstract class MapAbstractFlightPlanLegPathRenderer<Args extends any[] = []> {
  protected static readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0)];
  protected static readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  protected readonly tempVector = FlightPathUtils.createEmptyCircleVector();

  /**
   * Renders a flight plan leg path to a canvas.
   * @param leg The flight plan leg to render.
   * @param projection The projection to use for rendering.
   * @param context The canvas 2D rendering context to which to render.
   * @param stream The path stream to which to render.
   * @param excludeIngress Whether to exclude the ingress transition vectors.
   * @param excludeEgress Whether to exclude the egress transition vectors.
   * @param args Additional arguments.
   */
  public render(
    leg: LegDefinition,
    projection: GeoProjection,
    context: CanvasRenderingContext2D,
    stream: PathStream,
    excludeIngress: boolean,
    excludeEgress: boolean,
    ...args: Args
  ): void {
    const legCalc = leg.calculated;

    if (!legCalc) {
      return;
    }

    let mainVectors = legCalc.ingressToEgress;
    let mainVectorStartIndex = 0;
    let mainVectorEndIndex = legCalc.ingressToEgress.length;

    if (excludeIngress || excludeEgress) {
      mainVectors = legCalc.flightPath;
      mainVectorEndIndex = excludeEgress || legCalc.egressJoinIndex < 0 || legCalc.egress.length === 0 ? legCalc.flightPath.length : legCalc.egressJoinIndex;
    }

    if (!excludeIngress) {
      for (let i = 0; i < legCalc.ingress.length; i++) {
        this.renderVector(legCalc.ingress[i], true, false, leg, projection, context, stream, ...args);
      }

      if (excludeEgress) {
        mainVectorStartIndex = legCalc.ingressJoinIndex;

        const lastIngressVector = legCalc.ingress[legCalc.ingress.length - 1];
        const ingressJoinVector = legCalc.flightPath[legCalc.ingressJoinIndex];

        if (lastIngressVector && ingressJoinVector) {
          const ingressEnd = MapAbstractFlightPlanLegPathRenderer.geoPointCache[0].set(lastIngressVector.endLat, lastIngressVector.endLon);
          const vectorEnd = MapAbstractFlightPlanLegPathRenderer.geoPointCache[1].set(ingressJoinVector.endLat, ingressJoinVector.endLon);

          if (!ingressEnd.equals(vectorEnd)) {
            const ingressJoinVectorCircle = FlightPathUtils.setGeoCircleFromVector(ingressJoinVector, MapAbstractFlightPlanLegPathRenderer.geoCircleCache[0]);
            FlightPathUtils.setCircleVector(this.tempVector, ingressJoinVectorCircle, ingressEnd, vectorEnd, ingressJoinVector.flags);
            this.renderVector(this.tempVector, false, false, leg, projection, context, stream, ...args);
          }

          mainVectorStartIndex++;
        }
      }
    }

    for (let i = mainVectorStartIndex; i < mainVectorEndIndex; i++) {
      this.renderVector(mainVectors[i], false, false, leg, projection, context, stream, ...args);
    }

    if (!excludeEgress) {
      if (excludeIngress) {
        const firstEgressVector = legCalc.egress[0];
        const egressJoinVector = legCalc.flightPath[legCalc.egressJoinIndex];

        if (firstEgressVector && egressJoinVector) {
          const egressStart = MapAbstractFlightPlanLegPathRenderer.geoPointCache[0].set(firstEgressVector.startLat, firstEgressVector.startLon);
          const egressJoinVectorStart = MapAbstractFlightPlanLegPathRenderer.geoPointCache[1].set(egressJoinVector.startLat, egressJoinVector.startLon);
          if (!egressStart.equals(egressJoinVectorStart)) {
            const egressJoinVectorCircle = FlightPathUtils.setGeoCircleFromVector(egressJoinVector, MapAbstractFlightPlanLegPathRenderer.geoCircleCache[0]);
            FlightPathUtils.setCircleVector(this.tempVector, egressJoinVectorCircle, egressJoinVectorStart, egressStart, egressJoinVector.flags);
            this.renderVector(this.tempVector, false, false, leg, projection, context, stream, ...args);
          }
        }
      }

      for (let i = 0; i < legCalc.egress.length; i++) {
        this.renderVector(legCalc.egress[i], false, true, leg, projection, context, stream, ...args);
      }
    }
  }

  /**
   * Renders a flight path vector.
   * @param vector The flight path vector to render.
   * @param isIngress Whether the vector is part of the ingress transition.
   * @param isEgress Whether the vector is part of the egress transition.
   * @param leg The flight plan leg containing the vector to render.
   * @param projection The map projection to use when rendering.
   * @param context The canvas 2D rendering context to which to render.
   * @param stream The path stream to which to render.
   */
  protected abstract renderVector(
    vector: FlightPathVector,
    isIngress: boolean,
    isEgress: boolean,
    leg: LegDefinition,
    projection: GeoProjection,
    context: CanvasRenderingContext2D,
    stream: PathStream,
    ...args: Args
  ): void;
}