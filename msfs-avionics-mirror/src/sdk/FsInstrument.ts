/**
 * An interface to be implemented by instrument classes.
 */
export interface FsInstrument {
  /**
   * A reference to the BaseInstrument loaded by the sim
   */
  readonly instrument: BaseInstrument;
  Update(): void;
  onInteractionEvent(_args: Array<string>): void;
  onFlightStart(): void;
  onGameStateChanged(oldState: GameState, newState: GameState): void;
}

/**
 * A class that wraps the actual instrumenet implementation and handles the sim's vcockpit lifecycle.
 */
export abstract class FsBaseInstrument<T extends FsInstrument> extends BaseInstrument {
  protected fsInstrument!: T;

  /**
   * The instrument template ID.
   * @returns The instrument template ID.
   */
  abstract get templateID(): string;

  /**
   * Called during connectedCallback to construct the actual instrument class.
   */
  abstract constructInstrument(): T;

  /**
   * A callback called when the element is attached to the DOM.
   */
  public connectedCallback(): void {
    super.connectedCallback();
    this.fsInstrument = this.constructInstrument();
  }

  /**
   * Update method called by BaseInstrument
   */
  protected Update(): void {
    super.Update();
    if (this.fsInstrument) {
      this.fsInstrument.Update();
    }
  }

  /** @inheritdoc */
  public onInteractionEvent(_args: Array<string>): void {
    if (this.fsInstrument) {
      this.fsInstrument.onInteractionEvent(_args);
    }
  }

  /** @inheritdoc */
  protected onGameStateChanged(oldState: GameState, newState: GameState): void {
    super.onGameStateChanged(oldState, newState);
    if (this.fsInstrument) {
      this.fsInstrument.onGameStateChanged(oldState, newState);
    }
  }

  /** @inheritdoc */
  public onFlightStart(): void {
    super.onFlightStart();
    if (this.fsInstrument) {
      this.fsInstrument.onFlightStart();
    }
  }

  /**
   * Whether or not the instrument is interactive (a touchscreen instrument).
   * @returns True
   */
  get isInteractive(): boolean {
    return false;
  }
}