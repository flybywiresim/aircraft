import { ConsumerSubject, EventBus, SimVarValueType } from '../data';
import { ClockEvents } from '../instruments';

/**
 * A control mode used by a jet FADEC.
 */
export interface JetFadecMode {
  /** The name of this mode. */
  readonly name: string;

  /**
   * Checks whether the FADEC should enter this mode for a specified engine.
   * @param index The index of the engine.
   * @param throttleLeverPos The virtual position of the throttle lever, in the range of 0 - 1.
   * @param throttle The current engine throttle setting, in the range of 0 - 1.
   * @param thrust The current net thrust delivered by the engine, in pounds.
   * @param n1 The current N1 value of the engine, in percent.
   * @param n1Corrected The current corrected N1 value of the engine, in percent.
   * @returns Whether the FADEC should enter this mode for the specified engine.
   */
  accept(index: number, throttleLeverPos: number, throttle: number, thrust: number, n1: number, n1Corrected: number): boolean;

  /**
   * Computes the desired engine throttle setting.
   * @param index The index of the engine.
   * @param throttleLeverPos The virtual position of the throttle lever, in the range of 0 - 1.
   * @param throttle The current engine throttle setting, in the range of 0 - 1.
   * @param thrust The current net thrust delivered by the engine, in pounds.
   * @param n1 The current N1 value of the engine, in percent.
   * @param n1Corrected The current corrected N1 value of the engine, in percent.
   * @param dt The elapsed time since the last FADEC update, in milliseconds.
   * @returns The desired engine throttle setting, in the range of 0 - 1.
   */
  computeDesiredThrottle(index: number, throttleLeverPos: number, throttle: number, thrust: number, n1: number, n1Corrected: number, dt: number): number;

  /**
   * Gets the visible position of the throttle lever for a specified engine.
   * @param index The index of the engine.
   * @param throttleLeverPos The virtual position of the throttle lever, in the range of 0 - 1.
   * @returns The visible position of the throttle lever, in the range of 0 - 1.
   */
  getVisibleThrottlePos(index: number, throttleLeverPos: number): number;
}

/**
 * Information for a throttle controlled by a jet FADEC.
 */
export type JetFadecThrottleInfo = {
  /** The index of the engine controlled by the throttle. */
  index: number;

  /** The event bus topic that emits the throttle's virtual lever position. */
  leverPosTopic: string;

  /** The name of the SimVar controlling the throttle's visible lever position. */
  visiblePosSimVar: string;
};

/**
 * A FADEC for turbojets. Controls engine throttle based on throttle lever position and other inputs.
 */
export class JetFadec {
  protected readonly throttleLeverPositionSubs: readonly ConsumerSubject<number>[];

  private readonly updateHandler = this.update.bind(this);
  private readonly realTimeSub = ConsumerSubject.create(this.bus.getSubscriber<ClockEvents>().on('realTime'), 0);
  private updateTimer: NodeJS.Timeout | null = null;
  private lastUpdateTime = 0;

  protected readonly lastModes: (JetFadecMode | null)[] = this.throttleInfos.map(() => null);

  /**
   * Constructor.
   * @param bus The event bus.
   * @param modes The modes supported by this FADEC, ordered from highest to lowest priority.
   * @param throttleInfos An array containing information pertaining to the throttles controlled by this FADEC. The
   * order of modes in the array determines their priority during mode selection. On every update cycle, the FADEC
   * iterates through the modes array in order, calling `accept()` on each mode until a value of `true` is returned.
   * Therefore, modes positioned earlier in the array have a higher priority for selection.
   */
  constructor(
    protected readonly bus: EventBus,
    protected readonly modes: readonly JetFadecMode[],
    protected readonly throttleInfos: readonly JetFadecThrottleInfo[]
  ) {
    const sub = this.bus.getSubscriber<any>();

    this.throttleLeverPositionSubs = throttleInfos.map(info => {
      return ConsumerSubject.create(sub.on(info.leverPosTopic), 0);
    });
  }

