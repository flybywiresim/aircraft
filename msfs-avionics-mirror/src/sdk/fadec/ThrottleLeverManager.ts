import { ConsumerSubject, EventBus, IndexedEventType, KeyEventData, KeyEvents, KeyInterceptManager } from '../data';

/**
 * Virtual throttle lever events.
 */
export interface VirtualThrottleLeverEvents {
  /** The position of an indexed virtual throttle lever. Ranges from 0 to 1. */
  [v_throttle_lever_pos: IndexedEventType<'v_throttle_lever_pos'>]: number;
}

/**
 * A manager for virtual throttle levers. Intercepts key events that control engine throttle settings and uses them
 * to move virtual throttle levers instead. The positions of the virtual throttle levers are published on the event
 * bus.
 */
export class ThrottleLeverManager {
  private static readonly THROTTLE_COUNT = 4;

  private static readonly RAW_MIN = -16384;
  private static readonly RAW_MAX = 16384;
  private static readonly RAW_RANGE = ThrottleLeverManager.RAW_MAX - ThrottleLeverManager.RAW_MIN;
  private static readonly RAW_STEP = 256;

  private keyInterceptManager?: KeyInterceptManager;

  private readonly throttleLeverRawPositions: number[] = Array.from({ length: ThrottleLeverManager.THROTTLE_COUNT }, () => 0);

  /**
   * Constructor.
   * @param bus The event bus.
   * @param onInitCallback A callback function to be executed once this manager is initialized.
   */
  constructor(private readonly bus: EventBus, onInitCallback?: () => void) {
    const sub = bus.getSubscriber<VirtualThrottleLeverEvents & KeyEvents>();

    const virtualPositions = this.throttleLeverRawPositions.map((value, index) => {
      return ConsumerSubject.create(sub.on(`v_throttle_lever_pos_${index + 1}`), NaN);
    });

    KeyInterceptManager.getManager(bus).then(manager => {
      for (let i = 0; i < this.throttleLeverRawPositions.length; i++) {
        // Initialize position to the pre-existing virtual lever position, if available. Otherwise, initialize to the
        // engine throttle lever position simvar.

        const virtualPosition = virtualPositions[i].get();
        const initialPosition = isNaN(virtualPosition)
          ? Utils.Clamp(SimVar.GetSimVarValue(`GENERAL ENG THROTTLE LEVER POSITION:${i + 1}`, 'Percent') / 100, 0, 1)
          : virtualPosition;

        virtualPositions[i].destroy();

        this.throttleLeverRawPositions[i] = ThrottleLeverManager.RAW_MIN + initialPosition * ThrottleLeverManager.RAW_RANGE;
        this.publishThrottleLeverPosition(initialPosition, i + 1);
      }

      this.keyInterceptManager = manager;

      manager.interceptKey('AXIS_THROTTLE_SET', false);
      manager.interceptKey('AXIS_THROTTLE1_SET', false);
      manager.interceptKey('AXIS_THROTTLE2_SET', false);
      manager.interceptKey('AXIS_THROTTLE3_SET', false);
      manager.interceptKey('AXIS_THROTTLE4_SET', false);

      manager.interceptKey('THROTTLE_AXIS_SET_EX1', false);
      manager.interceptKey('THROTTLE1_AXIS_SET_EX1', false);
      manager.interceptKey('THROTTLE2_AXIS_SET_EX1', false);
      manager.interceptKey('THROTTLE3_AXIS_SET_EX1', false);
      manager.interceptKey('THROTTLE4_AXIS_SET_EX1', false);

      manager.interceptKey('THROTTLE_SET', false);
      manager.interceptKey('THROTTLE1_SET', false);
      manager.interceptKey('THROTTLE2_SET', false);
      manager.interceptKey('THROTTLE3_SET', false);
      manager.interceptKey('THROTTLE4_SET', false);

      manager.interceptKey('THROTTLE_FULL', false);
      manager.interceptKey('THROTTLE1_FULL', false);
      manager.interceptKey('THROTTLE2_FULL', false);
      manager.interceptKey('THROTTLE3_FULL', false);
      manager.interceptKey('THROTTLE4_FULL', false);

      manager.interceptKey('THROTTLE_INCR', false);
      manager.interceptKey('THROTTLE1_INCR', false);
      manager.interceptKey('THROTTLE2_INCR', false);
      manager.interceptKey('THROTTLE3_INCR', false);
      manager.interceptKey('THROTTLE4_INCR', false);

      manager.interceptKey('THROTTLE_DECR', false);
      manager.interceptKey('THROTTLE1_DECR', false);
      manager.interceptKey('THROTTLE2_DECR', false);
      manager.interceptKey('THROTTLE3_DECR', false);
      manager.interceptKey('THROTTLE4_DECR', false);

      manager.interceptKey('THROTTLE_CUT', false);
      manager.interceptKey('THROTTLE1_CUT', false);
      manager.interceptKey('THROTTLE2_CUT', false);
      manager.interceptKey('THROTTLE3_CUT', false);
      manager.interceptKey('THROTTLE4_CUT', false);

      manager.interceptKey('INCREASE_THROTTLE', false);
      manager.interceptKey('DECREASE_THROTTLE', false);

      manager.interceptKey('THROTTLE_10', false);
      manager.interceptKey('THROTTLE_20', false);
      manager.interceptKey('THROTTLE_30', false);
      manager.interceptKey('THROTTLE_40', false);
      manager.interceptKey('THROTTLE_50', false);
      manager.interceptKey('THROTTLE_60', false);
      manager.interceptKey('THROTTLE_70', false);
      manager.interceptKey('THROTTLE_80', false);
      manager.interceptKey('THROTTLE_90', false);

      sub.on('key_intercept').handle(this.onKeyIntercepted.bind(this));

      onInitCallback && onInitCallback();
    });
  }

