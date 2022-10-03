import { EventBus } from '../data/EventBus';
import { ElectricalEvents } from '../instruments/Electrical';
import { Subscription } from '../sub/Subscription';
import { DebounceTimer } from '../utils/time/DebounceTimer';
import { AvionicsSystem, AvionicsSystemState, AvionicsSystemStateEvent } from './AvionicsSystem';

/** A type that pulls keys that have avionics state events from a supplied generic type. */
type StateEventsOnly<T> = {
  [K in keyof T as T[K] extends AvionicsSystemStateEvent ? K : never]: T[K]
}

/** The subset of electrical events that have boolean values.  */
type ElectricalBools = {
  [K in keyof ElectricalEvents]: ElectricalEvents[K] extends boolean ? ElectricalEvents[K] : never
};

/**
 * An electrical system key to which system power can be connected.
 */
export type SystemPowerKey = keyof ElectricalBools;

/**
 * A basic avionics system with a fixed initialization time and logic.
 */
export abstract class BasicAvionicsSystem<T extends Record<string, any>> implements AvionicsSystem {

  protected _state: AvionicsSystemState | undefined;
  /** @inheritdoc */
  public get state(): AvionicsSystemState | undefined {
    return this._state;
  }

  /** The time it takes in milliseconds for the system to initialize. */
  protected initializationTime = 0;

  /** A timeout after which initialization will be complete. */
  protected readonly initializationTimer = new DebounceTimer();

  /** Whether or not the system is powered. */
  protected isPowered: boolean | undefined;

  protected electricalPowerSub?: Subscription;
  protected electricalPowerLogic?: CompositeLogicXMLElement;

  /**
   * Creates an instance of a BasicAvionicsSystem.
   * @param index The index of the system.
   * @param bus The instance of the event bus for the system to use.
   * @param stateEvent The key of the state update event to send on state update.
   */
  constructor(
    public readonly index: number,
    protected readonly bus: EventBus,
    protected readonly stateEvent: keyof StateEventsOnly<T> & string
  ) { }

  /**
   * Connects this system's power state to an {@link ElectricalEvents} topic or electricity logic element.
   * @param source The source to which to connect this system's power state.
   */
  protected connectToPower(source: SystemPowerKey | CompositeLogicXMLElement): void {
    this.electricalPowerSub?.destroy();
    this.electricalPowerSub = undefined;
    this.electricalPowerLogic = undefined;

    if (typeof source === 'string') {
      this.electricalPowerSub = this.bus.getSubscriber<ElectricalBools>()
        .on(source)
        .whenChanged()
        .handle(this.onPowerChanged.bind(this));
    } else {
      this.electricalPowerLogic = source;
      this.updatePowerFromLogic();
    }
  }

  /**
   * Sets the state of the avionics system and publishes the change.
   * @param state The new state to change to.
   */
  protected setState(state: AvionicsSystemState): void {
    if (this._state !== state) {
      const previous = this._state;
      this._state = state;
      this.onStateChanged(previous, state);
      this.bus.pub(this.stateEvent, { index: this.index, previous, current: state });
    }
  }

  /**
   * Responds to changes in this system's state.
   * @param previousState The previous state.
   * @param currentState The current state.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onStateChanged(previousState: AvionicsSystemState | undefined, currentState: AvionicsSystemState): void {
    // noop
  }

  /**
   * A callback called when the connected power state of the avionics system changes.
   * @param isPowered Whether or not the system is powered.
   */
  protected onPowerChanged(isPowered: boolean): void {
    if (this.isPowered === undefined) {
      this.initializationTimer.clear();
      if (isPowered) {
        this.setState(AvionicsSystemState.On);
      } else {
        this.setState(AvionicsSystemState.Off);
      }
    } else {
      if (isPowered) {
        this.setState(AvionicsSystemState.Initializing);
        this.initializationTimer.schedule(() => this.setState(AvionicsSystemState.On), this.initializationTime);
      } else {
        this.initializationTimer.clear();
        this.setState(AvionicsSystemState.Off);
      }
    }

    this.isPowered = isPowered;
  }

  /** @inheritdoc */
  public onUpdate(): void {
    this.updatePowerFromLogic();
  }

  /**
   * Updates this system's power state from an electricity logic element.
   */
  protected updatePowerFromLogic(): void {
    if (this.electricalPowerLogic === undefined) {
      return;
    }

    const isPowered = this.electricalPowerLogic.getValue() !== 0;
    if (isPowered !== this.isPowered) {
      this.onPowerChanged(isPowered);
    }
  }
}