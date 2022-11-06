import { LatLonInterface } from '../../geo';
import { BitFlags } from '../../math';
import { MapCullableTextLabel, MapCullableTextLabelManager } from './MapCullableTextLabel';
import { MapProjection } from './MapProjection';
import { MapWaypoint } from './MapWaypoint';
import { MapWaypointIcon } from './MapWaypointIcon';

/**
 * A waypoint icon factory.
 */
export interface MapWaypointRendererIconFactory<W extends MapWaypoint> {
  /**
   * Gets an icon for a waypoint.
   * @param role The role that was selected for the waypoint for rendering.
   * @param waypoint A waypoint.
   * @returns a waypoint icon.
   */
  getIcon<T extends W>(role: number, waypoint: T): MapWaypointIcon<T>;
}

/**
 * A waypoint label factory.
 */
export interface MapWaypointRendererLabelFactory<W extends MapWaypoint> {
  /**
   * Gets a label for a waypoint.
   * @param role The role that was selected for the waypoint for rendering.
   * @param waypoint A waypoint.
   * @returns a waypoint label.
   */
  getLabel<T extends W>(role: number, waypoint: T): MapCullableTextLabel;
}

/**
 * A render role definition.
 */
export type MapWaypointRenderRoleDef<W extends MapWaypoint> = {
  /** The icon factory used to create icons for the render role. */
  iconFactory: MapWaypointRendererIconFactory<W> | null,

  /** The label factory used to create labels for the render role. */
  labelFactory: MapWaypointRendererLabelFactory<W> | null,

  /** The canvas rendering context used to draw icons and labels for the render role. */
  canvasContext: CanvasRenderingContext2D | null,

  /** A function which determines whether a waypoint is visible under the render role. */
  visibilityHandler: (waypoint: W) => boolean;
}

/**
 * A function which selects roles under which to render waypoints.
 */
export type MapWaypointRenderRoleSelector<W extends MapWaypoint> = (
  entry: MapWaypointRendererEntry<W>,
  roleDefinitions: ReadonlyMap<number, Readonly<MapWaypointRenderRoleDef<W>>>
) => number;

/**
 * Gets the waypoint type supported by a waypoint renderer.
 */
export type MapWaypointRendererType<Renderer> = Renderer extends MapWaypointRenderer<infer W> ? W : never;

/**
 * A renderer that draws waypoints to a map. For the renderer to draw a waypoint, the waypoint must first be registered
 * with the renderer. Waypoints may be registered under multiple render roles. Each render role is represented as a bit
 * flag. During each render cycle, a specific role is chosen for each waypoint by a selector function. Once the role is
 * chosen, the waypoint will be rendered in that role.
 */
export class MapWaypointRenderer<W extends MapWaypoint = MapWaypoint> {
  /** A null render role definition. Icons rendered under this role are never visible. */
  protected static readonly NULL_ROLE_DEF = {
    iconFactory: null,
    labelFactory: null,
    canvasContext: null,
    visibilityHandler: (): boolean => true
  };

