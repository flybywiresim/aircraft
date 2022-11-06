import type { NodeReference, VNode } from '../FSComponent';
import type { MapLayer, MapLayerProps } from '../map/MapLayer';
import type { MapSystemComponent, MapSystemComponentProps } from './MapSystemComponent';
import type { MapSystemContext, MutableMapContext } from './MapSystemContext';
import type { MapSystemController } from './MapSystemController';

/**
 * A record of `string`-keyed map model modules.
 */
export type ModuleRecord = Record<string, any>;

/**
 * A record of `string`-keyed map layers.
 */
export type LayerRecord = Record<string, any>;

/**
 * A record of `string`-keyed map controllers.
 */
export type ControllerRecord = Record<string, any>;

/**
 * A record of context properties.
 */
export type ContextRecord = Record<string, any>;

/**
 * An empty record.
 */
export type EmptyRecord = Record<never, never>;

/**
 * Adds all modules from a new module record to an existing record. Modules from the new record will overwrite the ones
 * in the existing record if there are key collisions.
 */
export type ModuleUnion<Modules extends ModuleRecord, New extends ModuleRecord> = Omit<Modules, keyof New> & New;

/**
 * Adds all modules from a new layer record to an existing record. Layers from the new record will overwrite the ones
 * in the existing record if there are key collisions.
 */
export type LayerUnion<Layers extends LayerRecord, New extends LayerRecord> = Omit<Layers, keyof New> & New;

/**
 * Adds all controllers from a new layer record to an existing record. Controllers from the new record will overwrite
 * the ones in the existing record if there are key collisions.
 */
export type ControllerUnion<Controllers extends ControllerRecord, New extends ControllerRecord>
  = Omit<Controllers, keyof New> & New;

/**
 * Adds all properties from a new context record to an existing record. Properties with keys found in the base
 * {@link MapSystemContext} will be ignored. properties from the new record will overwrite the ones in the existing
 * record if there are key collisions.
 */
export type ContextUnion<Context, New extends ContextRecord>
  = Omit<Context, keyof Omit<New, keyof MutableMapContext<MapSystemContext>>> & Omit<New, keyof MutableMapContext<MapSystemContext>>;

/**
 * Retrieves a map layer's required modules.
 */
export type RequiredLayerModules<Layer> = Layer extends MapLayer<infer P> ? P extends MapLayerProps<infer M> ? M : never : never;

/**
 * Retrieves a map controller's required modules.
 */
export type RequiredControllerModules<Controller> = Controller extends MapSystemController<infer M, any, any, any> ? M : never;

/**
 * Retrieves a map controller's required layers.
 */
export type RequiredControllerLayers<Controller> = Controller extends MapSystemController<any, infer L, any, any> ? L : never;

/**
 * Retrieves a map controller's required context.
 */
export type RequiredControllerContext<Controller> = Controller extends MapSystemController<any, any, any, infer Context> ? Context : never;

/**
 * A compiled map from {@link MapSystemBuilder}.
 */
export type CompiledMapSystem<
  Modules extends ModuleRecord,
  Layers extends LayerRecord,
  Controllers extends ControllerRecord,
  Context extends ContextRecord
  > = {
    /** The compiled map context. */
    context: MapSystemContext<Modules, Layers, Controllers, Context>;

    /** The compiled map, rendered as a VNode. */
    map: VNode;

    /** A reference to the compiled map. */
    ref: NodeReference<MapSystemComponent<MapSystemComponentProps<Modules>>>;
  };