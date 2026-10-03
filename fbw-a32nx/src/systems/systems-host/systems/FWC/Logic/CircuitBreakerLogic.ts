import { NXLogicConfirmNode } from '@flybywiresim/fbw-sdk';
import { AbstractSubscribable, Subscribable } from '@microsoft/msfs-sdk';

export class CircuitBreakerLogic extends AbstractSubscribable<boolean> implements Subscribable<boolean> {
  private readonly conf = new NXLogicConfirmNode(60, true);

  private isWarning = false;

  public constructor(
    private readonly flightPhase: Subscribable<number>,
    private readonly sdacInput: Subscribable<boolean>,
  ) {
    super();
  }

  /**
   * Updates the logic.
   * @param deltaTime Time since the last update in ms.
   */
  public onUpdate(deltaTime: number): void {
    const flightPhase = this.flightPhase.get();
    if (
      this.isWarning !==
      this.conf.write(this.sdacInput.get() && (flightPhase === 1 || flightPhase === 2 || flightPhase === 6), deltaTime)
    ) {
      this.isWarning = !this.isWarning;
      this.notify();
    }
  }

  /** @inheritdoc */
  public get(): boolean {
    return this.isWarning;
  }
}