  /**
   * Sorts waypoint entries such that those with icons of higher priority are sorted after those with icons of lower
   * priority.
   * @param a The first waypoint entry to sort.
   * @param b The second waypoint entry to sort.
   * @returns A negative number if the first entry is to be sorted before the second, a positive number if the second
   * entry is to be sorted before the first, and zero if the entries' relative sorting order does not matter.
   */
  protected static readonly ENTRY_SORT_FUNC = (a: MapWaypointRendererEntry<any>, b: MapWaypointRendererEntry<any>): number => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return a.icon!.priority.get() - b.icon!.priority.get();
  };

  /**
   * The default render role selector. For each waypoint entry, iterates through all possible render roles in the order
   * they were originally added to the renderer and selects the first role under which the entry is registered and is
   * visible.
   * @param entry A waypoint entry.
   * @param roleDefinitions A map from all possible render roles to their definitions.
   * @returns The role under which the waypoint entry should be rendered, or 0 if the entry should not be rendered
   * under any role.
   */
  public static readonly DEFAULT_RENDER_ROLE_SELECTOR = <T extends MapWaypoint>(
    entry: MapWaypointRendererEntry<T>,
    roleDefinitions: ReadonlyMap<number, Readonly<MapWaypointRenderRoleDef<T>>>
  ): number => {
    for (const role of roleDefinitions.keys()) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (entry.isAllRoles(role) && roleDefinitions.get(role)!.visibilityHandler(entry.waypoint)) {
        return role;
      }
    }

    return 0;
  };

  protected readonly registered = new Map<string, MapWaypointRendererEntry<W>>();
  protected readonly toCleanUp = new Set<MapWaypointRendererEntry<W>>();

  /**
   * This renderer's render role definitions. Waypoints assigned to be rendered under a role or combination of roles
   * with no definition will not be rendered.
   */
  protected readonly roleDefinitions = new Map<number, MapWaypointRenderRoleDef<W>>();

  /**
   * Constructor.
   * @param textManager The text manager to use for waypoint labels.
   * @param selectRoleToRender A function which selects roles under which to render waypoints. Defaults to
   * {@link MapWaypointRenderer.DEFAULT_RENDER_ROLE_SELECTOR}.
   */
  constructor(
    protected readonly textManager: MapCullableTextLabelManager,
    protected readonly selectRoleToRender: MapWaypointRenderRoleSelector<W> = MapWaypointRenderer.DEFAULT_RENDER_ROLE_SELECTOR
  ) {
  }

  /**
   * Checks whether a render role has been added to this renderer.
   * @param role The render role to check.
   * @returns Whether the render role has been added to this renderer.
   */
  public hasRenderRole(role: number): boolean {
    return this.roleDefinitions.has(role);
  }

  /**
   * Adds a render role to this renderer. If the role has already been added to this renderer, this method does
   * nothing.
   * @param role The render role to add.
   * @param def The render role's definition. If undefined, the new role will be assigned a default definition with
   * no defined rendering context, icon, or label factories, and a visibility handler which always returns true.
   * @returns Whether the render role was successfully added.
   */
  public addRenderRole(role: number, def?: MapWaypointRenderRoleDef<W>): boolean {
    if (this.roleDefinitions.has(role)) {
      return false;
    }

    this.roleDefinitions.set(role, Object.assign({}, def ?? MapWaypointRenderer.NULL_ROLE_DEF));

    return true;
  }

  /**
   * Removes a render role from this renderer.
   * @param role The render role to remove.
   * @returns Whether the render role was successfully removed.
   */
  public removeRenderRole(role: number): boolean {
    return this.roleDefinitions.delete(role);
  }

  /**
   * Gets the definition for a render role.
   * @param role A render role.
   * @returns The definition for the specified render role, or undefined if no such role has been added to this
   * renderer.
   */
  public getRenderRoleDefinition(role: number): Readonly<MapWaypointRenderRoleDef<W>> | undefined {
    return this.roleDefinitions.get(role);
  }

  /**
   * Gets an iterable of render roles added to this renderer. The iterable will return the roles in the order in which
   * they were added.
   * @returns An iterable of render roles added to this renderer.
   */
  public renderRoles(): IterableIterator<number> {
    return this.roleDefinitions.keys();
  }

  /**
   * Removes all render roles from this renderer.
   */
  public clearRenderRoles(): void {
    this.roleDefinitions.clear();
  }

  /**
   * Sets the factory to use to create waypoint icons for a render role. If the render role has not been added to this
   * renderer, this method does nothing.
   * @param role A render role.
   * @param factory A waypoint icon factory.
   * @returns Whether the factory was set.
   */
  public setIconFactory(role: number, factory: MapWaypointRendererIconFactory<W>): boolean {
    const roleDef = this.roleDefinitions.get(role);

    if (!roleDef) {
      return false;
    }

    roleDef.iconFactory = factory;
    return true;
  }

  /**
   * Sets the factory to use to create waypoint labels for a render role. If the render role has not been added to this
   * renderer, this method does nothing.
   * @param role A render role.
   * @param factory A waypoint label factory.
   * @returns Whether the factory was set.
   */
  public setLabelFactory(role: number, factory: MapWaypointRendererLabelFactory<W>): boolean {
    const roleDef = this.roleDefinitions.get(role);

    if (!roleDef) {
      return false;
    }

    roleDef.labelFactory = factory;
    return true;
  }

  /**
   * Sets the canvas rendering context for a render role. If the render role has not been added to this renderer, this
   * method does nothing.
   * @param role A render role.
   * @param context A canvas 2D rendering context.
   * @returns Whether the context was set.
   */
  public setCanvasContext(role: number, context: CanvasRenderingContext2D): boolean {
    const roleDef = this.roleDefinitions.get(role);

    if (!roleDef) {
      return false;
    }

    roleDef.canvasContext = context;
    return true;
  }

  /**
   * Sets the handler that determines if a waypoint should visible for a render role. If the render role has not been
   * added to this renderer, this method does nothing.
   * @param role A render role.
   * @param handler A function that determines if a waypoint should be visible.
   * @returns Whether the handler was set.
   */
  public setVisibilityHandler(role: number, handler: (waypoint: W) => boolean): boolean {
    const roleDef = this.roleDefinitions.get(role);

    if (!roleDef) {
      return false;
    }

    roleDef.visibilityHandler = handler;
    return true;
  }

  /**
   * Checks if a waypoint is registered with this renderer. A role or roles can be optionally specified such that the
   * method will only return true if the waypoint is registered under those specific roles.
   * @param waypoint A waypoint.
   * @param role The specific role(s) to check.
   * @returns whether the waypoint is registered with this renderer.
   */
  public isRegistered(waypoint: W, role?: number): boolean {
    if (!waypoint) {
      return false;
    }

    const entry = this.registered.get(waypoint.uid);
    if (!entry) {
      return false;
    }

    if (role === undefined) {
      return true;
    }
    return entry.isAllRoles(role);
  }

  /**
   * Registers a waypoint with this renderer under a specific role or roles. Registered waypoints will be drawn as
   * appropriate the next time this renderer's update() method is called. Registering a waypoint under a role under
   * which it is already registered has no effect unless the source of the registration is different.
   * @param waypoint The waypoint to register.
   * @param role The role(s) under which the waypoint should be registered.
   * @param sourceId A unique string ID for the source of the registration.
   */
  public register(waypoint: W, role: number, sourceId: string): void {
    if (role === 0 || sourceId === '') {
      return;
    }

    let entry = this.registered.get(waypoint.uid);
    if (!entry) {
      entry = new MapWaypointRendererEntry<W>(waypoint, this.textManager, this.roleDefinitions, this.selectRoleToRender);
      this.registered.set(waypoint.uid, entry);
    }

    entry.addRole(role, sourceId);
  }

  /**
   * Removes a registration for a waypoint for a specific role or roles. Once all of a waypoint's registrations for a
   * role are removed, it will no longer be rendered in that role the next this renderer's update() method is called.
   * @param waypoint The waypoint to deregister.
   * @param role The role(s) from which the waypoint should be deregistered.
   * @param sourceId The unique string ID for the source of the registration to remove.
   */
  public deregister(waypoint: W, role: number, sourceId: string): void {
    if (role === 0 || sourceId === '') {
      return;
    }

    const entry = this.registered.get(waypoint.uid);
    if (!entry) {
      return;
    }

    entry.removeRole(role, sourceId);
    if (entry.roles === 0) {
      this.deleteEntry(entry);
    }
  }

  /**
   * Deletes and cleans up a registered waypoint entry.
   * @param entry The entry to delete.
   */
  private deleteEntry(entry: MapWaypointRendererEntry<W>): void {
    this.registered.delete(entry.waypoint.uid);
    this.toCleanUp.add(entry);
  }

  /**
   * Redraws waypoints registered with this renderer.
   * @param mapProjection The map projection to use.
   */
  public update(mapProjection: MapProjection): void {
    this.toCleanUp.forEach(entry => {
      entry.destroy();
    });
    this.toCleanUp.clear();

    const entriesToDrawIcon: MapWaypointRendererEntry<W>[] = [];
    this.registered.forEach(entry => {
      entry.update();
      if (entry.icon) {
        entriesToDrawIcon.push(entry);
      }
    });

    const projectedSize = mapProjection.getProjectedSize();
    for (const roleDef of this.roleDefinitions.values()) {
      const context = roleDef.canvasContext;
      if (context) {
        context.clearRect(0, 0, projectedSize[0], projectedSize[1]);
      }
    }

    entriesToDrawIcon.sort(MapWaypointRenderer.ENTRY_SORT_FUNC);
    const len2 = entriesToDrawIcon.length;
    for (let i = 0; i < len2; i++) {
      const entry = entriesToDrawIcon[i];
      const icon = entry.icon;
      const context = this.roleDefinitions.get(entry.lastRenderedRole)?.canvasContext;
      if (context) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        icon!.draw(context, mapProjection);
      }
    }
  }

  /**
   * Gets the nearest waypoint currently registered in the renderer.
   * @param pos The position to get the closest waypoint to.
   * @param first A predicate that will search the list of closest waypoints for a match, and return the first one found.
   * @returns The nearest waypoint, or undefined if none found.
   */
  public getNearestWaypoint<T extends W = W>(pos: LatLonInterface, first?: (waypoint: W) => boolean): T | undefined {
    const ordered = [...this.registered.values()].sort((a, b) => this.orderByDistance(a.waypoint, b.waypoint, pos))
      .filter(w => {
        const roleDef = this.getRenderRoleDefinition(w.lastRenderedRole);
        if (roleDef !== undefined) {
          return roleDef.visibilityHandler(w.waypoint);
        }

        return false;
      });

    if (first !== undefined) {
      return ordered.find(entry => first(entry.waypoint))?.waypoint as unknown as T;
    }

    return ordered[0]?.waypoint as unknown as T;
  }

  /**
   * Orders waypoints by their distance to the plane PPOS.
   * @param a The first waypoint.
   * @param b The second waypoint.
   * @param pos The position to compare against.
   * @returns The comparison order number.
   */
  private orderByDistance(a: MapWaypoint, b: MapWaypoint, pos: LatLonInterface): number {
    const aDist = a.location.get().distance(pos);
    const bDist = b.location.get().distance(pos);

    return aDist - bDist;
  }
}

