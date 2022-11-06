import { Subscription } from './Subscription';

/**
 * A {@link Subscription} which executes a handler function every time it receives a notification.
 */
export class HandlerSubscription<HandlerType extends (...args: any[]) => void> implements Subscription {
  private _isAlive = true;
  /** @inheritdoc */
  public get isAlive(): boolean {
    return this._isAlive;
  }

  private _isPaused = false;
  /** @inheritdoc */
  public get isPaused(): boolean {
    return this._isPaused;
  }

  /** @inheritdoc */
  public readonly canInitialNotify: boolean;

  /**
   * Constructor.
   * @param handler This subscription's handler. The handler will be called each time this subscription receives a
   * notification from its source.
   * @param initialNotifyFunc A function which sends initial notifications to this subscription. If not defined, this
   * subscription will not support initial notifications.
   * @param onDestroy A function which is called when this subscription is destroyed.
   */
  constructor(
    public readonly handler: HandlerType,
    private readonly initialNotifyFunc?: (sub: HandlerSubscription<HandlerType>) => void,
    private readonly onDestroy?: (sub: HandlerSubscription<HandlerType>) => void
  ) {
    this.canInitialNotify = initialNotifyFunc !== undefined;
  }

  /**
   * Sends an initial notification to this subscription.
   * @throws Error if this subscription is not alive.
   */
  public initialNotify(): void {
    if (!this._isAlive) {
      throw new Error('HandlerSubscription: cannot notify a dead Subscription.');
    }

    this.initialNotifyFunc && this.initialNotifyFunc(this);
  }

  /** @inheritdoc */
  public pause(): void {
    if (!this._isAlive) {
      throw new Error('Subscription: cannot pause a dead Subscription.');
    }

    this._isPaused = true;
  }

  /** @inheritdoc */
  public resume(initialNotify = false): void {
    if (!this._isAlive) {
      throw new Error('Subscription: cannot resume a dead Subscription.');
    }

    if (!this._isPaused) {
      return;
    }

    this._isPaused = false;

    if (initialNotify) {
      this.initialNotify();
    }
  }

  /** @inheritdoc */
  public destroy(): void {
    if (!this._isAlive) {
      return;
    }

    this._isAlive = false;
    this.onDestroy && this.onDestroy(this);
  }
}