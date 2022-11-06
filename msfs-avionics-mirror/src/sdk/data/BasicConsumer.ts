import { Subscription } from '../sub/Subscription';
import { Consumer } from './Consumer';
import { Handler } from './EventBus';

/**
 * A basic implementation of {@link Consumer}.
 */
export class BasicConsumer<T> implements Consumer<T> {
  /** @inheritdoc */
  public readonly isConsumer = true;

  private readonly activeSubs = new Map<Handler<T>, Subscription[]>();

  /**
   * Creates an instance of a Consumer.
   * @param subscribe A function which subscribes a handler to the source of this consumer's events.
   * @param state The state for the consumer to track.
   * @param currentHandler The current build filter handler stack, if any.
   */
  constructor(
    private readonly subscribe: (handler: Handler<T>, paused: boolean) => Subscription,
    private state: any = {},
    private readonly currentHandler?: (data: T, state: any, next: Handler<T>) => void
  ) { }

  /** @inheritdoc */
  public handle(handler: Handler<T>, paused = false): Subscription {
    let activeHandler: Handler<T>;

    if (this.currentHandler !== undefined) {

      /**
       * The handler reference to store.
       * @param data The input data to the handler.
       */
      activeHandler = (data: T): void => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.currentHandler!(data, this.state, handler);
      };
    } else {
      activeHandler = handler;
    }

    let activeSubArray = this.activeSubs.get(handler);
    if (!activeSubArray) {
      activeSubArray = [];
      this.activeSubs.set(handler, activeSubArray);
    }

    const onDestroyed = (destroyed: ConsumerSubscription): void => {
      const activeSubsArray = this.activeSubs.get(handler);
      if (activeSubsArray) {
        activeSubsArray.splice(activeSubsArray.indexOf(destroyed), 1);
        if (activeSubsArray.length === 0) {
          this.activeSubs.delete(handler);
        }
      }
    };

    const sub = new ConsumerSubscription(this.subscribe(activeHandler, paused), onDestroyed);

    // Need to handle the case where the subscription is destroyed immediately
    if (sub.isAlive) {
      activeSubArray.push(sub);
    } else if (activeSubArray.length === 0) {
      this.activeSubs.delete(handler);
    }

