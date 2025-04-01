import { ComponentProps, DisplayComponent, EventBus, Subject, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { NXDataStore } from '@flybywiresim/fbw-sdk';

interface NotificationProps extends ComponentProps {
  bus: EventBus;
}

export class NotificationsRoot extends DisplayComponent<NotificationProps> {
  private visibility = Subject.create('visible');

  private display = true;

  private isVisible = true;

  private wasOnRay = false;

  private onRay = false;

  private readonly gElementRef = FSComponent.createRef<SVGGElement>();

  private readonly svgElementRef = FSComponent.createRef<SVGSVGElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    const minDelay = 1 * 1000;
    const maxDelay = 25 * 1000;
    const randomDelay = Math.random() * maxDelay + minDelay;

    NXDataStore.getAndSubscribe(
      'CONFIG_APRIL_FOOLS_2025',
      (_, v) => {
        this.display = v === '0';

        if (!this.display) {
          this.isVisible = false;
          this.visibility.set('hidden');
        }
      },
      '0',
    );

    setInterval(() => {
      if (this.wasOnRay && !this.isVisible) {
        this.visibility.set('visible');
        this.isVisible = this.display;
        this.wasOnRay = false;
      } else {
        this.visibility.set('hidden');
        this.isVisible = false;
      }
    }, randomDelay);

    setInterval(() => {
      if (this.onRay) {
        if (!SimVar.GetSimVarValue('A:IS CAMERA RAY INTERSECT WITH NODE:1', 'bool')) {
          this.onRay = false;
          this.wasOnRay = true;
        }
      } else {
        this.onRay = SimVar.GetSimVarValue('A:IS CAMERA RAY INTERSECT WITH NODE:1', 'bool');
      }
    }, 1000);
  }

  render(): VNode {
    return (
      <svg
        ref={this.svgElementRef}
        version="1.1"
        viewBox="0 0 256 256"
        xmlns="http://www.w3.org/2000/svg"
        class="powered"
      >
        <g ref={this.gElementRef}>
          <rect x="0" y="0" width="1" height="1" fill="#00E0FE" visibility={this.visibility} />
        </g>
      </svg>
    );
  }
}