/**
 * An entry for a waypoint registered with {@link MapWaypointRenderer}.
 */
export class MapWaypointRendererEntry<W extends MapWaypoint> {
  private readonly registrations: Record<number, Set<string> | undefined> = {};

  private _roles = 0;
  private _icon: MapWaypointIcon<W> | null = null;
  private _label: MapCullableTextLabel | null = null;
  private _lastRenderedRole = 0;

  /**
   * Constructor.
   * @param waypoint The waypoint associated with this entry.
   * @param textManager The text manager to which to register this entry's labels.
   * @param roleDefinitions A map of all valid render roles to their definitions.
   * @param selectRoleToRender A function to use to select roles under which to render this entry.
   */
  constructor(
    public readonly waypoint: W,
    private readonly textManager: MapCullableTextLabelManager,
    private readonly roleDefinitions: ReadonlyMap<number, Readonly<MapWaypointRenderRoleDef<W>>>,
    private readonly selectRoleToRender: MapWaypointRenderRoleSelector<W>
  ) {
  }

  // eslint-disable-next-line jsdoc/require-returns
  /** The render role(s) assigned to this entry. */
  public get roles(): number {
    return this._roles;
  }

  // eslint-disable-next-line jsdoc/require-returns
  /** The role under which this entry was last rendered, or 0 if this entry has not yet been rendered. */
  public get lastRenderedRole(): number {
    return this._lastRenderedRole;
  }

