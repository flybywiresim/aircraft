/**
 * The state of an avionics system.
 */
export enum AvionicsSystemState {
  Off = 'Off',
  Initializing = 'Initializing',
  On = 'On',
  Failed = 'Failed'
}

/**
 * An event that contains an avionics system state change.
 */
export interface AvionicsSystemStateEvent {
  /** The previous system state. */
  previous: AvionicsSystemState | undefined;

  /** The state that the system was changed to. */
  current: AvionicsSystemState;
}

/**
 * An interface that describes a basic avionics system.
 */
export interface AvionicsSystem {
  /** The state of the avionics system. */
  readonly state: AvionicsSystemState | undefined;

  /** A callback to call to update the state of the avionics system. */
  onUpdate(): void;

  /** The index of the system, for multiply redundant systems. */
  readonly index: number
}