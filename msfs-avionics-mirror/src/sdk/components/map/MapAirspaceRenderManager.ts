import { GeoProjection } from '../../geo';
import { PathStream } from '../../graphics/path';
import { LodBoundary } from '../../navigation';
import { ThrottledTaskQueueHandler, ThrottledTaskQueueProcess } from '../../utils/task';

/**
 * A manager which facilitates the rendering of multiple airspaces.
 */
export interface MapAirspaceRenderManager {
  /**
   * Gets all airspaces registered to this render manager.
   * @returns All airspaces registered to this render manager.
   */
  getRegisteredAirspaces(): readonly LodBoundary[];

  /**
   * Registers an airspace with this render manager. An airspace may only be registered once.
   * @param airspace The airspace to register.
   * @returns Whether the airspace was successfully registered.
   */
  registerAirspace(airspace: LodBoundary): boolean;

  /**
   * Deregisters an airspace with this render manager.
   * @param airspace The airspace to deregister.
   * @returns Whether the airspace was successfully deregistered.
   */
  deregisterAirspace(airspace: LodBoundary): boolean;

  /**
   * Replace all airspaces currently registered with this render manager with a new list of airspaces.
   * @param airspaces The new list of airspaces.
   * @returns Whether the replace operation changed the set of registered airspaces.
   */
  replaceRegisteredAirspaces(airspaces: LodBoundary[]): boolean;

  /**
   * Deregisters all airspaces currently registered with this render manager.
   * @returns Whether any airspaces were deregistered.
   */
  clearRegisteredAirspaces(): boolean;

  /**
   * Generates a throttled task queue process, which when started will render all the airspaces registered with this
   * manager.
   * @param projection The projection to use when rendering.
   * @param context The canvas rendering context to which to render.
   * @param taskQueueHandler The handler to assign to the task queue process.
   * @param lod The LOD to render. Defaults to 0.
   * @param stream The path stream to which to render. If undefined, the path will be rendered directly to the canvas
   * rendering context.
   * @returns A throttled task queue process.
   */
  prepareRenderProcess(
    projection: GeoProjection,
    context: CanvasRenderingContext2D,
    taskQueueHandler: ThrottledTaskQueueHandler,
    lod?: number,
    stream?: PathStream
  ): ThrottledTaskQueueProcess;
}