  /**
   * Responds to key intercept events.
   * @param data The event data.
   * @param data.key The key that was intercepted.
   * @param data.value The value of the intercepted key event.
   */
  private onKeyIntercepted({ key, value }: KeyEventData): void {
    switch (key) {
      case 'AXIS_THROTTLE_SET':
      case 'THROTTLE_AXIS_SET_EX1':
        if (value !== undefined) {
          this.setRawThrottleLeverPosition(value);
        }
        break;
      case 'AXIS_THROTTLE1_SET':
      case 'THROTTLE1_AXIS_SET_EX1':
        if (value !== undefined) {
          this.setRawThrottleLeverPosition(value, 1);
        }
        break;
      case 'AXIS_THROTTLE2_SET':
      case 'THROTTLE2_AXIS_SET_EX1':
        if (value !== undefined) {
          this.setRawThrottleLeverPosition(value, 2);
        }
        break;
      case 'AXIS_THROTTLE3_SET':
      case 'THROTTLE3_AXIS_SET_EX1':
        if (value !== undefined) {
          this.setRawThrottleLeverPosition(value, 3);
        }
        break;
      case 'AXIS_THROTTLE4_SET':
      case 'THROTTLE4_AXIS_SET_EX1':
        if (value !== undefined) {
          this.setRawThrottleLeverPosition(value, 4);
        }
        break;
      case 'THROTTLE_SET':
        if (value !== undefined) {
          this.setRawThrottleLeverPosition(value * 2 - ThrottleLeverManager.RAW_MAX);
        }
        break;
      case 'THROTTLE1_SET':
        if (value !== undefined) {
          this.setRawThrottleLeverPosition(value * 2 - ThrottleLeverManager.RAW_MAX, 1);
        }
        break;
      case 'THROTTLE2_SET':
        if (value !== undefined) {
          this.setRawThrottleLeverPosition(value * 2 - ThrottleLeverManager.RAW_MAX, 2);
        }
        break;
      case 'THROTTLE3_SET':
        if (value !== undefined) {
          this.setRawThrottleLeverPosition(value * 2 - ThrottleLeverManager.RAW_MAX, 3);
        }
        break;
      case 'THROTTLE4_SET':
        if (value !== undefined) {
          this.setRawThrottleLeverPosition(value * 2 - ThrottleLeverManager.RAW_MAX, 4);
        }
        break;
      case 'THROTTLE_FULL':
        this.setRawThrottleLeverPosition(ThrottleLeverManager.RAW_MAX);
        break;
      case 'THROTTLE1_FULL':
        this.setRawThrottleLeverPosition(ThrottleLeverManager.RAW_MAX, 1);
        break;
      case 'THROTTLE2_FULL':
        this.setRawThrottleLeverPosition(ThrottleLeverManager.RAW_MAX, 2);
        break;
      case 'THROTTLE3_FULL':
        this.setRawThrottleLeverPosition(ThrottleLeverManager.RAW_MAX, 3);
        break;
      case 'THROTTLE4_FULL':
        this.setRawThrottleLeverPosition(ThrottleLeverManager.RAW_MAX, 4);
        break;
      case 'THROTTLE_CUT':
        this.setRawThrottleLeverPosition(ThrottleLeverManager.RAW_MIN);
        break;
      case 'THROTTLE1_CUT':
        this.setRawThrottleLeverPosition(ThrottleLeverManager.RAW_MIN, 1);
        break;
      case 'THROTTLE2_CUT':
        this.setRawThrottleLeverPosition(ThrottleLeverManager.RAW_MIN, 2);
        break;
      case 'THROTTLE3_CUT':
        this.setRawThrottleLeverPosition(ThrottleLeverManager.RAW_MIN, 3);
        break;
      case 'THROTTLE4_CUT':
        this.setRawThrottleLeverPosition(ThrottleLeverManager.RAW_MIN, 4);
        break;
      case 'THROTTLE_INCR':
      case 'INCREASE_THROTTLE':
        for (let i = 1; i < ThrottleLeverManager.THROTTLE_COUNT + 1; i++) {
          this.setRawThrottleLeverPosition(this.throttleLeverRawPositions[i - 1] + ThrottleLeverManager.RAW_STEP, i);
        }
        break;
      case 'THROTTLE1_INCR':
        this.setRawThrottleLeverPosition(this.throttleLeverRawPositions[0] + ThrottleLeverManager.RAW_STEP, 1);
        break;
      case 'THROTTLE2_INCR':
        this.setRawThrottleLeverPosition(this.throttleLeverRawPositions[1] + ThrottleLeverManager.RAW_STEP, 2);
        break;
      case 'THROTTLE3_INCR':
        this.setRawThrottleLeverPosition(this.throttleLeverRawPositions[2] + ThrottleLeverManager.RAW_STEP, 3);
        break;
      case 'THROTTLE4_INCR':
        this.setRawThrottleLeverPosition(this.throttleLeverRawPositions[3] + ThrottleLeverManager.RAW_STEP, 4);
        break;
      case 'THROTTLE_DECR':
      case 'DECREASE_THROTTLE':
        for (let i = 1; i < ThrottleLeverManager.THROTTLE_COUNT + 1; i++) {
          this.setRawThrottleLeverPosition(this.throttleLeverRawPositions[i - 1] - ThrottleLeverManager.RAW_STEP, i);
        }
        break;
      case 'THROTTLE1_DECR':
        this.setRawThrottleLeverPosition(this.throttleLeverRawPositions[0] - ThrottleLeverManager.RAW_STEP, 1);
        break;
      case 'THROTTLE2_DECR':
        this.setRawThrottleLeverPosition(this.throttleLeverRawPositions[1] - ThrottleLeverManager.RAW_STEP, 2);
        break;
      case 'THROTTLE3_DECR':
        this.setRawThrottleLeverPosition(this.throttleLeverRawPositions[2] - ThrottleLeverManager.RAW_STEP, 3);
        break;
      case 'THROTTLE4_DECR':
        this.setRawThrottleLeverPosition(this.throttleLeverRawPositions[3] - ThrottleLeverManager.RAW_STEP, 4);
        break;
      case 'THROTTLE_10':
        this.setRawThrottleLeverPosition(ThrottleLeverManager.RAW_MIN + ThrottleLeverManager.RAW_RANGE * 0.1);
        break;
      case 'THROTTLE_20':
        this.setRawThrottleLeverPosition(ThrottleLeverManager.RAW_MIN + ThrottleLeverManager.RAW_RANGE * 0.2);
        break;
      case 'THROTTLE_30':
        this.setRawThrottleLeverPosition(ThrottleLeverManager.RAW_MIN + ThrottleLeverManager.RAW_RANGE * 0.3);
        break;
      case 'THROTTLE_40':
        this.setRawThrottleLeverPosition(ThrottleLeverManager.RAW_MIN + ThrottleLeverManager.RAW_RANGE * 0.4);
        break;
      case 'THROTTLE_50':
        this.setRawThrottleLeverPosition(ThrottleLeverManager.RAW_MIN + ThrottleLeverManager.RAW_RANGE * 0.5);
        break;
      case 'THROTTLE_60':
        this.setRawThrottleLeverPosition(ThrottleLeverManager.RAW_MIN + ThrottleLeverManager.RAW_RANGE * 0.6);
        break;
      case 'THROTTLE_70':
        this.setRawThrottleLeverPosition(ThrottleLeverManager.RAW_MIN + ThrottleLeverManager.RAW_RANGE * 0.7);
        break;
      case 'THROTTLE_80':
        this.setRawThrottleLeverPosition(ThrottleLeverManager.RAW_MIN + ThrottleLeverManager.RAW_RANGE * 0.8);
        break;
      case 'THROTTLE_90':
        this.setRawThrottleLeverPosition(ThrottleLeverManager.RAW_MIN + ThrottleLeverManager.RAW_RANGE * 0.9);
        break;
    }
  }

