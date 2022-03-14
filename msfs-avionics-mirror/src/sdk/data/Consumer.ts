import { EventBus, Handler } from './EventBus';

/**
 * An event bus consumer for a specific topic.
 */
export class Consumer<T> {

  /**
   * Creates an instance of a Consumer.
   * @param bus The event bus to subscribe to.
   * @param topic The topic of the subscription.
   * @param state The state for the consumer to track.
   * @param currentHandler The current build filter handler stack, if any.
   */
  constructor(private bus: EventBus,
    private topic: string,

    private state: any = {},
    private currentHandler?: (data: T, state: any, next: Handler<T>) => void) { }

  private handlerReference?: Handler<T>;

  /**
   * Handles an event using the provided event handler.
   * @param handler The event handler for the event.
   */
  public handle(handler: Handler<T>): void {
    if (this.currentHandler !== undefined) {

      /**
       * The handler reference to store.
       * @param data The input data to the handler.
       */
      this.handlerReference = (data): void => {
        if (this.currentHandler !== undefined) {
          this.currentHandler(data, this.state, handler);
        }
      };

      this.bus.on(this.topic, this.handlerReference);
    } else {
      this.bus.on(this.topic, handler);
    }
  }

  /**
   * Disables handling of the event.
   * @param handler The handler to disable.
   */
  public off(handler: Handler<T>): void {
    if (this.handlerReference !== undefined) {
      this.bus.off(this.topic, this.handlerReference);
    } else {
      this.bus.off(this.topic, handler);
    }
  }

  /**
   * Caps the event subscription to a specified frequency, in Hz.
   * @param frequency The frequency, in Hz, to cap to.
   * @returns A new consumer with the applied frequency filter.
   */
  public atFrequency(frequency: number): Consumer<T> {
    const deltaTimeTrigger = 1000 / frequency;

    return new Consumer<T>(this.bus, this.topic, { previousTime: Date.now() }, (data, state, next) => {
      const currentTime = Date.now();
      const deltaTime = currentTime - state.previousTime;

      if (deltaTimeTrigger <= deltaTime) {
        while ((state.previousTime + deltaTimeTrigger) < currentTime) {
          state.previousTime += deltaTimeTrigger;
        }

        this.with(data, next);
      }
    });
  }

  /**
   * Quantizes the numerical event data to consume only at the specified decimal precision.
   * @param precision The decimal precision to snap to.
   * @returns A new consumer with the applied precision filter.
   */
  public withPrecision(precision: number): Consumer<T> {
    return new Consumer<T>(this.bus, this.topic, { lastValue: 0 }, (data, state, next) => {
      const dataValue = (data as unknown) as number;
      const multiplier = Math.pow(10, precision);

      const currentValueAtPrecision = Math.round(dataValue * multiplier) / multiplier;
      if (currentValueAtPrecision !== state.lastValue) {
        state.lastValue = currentValueAtPrecision;

        this.with((currentValueAtPrecision as unknown) as T, next);
      }
    });
  }

  /**
   * Quantizes the Arinc429 event data to consume only at the specified decimal precision.
   * @param precision The decimal precision to snap to.
   * @returns A new consumer with the applied precision filter.
   */
   public withArinc429Precision(precision: number): Consumer<T> {
      return new Consumer<T>(this.bus, this.topic, { lastValue: 0 }, (data, state, next) => {
          const dataValue = (data as any).value;
          const multiplier = Math.pow(10, precision);

          const currentValueAtPrecision = Math.round(dataValue * multiplier) / multiplier;
          if (currentValueAtPrecision !== state.lastValue
                || state.hasNormalOps !== (data as any).isNormalOperation()
                || state.isNoComputedData !== (data as any).isNoComputedData()
                || state.isFailureWarning !== (data as any).isFailureWarning()) {
              state.lastValue = currentValueAtPrecision;
              state.hasNormalOps = (data as any).isNormalOperation();
              state.isNoComputedData = (data as any).isNoComputedData();
              state.isFailureWarning = (data as any).isFailureWarning();
              this.with(data, next);
          }
      });
  }

  /**
   * Filter the subscription to consume only when the value has changed by a minimum amount.
   * @param amount The minimum amount threshold below which the consumer will not consume.
   * @returns A new consumer with the applied change threshold filter.
   */
  public whenChangedBy(amount: number): Consumer<T> {
    return new Consumer<T>(this.bus, this.topic, { lastValue: 0 }, (data, state, next) => {
      const dataValue = (data as unknown) as number;
      const diff = Math.abs(dataValue - state.lastValue);

      if (diff >= amount) {
        state.lastValue = dataValue;
        this.with(data, next);
      }
    });
  }

  /**
   * Filter the subscription to consume only if the value has changed. At all.  Really only
   * useful for strings or other events that don't change much.
   * @returns A new consumer with the applied change threshold filter.
   */
  public whenChanged(): Consumer<T> {
    return new Consumer<T>(this.bus, this.topic, { lastValue: '' }, (data, state, next) => {
      if (state.lastValue !== data) {
        state.lastValue = data;
        this.with(data, next);
      }
    });
  }

  /**
   * Filters events by time such that events will not be consumed until a minimum duration
   * has passed since the previous event.
   * @param deltaTime The minimum delta time between events.
   * @returns A new consumer with the applied change threshold filter.
   */
  public onlyAfter(deltaTime: number): Consumer<T> {
    return new Consumer<T>(this.bus, this.topic, { previousTime: Date.now() }, (data, state, next) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - state.previousTime;

      if (timeDiff > deltaTime) {
        state.previousTime += deltaTime;
        this.with(data, next);
      }
    });
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
