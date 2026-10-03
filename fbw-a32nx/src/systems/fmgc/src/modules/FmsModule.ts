import { EventBus } from '@microsoft/msfs-sdk';
import { Fms } from '../Fms';

/** A modular FMS component. */
export abstract class FmsModule {
  public constructor(protected readonly bus: EventBus) {}

  /**
   * Initialises the module.
   * @param fms The core FMS.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public init(fms: Fms): void {}

  /**
   * Updates the module on the regular glass cockpit interval.
   * Note: init will always be called before the first onUpdate.
   * @param deltaTime Time elapsed since the last call in ms.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onUpdate(deltaTime: number) {}

  /**
   * Updates the module at the fastest possible rate. DO NOT USE THIS
   * unless you are sure it is needed (i.e. real time control).
   * Note: init will always be called before the first onUpdateHiFreq.
   * @param deltaTime Time elapsed since the last call in ms.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onUpdateHiFreq(deltaTime: number) {}
}