    return sub;
  }

  /** @inheritdoc */
  public off(handler: Handler<T>): void {
    const activeSubArray = this.activeSubs.get(handler);
    if (activeSubArray) {
      activeSubArray.shift()?.destroy();

      if (activeSubArray.length === 0) {
        this.activeSubs.delete(handler);
      }
    }
  }

  /** @inheritdoc */
  public atFrequency(frequency: number, immediateFirstPublish = true): Consumer<T> {
    const initialState = {
      previousTime: Date.now(),
      firstRun: immediateFirstPublish
    };

    return new BasicConsumer<T>(this.subscribe, initialState, this.getAtFrequencyHandler(frequency));
  }

  /**
   * Gets a handler function for a 'atFrequency' filter.
   * @param frequency The frequency, in Hz, to cap to.
   * @returns A handler function for a 'atFrequency' filter.
   */
  private getAtFrequencyHandler(frequency: number): (data: any, state: any, next: Handler<T>) => void {
    const deltaTimeTrigger = 1000 / frequency;

    return (data, state, next): void => {
      const currentTime = Date.now();
      const deltaTime = currentTime - state.previousTime;

      if (deltaTimeTrigger <= deltaTime || state.firstRun) {
        while ((state.previousTime + deltaTimeTrigger) < currentTime) {
          state.previousTime += deltaTimeTrigger;
        }

        if (state.firstRun) {
          state.firstRun = false;
        }

        this.with(data, next);
      }
    };
  }

  /** @inheritdoc */
  public withPrecision(precision: number): Consumer<T> {
    return new BasicConsumer<T>(this.subscribe, { lastValue: 0 }, this.getWithPrecisionHandler(precision));
  }

  /**
   * Gets a handler function for a 'withPrecision' filter.
   * @param precision The decimal precision to snap to.
   * @returns A handler function for a 'withPrecision' filter.
   */
  private getWithPrecisionHandler(precision: number): (data: any, state: any, next: Handler<T>) => void {
    return (data, state, next): void => {
      const dataValue = (data as unknown) as number;
      const multiplier = Math.pow(10, precision);

      const currentValueAtPrecision = Math.round(dataValue * multiplier) / multiplier;
      if (currentValueAtPrecision !== state.lastValue) {
        state.lastValue = currentValueAtPrecision;

        this.with((currentValueAtPrecision as unknown) as T, next);
      }
    };
  }

  /** @inheritdoc */
  public whenChangedBy(amount: number): Consumer<T> {
    return new BasicConsumer<T>(this.subscribe, { lastValue: 0 }, this.getWhenChangedByHandler(amount));
  }

  /**
   * Gets a handler function for a 'whenChangedBy' filter.
   * @param amount The minimum amount threshold below which the consumer will not consume.
   * @returns A handler function for a 'whenChangedBy' filter.
   */
  private getWhenChangedByHandler(amount: number): (data: any, state: any, next: Handler<T>) => void {
    return (data, state, next): void => {
      const dataValue = (data as unknown) as number;
      const diff = Math.abs(dataValue - state.lastValue);

      if (diff >= amount) {
        state.lastValue = dataValue;
        this.with(data, next);
      }
    };
  }

  /** @inheritdoc */
  public whenChanged(): Consumer<T> {
    return new BasicConsumer<T>(this.subscribe, { lastValue: '' }, this.getWhenChangedHandler());
  }

  /**
   * Gets a handler function for a 'whenChanged' filter.
   * @returns A handler function for a 'whenChanged' filter.
   */
  private getWhenChangedHandler(): (data: any, state: any, next: Handler<T>) => void {
    return (data, state, next): void => {
      if (state.lastValue !== data) {
        state.lastValue = data;
        this.with(data, next);
      }
    };
  }

  /** @inheritdoc */
  public onlyAfter(deltaTime: number): Consumer<T> {
    return new BasicConsumer<T>(this.subscribe, { previousTime: Date.now() }, this.getOnlyAfterHandler(deltaTime));
  }

  /**
   * Gets a handler function for an 'onlyAfter' filter.
   * @param deltaTime The minimum delta time between events.
   * @returns A handler function for an 'onlyAfter' filter.
   */
  private getOnlyAfterHandler(deltaTime: number): (data: any, state: any, next: Handler<T>) => void {
    return (data, state, next): void => {
      const currentTime = Date.now();
      const timeDiff = currentTime - state.previousTime;

      if (timeDiff > deltaTime) {
        state.previousTime += deltaTime;
        this.with(data, next);
      }
    };
  }

  /**
   * Builds a handler stack from the current handler.
   * @param data The data to send in to the handler.
   * @param handler The handler to use for processing.
   */
  private with(data: T, handler: Handler<T>): void {
    if (this.currentHandler !== undefined) {
      this.currentHandler(data, this.state, handler);
    } else {
      handler(data);
    }
  }
}

/**
 * A {@link Subscription} for a {@link BasicConsumer}.
 */
class ConsumerSubscription implements Subscription {
  /** @inheritdoc */
  public get isAlive(): boolean {
    return this.sub.isAlive;
  }

  /** @inheritdoc */
  public get isPaused(): boolean {
    return this.sub.isPaused;
  }

  /** @inheritdoc */
  public get canInitialNotify(): boolean {
    return this.sub.canInitialNotify;
  }

  /**
   * Constructor.
   * @param sub The event bus subscription backing this subscription.
   * @param onDestroy A function which is called when this subscription is destroyed.
   */
  constructor(
    private readonly sub: Subscription,
    private readonly onDestroy: (sub: ConsumerSubscription) => void
  ) {
  }

  /** @inheritdoc */
  public pause(): void {
    this.sub.pause();
  }

  /** @inheritdoc */
  public resume(initialNotify = false): void {
    this.sub.resume(initialNotify);
  }

  /** @inheritdoc */
  public destroy(): void {
    this.sub.destroy();

    this.onDestroy(this);
  }
}