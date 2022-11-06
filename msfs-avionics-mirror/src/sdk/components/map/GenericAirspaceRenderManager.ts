import { GeoProjection } from '../../geo/GeoProjection';
import { PathStream } from '../../graphics/path/PathStream';
import { LodBoundary } from '../../navigation/LodBoundary';
import { ArrayTaskQueue } from '../../utils/task/TaskQueue';
import { ThrottledTaskQueueHandler, ThrottledTaskQueueProcess } from '../../utils/task/ThrottledTaskQueueProcess';
import { MapAirspaceRenderer } from './MapAirspaceRenderer';
import { MapAirspaceRenderManager } from './MapAirspaceRenderManager';

/**
 * An generic implementation of {@link MapAirspaceRenderManager}.
 */
export class GenericAirspaceRenderManager implements MapAirspaceRenderManager {
  private readonly airspaces = new Map<number, LodBoundary>();

  /**
   * Constructor.
   * @param renderOrder A function which determines the order in which this manager renders airspaces. The function
   * should return a negative number when airspace `a` should be rendered before (below) airspace `b`, a positive
   * number when airspace `a` should be rendered after (above) airspace `b`, and `0` when the relative render order
   * of the two airspaces does not matter.
   * @param selectRenderer A function which selects airspace renderers for individual airspaces.
   */
  constructor(
    private readonly renderOrder: (a: LodBoundary, b: LodBoundary) => number,
    private readonly selectRenderer: (airspace: LodBoundary) => MapAirspaceRenderer
  ) {
  }

  /** @inheritdoc */
  public getRegisteredAirspaces(): readonly LodBoundary[] {
    return Array.from(this.airspaces.values());
  }

  /** @inheritdoc */
  public registerAirspace(airspace: LodBoundary): boolean {
    if (this.airspaces.has(airspace.facility.id)) {
      return false;
    }

    this.airspaces.set(airspace.facility.id, airspace);

    return true;
  }

  /** @inheritdoc */
  public deregisterAirspace(airspace: LodBoundary): boolean {
    return this.airspaces.delete(airspace.facility.id);
  }

  /** @inheritdoc */
  public replaceRegisteredAirspaces(airspaces: Iterable<LodBoundary>): boolean {
    let changed = false;
    let numMatched = 0;
    for (const airspace of airspaces) {
      changed ||= !this.airspaces.has(airspace.facility.id);
      if (changed) {
        break;
      } else {
        numMatched++;
      }
    }
    changed ||= numMatched !== this.airspaces.size;

    if (!changed) {
      return false;
    }

    this.airspaces.clear();
    for (const airspace of airspaces) {
      this.registerAirspace(airspace);
    }

    return true;
  }

  /** @inheritdoc */
  public clearRegisteredAirspaces(): boolean {
    if (this.airspaces.size === 0) {
      return false;
    }

    this.airspaces.clear();
    return true;
  }

  /** @inheritdoc */
  public prepareRenderProcess(
    projection: GeoProjection,
    context: CanvasRenderingContext2D,
    taskQueueHandler: ThrottledTaskQueueHandler,
    lod = 0,
    stream?: PathStream
  ): ThrottledTaskQueueProcess {
    const sorted = Array.from(this.airspaces.values()).sort(this.renderOrder);

    const tasks = sorted.map(airspace => {
      const renderer = this.selectRenderer(airspace);
      // The explicit cast is to avoid a bogus typescript error
      return (renderer.render as any).bind(renderer, airspace, projection, context, lod, stream);
    });

    return new ThrottledTaskQueueProcess(new ArrayTaskQueue(tasks), taskQueueHandler);
  }
}