  /**
   * Sets the raw throttle lever position.
   * @param rawPosition The raw position to set.
   * @param index The index of the throttle lever to set. If undefined, the positions of all throttle levers will be
   * set.
   */
  private setRawThrottleLeverPosition(rawPosition: number, index?: number): void {
    rawPosition = Utils.Clamp(rawPosition, ThrottleLeverManager.RAW_MIN, ThrottleLeverManager.RAW_MAX);

    for (let i = index ?? 1; i < (index ?? ThrottleLeverManager.THROTTLE_COUNT) + 1; i++) {
      this.throttleLeverRawPositions[i - 1] = rawPosition;
    }

    this.publishThrottleLeverPosition((rawPosition - ThrottleLeverManager.RAW_MIN) / ThrottleLeverManager.RAW_RANGE, index);
  }

  /**
   * Publishes a virtual throttle lever position.
   * @param position The position to publish.
   * @param index The index of the throttle lever for which to publish. If undefined, positions will be published for
   * all throttle levers.
   */
  private publishThrottleLeverPosition(position: number, index?: number): void {
    for (let i = index ?? 1; i < (index ?? ThrottleLeverManager.THROTTLE_COUNT) + 1; i++) {
      this.bus.pub(`v_throttle_lever_pos_${i}`, position, true, true);
    }
  }
}