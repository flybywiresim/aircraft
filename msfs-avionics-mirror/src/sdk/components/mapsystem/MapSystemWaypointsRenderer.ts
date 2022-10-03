import { Vec2Math } from '../../math/VecMath';
import { FacilityWaypoint, ICAO, Waypoint } from '../../navigation';
import { SubEvent } from '../../sub/SubEvent';
import {
  MapCullableLocationTextLabel, MapCullableTextLabel, MapCullableTextLabelManager, MapWaypointIcon, MapWaypointImageIcon, MapWaypointRenderer,
  MapWaypointRendererEntry, MapWaypointRendererIconFactory, MapWaypointRendererLabelFactory, MapWaypointRenderRoleDef
} from '../map';

/**
 * A waypoint renderer for the MapSystem API. Supports addition of string-keyed render roles. Each render role is
 * assigned a position in an ordered list that determines the priority of being chosen when roles are selected for
 * rendering waypoints. For each waypoint, the renderer iterates through all render roles in the priority order list
 * and selects the first role under which the waypoint is registered and is visible.
 */
export class MapSystemWaypointsRenderer extends MapWaypointRenderer<Waypoint> {
  /** The default render role group. */
  public static readonly DefaultGroup = 'DEFAULT_GROUP';

  protected readonly rolePriorityOrder: number[] = [];

  protected readonly rolesByGroup = new Map<string, string[]>();

  protected readonly roleIdMap = new Map<string, number>();
  protected currentBit = 1;

  /** An event that fires when any roles are added. */
  public readonly onRolesAdded = new SubEvent<this, void>();

  /**
   * Constructor.
   * @param textManager The text manager to use for waypoint labels.
   */
  constructor(
    textManager: MapCullableTextLabelManager
  ) {
    super(textManager, (entry: MapWaypointRendererEntry<Waypoint>, roleDefinitions: ReadonlyMap<number, Readonly<MapWaypointRenderRoleDef<Waypoint>>>): number => {
      for (let i = 0; i < this.rolePriorityOrder.length; i++) {
        const role = this.rolePriorityOrder[i];
        if (entry.isAllRoles(role) && roleDefinitions.get(role)?.visibilityHandler(entry.waypoint)) {
          return role;
        }
      }

      return 0;
    });
  }

  /**
   * This method is disabled. Please use the `addRenderRole(name: string, def: MapWaypointRenderRoleDef<Waypoint>, group?: string)`
   * overload to add render roles to this renderer.
   * @param role The render role to add.
   * @param def The render role's definition.
   * @returns `false`.
   */
  public addRenderRole(role: number, def?: MapWaypointRenderRoleDef<Waypoint>): false;
  /**
   * Adds a new named render role to this renderer. The new render role will be placed at the end of this renderer's
   * render role selection priority order. Roles positioned earlier in the order have a higher priority for being
   * chosen when roles are selected for rendering waypoints.
   * @param name The name of the render role to add.
   * @param def The render role's definition. If undefined, the new role will be assigned a default definition with
   * no defined rendering context, icon, or label factories, and a visibility handler which always returns true.
   * @param group The group in which to include the new render role, if any. Defaults to
   * {@link MapSystemWaypointsRenderer.DefaultGroup}.
   * @returns Whether the role was successfully added.
   */
  public addRenderRole(name: string, def?: MapWaypointRenderRoleDef<Waypoint>, group?: string): boolean
  // eslint-disable-next-line jsdoc/require-jsdoc
  public addRenderRole(arg1: number | string, def?: MapWaypointRenderRoleDef<Waypoint>, group = MapSystemWaypointsRenderer.DefaultGroup): boolean {
    if (typeof arg1 === 'number') {
      return false;
    }

    this.roleIdMap.set(arg1, this.currentBit);
    super.addRenderRole(this.currentBit, def);

    this.rolePriorityOrder.push(this.currentBit);
    let roleGroup = this.rolesByGroup.get(group);
    if (roleGroup === undefined) {
      roleGroup = [];
      this.rolesByGroup.set(group, roleGroup);
    }

    roleGroup.push(arg1);
    this.currentBit *= 2;
    this.onRolesAdded.notify(this);

    return true;
  }

