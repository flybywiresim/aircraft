import { APVerticalModes } from '../APConfig';
import { VNavState } from '../VerticalNavigation';

/**
 * A Vertical Navigation Manager.
 */
export interface VNavManager {

  /**
   * Sets the state of the manager.
   */
  setState(vnavState: VNavState): void;

  /**
   * Tries to activate the manager.
   */
  tryActivate(): void;

  /**
   * Tries to deactivate the manager.
   * @param newMode Is the new mode to set active in the Autopilot if Path Mode is currently active.
   */
  tryDeactivate(newMode?: APVerticalModes): void;

  /**
   * Updates the manager.
   */
  update(): void;

  /**
   * A callback called by the autopilot to check if a vertical mode can be activated.
   */
  canVerticalModeActivate: (mode: APVerticalModes) => boolean;

  /** A callback called when the APVNavPathDirector Deactivates. */
  onPathDirectorDeactivated: () => void;

  /**
   * A callback called by the autopilot to arm the supplied vertical mode.
   */
  armMode?: (mode: APVerticalModes) => void;

  /**
   * A callback called by the autopilot to activate the supplied vertical mode.
   */
  activateMode?: (mode: APVerticalModes) => void;

  /** A callback called when the manager is activated. */
  onActivate?: () => void;

  /** A callback called when the manager is deactivated. */
  onDeactivate?: () => void;

  /** The current manager state. */
  state: VNavState;
}