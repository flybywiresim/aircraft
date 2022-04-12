import { Wait } from '..';
import { EventBus } from './EventBus';

/**
 * Key intercept event data.
 */
export type KeyEventData = {
  /** The key. */
  key: string;

  /** The index of the key event. */
  index?: number;

  /** The value of the key event. */
  value?: number;
}

/**
 * Key events.
 */
export type KeyEvents = {
  /** A key intercept event. */
  key_intercept: KeyEventData;
}

/**
 * A manager for key intercepts. Allows key events to be intercepted and publishes intercepted key events on the event
 * bus.
 */
export class KeyInterceptManager {
  private static INSTANCE?: KeyInterceptManager;
  private static isCreatingInstance = false;
  private static readonly pendingPromiseResolves: ((value: KeyInterceptManager) => void)[] = [];

  /**
   * Constructor.
   * @param keyListener The Coherent key intercept view listener.
   * @param bus The event bus.
   */
  private constructor(private readonly keyListener: ViewListener.ViewListener, private readonly bus: EventBus) {
    Coherent.on('keyIntercepted', this.onKeyIntercepted.bind(this));
  }

  /**
   * Responds to key intercept events.
   * @param key The key that was intercepted.
   * @param index The index of the key event.
   * @param value The value of the key event.
   */
  private onKeyIntercepted(key: string, index?: number, value?: number): void {
    this.bus.pub('key_intercept', { key, index, value }, false, false);
  }

  /**
   * Enables interception for a key.
   * @param key The key to intercept.
   * @param passThrough Whether to pass the event through to the sim after it has been intercepted.
   */
  public interceptKey(key: string, passThrough: boolean): void {
    Coherent.call('INTERCEPT_KEY_EVENT', key, passThrough ? 0 : 1);
  }

  /**
   * Gets an instance of KeyInterceptManager. If an instance does not already exist, a new one will be created.
   * @param bus The event bus.
   * @returns A Promise which will be fulfilled with an instance of KeyInterceptManager.
   */
  public static getManager(bus: EventBus): Promise<KeyInterceptManager> {
    if (KeyInterceptManager.INSTANCE) {
      return Promise.resolve(KeyInterceptManager.INSTANCE);
    }

    if (!KeyInterceptManager.isCreatingInstance) {
      KeyInterceptManager.createInstance(bus);
    }

    return new Promise(resolve => {
      KeyInterceptManager.pendingPromiseResolves.push(resolve);
    });
  }

  /**
   * Creates an instance of KeyInterceptManager and fulfills all pending Promises to get the manager instance once
   * the instance is created.
   * @param bus The event bus.
   */
  private static async createInstance(bus: EventBus): Promise<void> {
    KeyInterceptManager.isCreatingInstance = true;
    KeyInterceptManager.INSTANCE = await KeyInterceptManager.create(bus);
    KeyInterceptManager.isCreatingInstance = false;

    for (let i = 0; i < KeyInterceptManager.pendingPromiseResolves.length; i++) {
      KeyInterceptManager.pendingPromiseResolves[i](KeyInterceptManager.INSTANCE);
    }
  }

  /**
   * Creates an instance of KeyInterceptManager.
   * @param bus The event bus.
   * @returns A Promise which is fulfilled with a new instance of KeyInterceptManager after it has been created.
   */
  private static async create(bus: EventBus): Promise<KeyInterceptManager> {
    // HINT: we do this purely to try avoid the weird CTD
    await Wait.awaitDelay(3000);

    return new Promise(resolve => {
      const keyListener = RegisterViewListener('JS_LISTENER_KEYEVENT', () => {
        resolve(new KeyInterceptManager(keyListener, bus));
      });
    });
  }
}