  /**
   * Adds a new named render role to this renderer and inserts it before an existing render role in this renderer's
   * render role selection priority order. Roles positioned earlier in the order have a higher priority for being
   * chosen when roles are selected for rendering waypoints.
   * @param name The name of the render role to add.
   * @param insertBefore The name of the role before which to insert the new role in this renderer's render role
   * selection priority order. If the name does not match any of this renderer's existing render roles, the new role
   * will be placed at the end of the priority order.
   * @param def The render role's definition. If undefined, the new role will be assigned a default definition with
   * no defined rendering context, icon, or label factories, and a visibility handler which always returns true.
   * @param group The group in which to include the new render role, if any. Defaults to
   * {@link MapSystemWaypointsRenderer.DefaultGroup}.
   * @returns Whether the role was successfully inserted.
   */
  public insertRenderRole(name: string, insertBefore: string, def?: MapWaypointRenderRoleDef<Waypoint>, group = MapSystemWaypointsRenderer.DefaultGroup): boolean {
    const role = this.currentBit;
    this.addRenderRole(name, def, group);

    const roleToInsertBefore = this.roleIdMap.get(insertBefore);
    if (roleToInsertBefore !== undefined) {
      const indexToInsertBefore = this.rolePriorityOrder.indexOf(roleToInsertBefore);
      if (indexToInsertBefore >= 0 && indexToInsertBefore < this.rolePriorityOrder.length - 1) {
        this.rolePriorityOrder.pop();
        this.rolePriorityOrder.splice(indexToInsertBefore, 0, role);
      }
    }

    return true;
  }

  /**
   * Gets a render role associated with a name.
   * @param name The name of the role.
   * @returns The render role associated with the specified name, or undefined if there is no such role.
   */
  public getRoleFromName(name: string): number | undefined {
    return this.roleIdMap.get(name);
  }

  /**
   * Gets the names of roles in a specified group.
   * @param group A render role group.
   * @returns An array of the names of all render roles belonging to the specified group.
   */
  public getRoleNamesByGroup(group: string): readonly string[] {
    const roleNames = this.rolesByGroup.get(group);
    if (roleNames !== undefined) {
      return roleNames;
    }

    return [];
  }
}

/**
 * A class that creates icons for the map system waypoint renderer.
 */
export class MapSystemIconFactory implements MapWaypointRendererIconFactory<Waypoint> {
  private readonly cache = new Map<number, Map<string, MapWaypointIcon<any>>>();
  private readonly iconFactories = new Map<number, Map<string, ((waypoint: Waypoint) => MapWaypointIcon<any>)>>();
  private readonly defaultIconFactories = new Map<number, ((waypoint: Waypoint) => MapWaypointIcon<any>)>();

  /**
   * Adds an icon factory to the container.
   * @param role The role that this icon factory will be assigned to.
   * @param iconType The unique string type name of the icon.
   * @param factory The factory that will produce the icon.
   */
  public addIconFactory<T extends Waypoint>(role: number, iconType: string, factory: (waypoint: T) => MapWaypointIcon<T>): void {
    if (!this.iconFactories.has(role)) {
      this.iconFactories.set(role, new Map<string, ((waypoint: Waypoint) => MapWaypointIcon<any>)>());
    }

    const roleFactories = this.iconFactories.get(role) as Map<string, ((waypoint: Waypoint) => MapWaypointIcon<any>)>;
    roleFactories.set(iconType, factory as any);
  }

  /**
   * Adds a default icon factory for a role.
   * @param role The role to add a default icon factory for.
   * @param factory The factory that will produce the icons.
   */
  public addDefaultIconFactory<T extends Waypoint>(role: number, factory: (waypoint: T) => MapWaypointIcon<T>): void {
    this.defaultIconFactories.set(role, factory as (waypoint: Waypoint) => MapWaypointIcon<T>);
  }

  /** @inheritdoc */
  public getIcon<T extends Waypoint>(role: number, waypoint: T): MapWaypointIcon<T> {
    if (!this.cache.has(role)) {
      this.cache.set(role, new Map<string, MapWaypointIcon<any>>());
    }

    const roleCache = this.cache.get(role) as Map<string, MapWaypointIcon<any>>;
    let icon = roleCache.get(waypoint.uid);
    if (icon === undefined) {
      icon = this.createIcon(role, waypoint);
      roleCache.set(waypoint.uid, icon);
    }

    return icon;
  }

