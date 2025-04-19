import { DisplayComponent, FSComponent, Subscription, VNode } from '@microsoft/msfs-sdk';

export abstract class DestroyableComponent<T> extends DisplayComponent<T> {
  /** Make sure to collect all subscriptions (Consumer, MappedSubjects, ...) here, so we can destroy them when destroying the page */
  protected readonly subscriptions: Subscription[] = [];

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render(): VNode | null {
    return <></>;
  }

  public pauseSubscriptions() {
    for (const s of this.subscriptions) {
      s.pause();
    }
  }

  public resumeSubscriptions() {
    for (const s of this.subscriptions) {
      s.resume();
    }
  }
}
