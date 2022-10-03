import { Waypoint } from '../../navigation/Waypoint';
import { MapCullableLocationTextLabel } from '../map/MapCullableTextLabel';
import { MapWaypointIcon } from '../map/MapWaypointIcon';
import { MapSystemWaypointRoles } from './MapSystemWaypointRoles';
import { MapSystemIconFactory, MapSystemLabelFactory, MapSystemWaypointsRenderer } from './MapSystemWaypointsRenderer';

/**
 * A class that builds a configuration for the waypoint display.
 */
export class WaypointDisplayBuilder {

  protected roleGroup: string = MapSystemWaypointRoles.Normal;
  protected isCenterTarget = false;

  /**
   * Creates an instance of the WaypointDisplayBuilder.
   * @param iconFactory The icon factory to use with this builder.
   * @param labelFactory The label factory to use with this builder.
   * @param waypointRenderer The waypoint renderer to use with this builder.
   */
  constructor(protected readonly iconFactory: MapSystemIconFactory, protected readonly labelFactory: MapSystemLabelFactory,
    protected readonly waypointRenderer: MapSystemWaypointsRenderer) { }

  /**
   * Adds a icon configuration to the waypoint display system.
   * @param role The role to add this waypoint display config for.
   * @param type The type of waypoint to add an icon for.
   * @param config The waypoint icon factory to add as a configuration.
   * @returns The modified builder.
   */
  public addIcon<T extends Waypoint>(role: number | string, type: string, config: (waypoint: T) => MapWaypointIcon<T>): this {
    this.iconFactory.addIconFactory<T>(this.determineRoleId(role), type, config);
    return this;
  }

  /**
   * Adds a default icon configuration to the waypoint display system, if no other configuration is found.
   * @param role The role to add this waypoint display config for.
   * @param config The waypoint icon factory to add as a configuration.
   * @returns The modified builder.
   */
  public addDefaultIcon<T extends Waypoint>(role: number | string, config: (waypoint: T) => MapWaypointIcon<T>): this {
    this.iconFactory.addDefaultIconFactory<T>(this.determineRoleId(role), config);
    return this;
  }

  /**
   * Adds a label configuration to the waypoint display system.
   * @param role The role to add this waypoint display config for.
   * @param type The type of waypoint to add an label for.
   * @param config The waypoint label factory to add as a configuration.
   * @returns The modified builder.
   */
  public addLabel<T extends Waypoint>(role: number | string, type: string, config: (waypoint: T) => MapCullableLocationTextLabel): this {
    this.labelFactory.addLabelFactory<T>(this.determineRoleId(role), type, config);
    return this;
  }

  /**
   * Adds a label configuration to the waypoint display system.
   * @param role The role to add this waypoint display config for.
   * @param config The waypoint label factory to add as a configuration.
   * @returns The modified builder.
   */
  public addDefaultLabel<T extends Waypoint>(role: number | string, config: (waypoint: T) => MapCullableLocationTextLabel): this {
    this.labelFactory.addDefaultLabelFactory<T>(this.determineRoleId(role), config);
    return this;
  }

  /**
   * Determines the role ID given either a numeric or string based role.
   * @param role The role to determine.
   * @returns The numeric role ID.
   */
  private determineRoleId(role: number | string): number {
    let roleId = 0;
    if (typeof role === 'string') {
      const roleIdFromName = this.waypointRenderer.getRoleFromName(role);
      if (roleIdFromName !== undefined) {
        roleId = roleIdFromName;
      }
    } else {
      roleId = role;
    }

    return roleId;
  }

  /**
   * Registers a waypoint display role for use with the flight plan rendering
   * system.
   * @param name The name of the role to register.
   * @returns The modified builder.
   */
  public registerRole(name: string): this {
    this.waypointRenderer.addRenderRole(name, undefined, this.roleGroup);

    return this;
  }

  /**
   * Gets the ID of a role in the waypoint display system.
   * @param role The name of the role to get the ID for.
   * @returns The ID of the role.
   * @throws An error if an invalid role name is supplied.
   */
  public getRoleId(role: string): number {
    const roleId = this.waypointRenderer.getRoleFromName(role);
    if (roleId === undefined) {
      throw new Error(`The role with name ${role} was not defined and could not be found.`);
    }

    return roleId;
  }

  /**
   * Configures the center for waypoint searches for this display.
   * @param center If center, then waypoint searches will use the map center. If target,
   * waypoint searches will use the map target with offset.
   * @returns The modified builder.
   */
  public withSearchCenter(center: 'center' | 'target'): this {
    if (center === 'center') {
      this.isCenterTarget = false;
    } else {
      this.isCenterTarget = true;
    }

    return this;
  }

  /**
   * Gets if the waypoint search is using the map target with offset as the search center.
   * @returns True if the search center is the map target, false if it is the map center.
   */
  public getIsCenterTarget(): boolean {
    return this.isCenterTarget;
  }
}