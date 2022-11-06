/**
 * An interface that describes a manager for dictating nav to nav transfer behavior
 * and criteria.
 */
export interface NavToNavManager {
  /**
   * A callback called when the nav transfer has been completed.
   */
  onTransferred: () => void;

  /**
   * A method that determines whether or not nav mode can be armed
   * when approach mode is attempted to be armed.
   * @returns True if it can be armed, false otherwise.
   */
  canLocArm(): boolean;

  /**
   * A method that determines whether or not an armed loc nav mode can
   * become active.
   * @returns True if it can become active, false otherwise.
   */
  canLocActivate(): boolean;
}