import { FlightPlan, LegDefinition } from '../../flightplan';
import { GeoProjectionPathStreamStack } from './GeoProjectionPathStreamStack';

/**
 * Rendering order of flight plan legs.
 */
export type FlightPathPlanRenderOrder = 'forward' | 'reverse';

/**
 * Renders flight plan paths one leg at a time in either forward or reverse order. Optionally forces the rendering of
 * the active flight plan leg to be last.
 */
export abstract class AbstractFlightPathPlanRenderer<Args extends any[] = []> {
  /**
   * Constructor.
   * @param renderOrder The order which this renderer renders the flight plan legs. Forward order renders the legs in
   * a first-to-last fashion. Reverse order renders the legs in a last-to-first fashion. Defaults to forward.
   * @param renderActiveLegLast Whether to render the active leg last. Defaults to true.
   */
  constructor(protected readonly renderOrder: FlightPathPlanRenderOrder = 'forward', protected readonly renderActiveLegLast = true) {
  }

  /**
   * Renders a flight plan path to a canvas.
   * @param plan The flight plan to render.
   * @param startIndex The global index of the first flight plan leg to render, inclusive. Defaults to `0`.
   * @param endIndex The global index of the last flight plan leg to render, inclusive. Defaults to `plan.length - 1`.
   * @param context The canvas 2D rendering context to which to render.
   * @param streamStack The path stream stack to which to render.
   * @param args Additional arguments.
   */
  public render(
    plan: FlightPlan,
    startIndex: number | undefined,
    endIndex: number | undefined,
    context: CanvasRenderingContext2D,
    streamStack: GeoProjectionPathStreamStack,
    ...args: Args
  ): void {
    startIndex ??= 0;
    endIndex ??= plan.length - 1;

    const activeLegIndex = plan.activeLateralLeg < plan.length ? plan.activeLateralLeg : -1;
    const activeLeg = plan.activeLateralLeg < plan.length ? plan.getLeg(plan.activeLateralLeg) : undefined;

    const isReverse = this.renderOrder === 'reverse';

    if (isReverse) {
      const oldEndIndex = endIndex;
      endIndex = startIndex;
      startIndex = oldEndIndex;
    }

    let index = startIndex;
    const delta = isReverse ? -1 : 1;
    for (const leg of plan.legs(isReverse, startIndex)) {
      if ((index - endIndex) * delta > 0) {
        break;
      }

      if (this.renderActiveLegLast && index === activeLegIndex) {
        index += delta;
        continue;
      }

      this.renderLeg(leg, plan, activeLeg, index, activeLegIndex, context, streamStack, ...args);

      index += delta;
    }

    if (this.renderActiveLegLast && activeLeg) {
      this.renderLeg(activeLeg, plan, activeLeg, activeLegIndex, activeLegIndex, context, streamStack, ...args);
    }
  }

  /**
   * Renders a flight plan leg.
   * @param leg The flight plan leg to render.
   * @param plan The flight plan containing the leg to render.
   * @param activeLeg The active leg in the flight plan.
   * @param legIndex The global index of the leg in its flight plan.
   * @param activeLegIndex The global index of the active flight plan leg.
   * @param projection The map projection to use when rendering.
   * @param context The canvas 2D rendering context to which to render.
   * @param streamStack The path stream stack to which to render.
   */
  protected abstract renderLeg(
    leg: LegDefinition,
    plan: FlightPlan,
    activeLeg: LegDefinition | undefined,
    legIndex: number,
    activeLegIndex: number,
    context: CanvasRenderingContext2D,
    streamStack: GeoProjectionPathStreamStack,
    ...args: Args
  ): void;
}