  /**
   * Turns this FADEC on. If this FADEC is already running, then it will be turned off before turning on again with
   * the specified frequency.
   * @param frequency The frequency, in hertz, at which this FADEC will update.
   */
  public start(frequency: number): void {
    this.stop();

    this.bus.pub('fadec_active', true, true, true);

    this.updateTimer = setInterval(this.updateHandler, 1000 / frequency);
  }

  /**
   * Turns this FADEC off.
   */
  public stop(): void {
    if (this.updateTimer === null) {
      return;
    }

    clearInterval(this.updateTimer);
    this.updateTimer = null;

    for (let i = 0; i < this.throttleInfos.length; i++) {
      this.setMode(i, null);
    }

    this.bus.pub('fadec_active', false, true, true);
  }

  /**
   * Updates this FADEC.
   */
  private update(): void {
    const realTime = Date.now();

    // Check if the current time has diverged from the event bus value by more than 1 second.
    // If it has, we are probably paused in the menu and should skip the update.
    if (realTime - this.realTimeSub.get() >= 1000) {
      return;
    }

    const dt = realTime - this.lastUpdateTime;

    this.onUpdate(dt);

    this.lastUpdateTime = realTime;
  }

  /**
   * This method.
   * @param dt The elapsed time, in milliseconds, since the last update.
   */
  protected onUpdate(dt: number): void {
    for (let i = 0; i < this.throttleInfos.length; i++) {
      this.updateThrottle(i, dt);
    }
  }

  /**
   * Updates a throttle.
   * @param index The index of the throttle in this FADEC's throttle list.
   * @param dt The elapsed time, in milliseconds, since the last update.
   */
  protected updateThrottle(index: number, dt: number): void {
    const info = this.throttleInfos[index];
    const throttleLeverPos = this.throttleLeverPositionSubs[index].get();
    const throttle = SimVar.GetSimVarValue(`GENERAL ENG THROTTLE LEVER POSITION:${info.index}`, SimVarValueType.Percent) / 100;
    const thrust = SimVar.GetSimVarValue(`TURB ENG JET THRUST:${info.index}`, SimVarValueType.Pounds);
    const n1 = SimVar.GetSimVarValue(`TURB ENG N1:${info.index}`, SimVarValueType.Percent);
    const n1Corrected = SimVar.GetSimVarValue(`TURB ENG CORRECTED N1:${info.index}`, SimVarValueType.Percent);

    let desiredThrottle = throttleLeverPos;
    let visibleThrottlePos = throttleLeverPos;

    for (let i = 0; i < this.modes.length; i++) {
      const mode = this.modes[i];

      if (mode.accept(info.index, throttleLeverPos, throttle, thrust, n1, n1Corrected)) {
        this.setMode(index, mode);
        desiredThrottle = mode.computeDesiredThrottle(info.index, throttleLeverPos, throttle, thrust, n1, n1Corrected, dt);
        visibleThrottlePos = mode.getVisibleThrottlePos(info.index, throttleLeverPos);
        break;
      }
    }

    SimVar.SetSimVarValue(`GENERAL ENG THROTTLE LEVER POSITION:${info.index}`, SimVarValueType.Percent, Utils.Clamp(desiredThrottle * 100, 0, 100));
    SimVar.SetSimVarValue(info.visiblePosSimVar, 'number', Utils.Clamp(visibleThrottlePos, 0, 1));
  }

  /**
   * Sets a FADEC mode for a throttle.
   * @param index The index of the throttle in this FADEC's throttle list.
   * @param mode The mode to set.
   */
  protected setMode(index: number, mode: JetFadecMode | null): void {
    if (mode === this.lastModes[index]) {
      return;
    }

    this.lastModes[index] = mode;
    this.bus.pub(`fadec_mode_${this.throttleInfos[index].index}`, mode?.name ?? '', true, true);
  }
}