  // eslint-disable-next-line jsdoc/require-returns
  /** This entry's waypoint icon. */
  public get icon(): MapWaypointIcon<W> | null {
    return this._icon;
  }

  // eslint-disable-next-line jsdoc/require-returns
  /** This entry's waypoint label. */
  public get label(): MapCullableTextLabel | null {
    return this._label;
  }

  /**
   * Checks whether this entry is assigned any of the specified render roles. Optionally, this method can also check
   * if this entry was last rendered in any of the specified roles instead.
   * @param roles The render roles against which to check.
   * @param useLastRendered Whether to check the role(s) in which this entry was last rendered instead of the current
   * roles assigned to this entry. False by default.
   * @returns whether the check passed.
   */
  public isAnyRole(roles: number, useLastRendered = false): boolean {
    let toCompare;
    if (useLastRendered) {
      toCompare = this.lastRenderedRole;
    } else {
      toCompare = this.roles;
    }
    return BitFlags.isAny(toCompare, roles);
  }

  /**
   * Checks whether this entry is assigned only the specified render role(s). Optionally, this method can also check
   * if this entry was last rendered in only the specified role(s) instead.
   * @param roles The render roles against which to check.
   * @param useLastRendered Whether to check the role(s) in which this entry was last rendered instead of the current
   * roles assigned to this entry. False by default.
   * @returns whether the check passed.
   */
  public isOnlyRole(roles: number, useLastRendered = false): boolean {
    let toCompare;
    if (useLastRendered) {
      toCompare = this.lastRenderedRole;
    } else {
      toCompare = this.roles;
    }
    return toCompare === roles;
  }