  /**
   * Creates a new icon for a waypoint.
   * @param role The role that has been selected to render.
   * @param waypoint The waypoint for which to create an icon.
   * @returns a waypoint icon.
   */
  private createIcon<T extends Waypoint>(role: number, waypoint: T): MapWaypointIcon<T> {
    if (!this.iconFactories.has(role)) {
      this.iconFactories.set(role, new Map<string, ((waypoint: Waypoint) => MapWaypointIcon<any>)>());
    }

    const roleFactories = this.iconFactories.get(role) as Map<string, ((waypoint: Waypoint) => MapWaypointIcon<any>)>;
    const factory = roleFactories.get(waypoint.type);
    if (factory !== undefined) {
      return factory(waypoint);
    } else {
      const defaultFactory = this.defaultIconFactories.get(role);
      if (defaultFactory !== undefined) {
        return defaultFactory(waypoint);
      }
    }

    const imageEl = document.createElement('img');
    imageEl.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAFjSURBVFhHvZarTsVAEIa3qCMQCAxPgEEikDwGAkGCAIFAIHgQHgGJ4C0Q4AiBN8CQQAIJuOGfs9N0d3p62tlLv+RPd2fFNrNfLy4Lov1lMtiQayqnyJkfzg3RAvlEfpEtqZrJ6cARwhsvkGMuzAvRA0KSZ6nOBNFesHmbA1k1kXoEq8SbScZOPt2BJBlTOtDKx7whT344l4yxfFfIeTCvLGMsH7d8G9lEvqXGMcloPYJQtHvXNB/ID8a3vrSkkox9+Q5lhdf4m9DWs96MwxCdBJu8SrWD6DFYv5BqQbR8mqoyrpJPkyjjVAn78mmqybhOPk0VGcfk0xSXcUw+TVEZp8inMco4JuG4fJpiMlrk0xSR0SqfJltGq3yaLBlT5NNMlHFIQrt8mokyNnLtYPmce0dace6QFz80s4vwLxzzh+zgxr78dIhYvtK5lF3WEMtXOr2nKT4C3/5rP6nGTZJTdXDuH4TJQyPZ/x+gAAAAAElFTkSuQmCC';
    return new MapWaypointImageIcon(waypoint, 0, imageEl, Vec2Math.create(24, 24));
  }
}

/**
 * A class that create labels for the map system waypoint renderer.
 */
export class MapSystemLabelFactory implements MapWaypointRendererLabelFactory<Waypoint> {
  private readonly cache = new Map<number, Map<string, MapCullableTextLabel>>();
  private readonly labelFactories = new Map<number, Map<string, ((waypoint: Waypoint) => MapCullableLocationTextLabel)>>();
  private readonly defaultLabelFactories = new Map<number, ((waypoint: Waypoint) => MapCullableLocationTextLabel)>();

  /**
   * Adds an label factory to the container.
   * @param role The role to add this label factory for.
   * @param iconType The unique string type name of the waypoint.
   * @param factory The factory that will produce the waypoint label.
   */
  public addLabelFactory<T extends Waypoint>(role: number, iconType: string, factory: (waypoint: T) => MapCullableLocationTextLabel): void {
    if (!this.labelFactories.has(role)) {
      this.labelFactories.set(role, new Map<string, ((waypoint: Waypoint) => MapCullableLocationTextLabel)>());
    }

    const roleFactories = this.labelFactories.get(role) as Map<string, ((waypoint: Waypoint) => MapCullableLocationTextLabel)>;
    roleFactories.set(iconType, factory as any);
  }

  /**
   * Adds a default label factory for a role.
   * @param role The role to add a default label factory for.
   * @param factory The factory that will produce the labels.
   */
  public addDefaultLabelFactory<T extends Waypoint>(role: number, factory: (waypoint: T) => MapCullableLocationTextLabel): void {
    this.defaultLabelFactories.set(role, factory as (waypoint: Waypoint) => MapCullableLocationTextLabel);
  }

  /** @inheritdoc */
  public getLabel<T extends Waypoint>(role: number, waypoint: T): MapCullableTextLabel {
    if (!this.cache.has(role)) {
      this.cache.set(role, new Map<string, MapCullableTextLabel>());
    }

    const roleCache = this.cache.get(role) as Map<string, MapCullableTextLabel>;
    let label = roleCache.get(waypoint.uid);
    if (label === undefined) {
      label = this.createLabel(role, waypoint);
      roleCache.set(waypoint.uid, label);
    }

    return label;
  }

  /**
   * Creates a new label for a waypoint.
   * @param role The role that has been selected to render.
   * @param waypoint The waypoint to create a label for.
   * @returns A new waypoint label.
   */
  public createLabel(role: number, waypoint: Waypoint): MapCullableLocationTextLabel {
    if (!this.labelFactories.has(role)) {
      this.labelFactories.set(role, new Map<string, ((waypoint: Waypoint) => MapCullableLocationTextLabel)>());
    }

    const roleFactories = this.labelFactories.get(role) as Map<string, ((waypoint: Waypoint) => MapCullableLocationTextLabel)>;
    const factory = roleFactories.get(waypoint.type);
    if (factory !== undefined) {
      return factory(waypoint);
    } else {
      const defaultFactory = this.defaultLabelFactories.get(role);
      if (defaultFactory !== undefined) {
        return defaultFactory(waypoint);
      }
    }

    let text = '';

    if (waypoint instanceof FacilityWaypoint) {
      text = ICAO.getIdent(waypoint.facility.get().icao);
    }

    return new MapCullableLocationTextLabel(text, 0, waypoint.location, false, { fontSize: 22, font: 'monospace', anchor: new Float64Array([-0.25, 0.4]) });
  }
}