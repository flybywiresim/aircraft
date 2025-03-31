import { ComponentProps, DisplayComponent, EventBus, Subject, FSComponent, VNode } from '@microsoft/msfs-sdk';

interface NotificationProps extends ComponentProps {
  bus: EventBus;
}

export class NotificationsRoot extends DisplayComponent<NotificationProps> {
  private visibility = Subject.create('visible');

  private readonly gElementRef = FSComponent.createRef<SVGGElement>();

  private readonly svgElementRef = FSComponent.createRef<SVGSVGElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    const minDelay = 3 * 1000;
    const maxDelay = 10 * 1000;
    const randomDelay = Math.random() * maxDelay + minDelay;

    setInterval(() => {
      if (SimVar.GetSimVarValue('A:IS CAMERA RAY INTERSECT WITH NODE:1', 'bool')) {
        this.visibility.set('visible');
      } else {
        this.visibility.set('hidden');
      }
    }, randomDelay);
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