  /**
   * Checks whether this entry is assigned all the specified render role(s). Optionally, this method can also check
   * if this entry was last rendered in all the specified role(s) instead.
   * @param roles - the render role(s) against which to check.
   * @param useLastRendered Whether to check the role(s) in which this entry was last rendered instead of the current
   * roles assigned to this entry. False by default.
   * @returns whether the check passed.
   */
  public isAllRoles(roles: number, useLastRendered = false): boolean {
    let toCompare;
    if (useLastRendered) {
      toCompare = this.lastRenderedRole;
    } else {
      toCompare = this.roles;
    }
    return BitFlags.isAll(toCompare, roles);
  }

  /**
   * Assigns one or more render roles to this entry.
   * @param roles The render role(s) to assign.
   * @param sourceId The unique string ID of the source of the assignment.
   */
  public addRole(roles: number, sourceId: string): void {
    BitFlags.forEach(roles, (value, index) => {
      (this.registrations[1 << index] ??= new Set<string>()).add(sourceId);
    }, true);

    this._roles = this._roles | roles;
  }

  /**
   * Removes one or more render roles from this entry.
   * @param roles The render role(s) to remove.
   * @param sourceId The unique string ID of the soruce of the de-assignment.
   */
  public removeRole(roles: number, sourceId: string): void {
    BitFlags.forEach(roles, (value, index) => {
      const role = 1 << index;
      const registrations = this.registrations[role];
      if (registrations) {
        registrations.delete(sourceId);
        if (registrations.size === 0) {
          this._roles = this._roles & ~role;
        }
      }
    }, true);
  }

  /**
   * Prepares this entry for rendering.
   * @param showRole The role in which this entry should be rendered.
   * @param iconFactory The factory to use to get a waypoint icon.
   * @param labelFactory The factory to use to get a waypoint label.
   */
  private prepareRender(
    showRole: number,
    iconFactory: MapWaypointRendererIconFactory<W> | null,
    labelFactory: MapWaypointRendererLabelFactory<W> | null
  ): void {
    if (showRole === this._lastRenderedRole) {
      return;
    }

    this._icon = iconFactory?.getIcon(showRole, this.waypoint) ?? null;

    const label = labelFactory?.getLabel(showRole, this.waypoint) ?? null;
    if (this._label && this._label !== label) {
      this.textManager.deregister(this._label);
    }
    if (label && label !== this._label) {
      this.textManager.register(label);
    }
    this._label = label;

    this._lastRenderedRole = showRole;
  }

  /**
   * Updates this entry. An appropriate render role is selected, then the icon and label are updated as appropriate
   * for the chosen role. If the waypoint's label should be visible, it is added to the appropriate text manager.
   * Of note, this method will not draw the waypoint icon to a canvas element; it will simply ensure the .showIcon
   * property contains the correct value depending on whether the icon should be visible.
   */
  public update(): void {
    const showRole = this.selectRoleToRender(this, this.roleDefinitions);
    const roleDef = this.roleDefinitions.get(showRole);
    const iconFactory = roleDef?.iconFactory ?? null;
    const labelFactory = roleDef?.labelFactory ?? null;
    this.prepareRender(showRole, iconFactory, labelFactory);
  }

  /**
   * Destroys this entry. Any label from this entry currently registered with the text manager will be deregistered.
   */
  public destroy(): void {
    if (this._label) {
      this.textManager.deregister(this._label);
    }
  }
}