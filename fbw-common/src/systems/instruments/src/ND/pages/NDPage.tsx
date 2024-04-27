import { ComponentProps, DisplayComponent, Subject } from '@microsoft/msfs-sdk';

export abstract class NDPage<P extends ComponentProps = ComponentProps> extends DisplayComponent<P> {
  isVisible: Subject<boolean>;

  onShow(): void {
    // noop
  }

  onHide(): void {
    /// noop
  }
}
