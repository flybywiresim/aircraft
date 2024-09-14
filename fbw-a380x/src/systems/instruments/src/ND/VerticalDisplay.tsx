import {
  A380EfisNdRangeValue,
  ArincEventBus,
  EfisNdMode,
  EfisSide,
  a380EfisRangeSettings,
} from '@flybywiresim/fbw-sdk';
import { ComponentProps, DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

export interface VerticalDisplayProps extends ComponentProps {
  bus: ArincEventBus;
  side: EfisSide;
}

export interface GenericFcuEvents {
  ndMode: EfisNdMode;
  ndRangeSetting: A380EfisNdRangeValue;
}

export class VerticalDisplayDummy extends DisplayComponent<VerticalDisplayProps> {
  private topRef = FSComponent.createRef<SVGElement>();

  private ndMode: EfisNdMode = EfisNdMode.ARC;

  private ndRangeSetting: A380EfisNdRangeValue = 10;

  private updateVisibility() {
    if (this.ndMode === EfisNdMode.PLAN) {
      this.topRef.instance.style.display = 'none';
    } else if (this.ndRangeSetting === -1) {
      this.topRef.instance.style.display = 'none';
    } else {
      this.topRef.instance.style.display = 'block';
    }
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<GenericFcuEvents>();

    sub
      .on('ndMode')
      .whenChanged()
      .handle((mode) => {
        this.ndMode = mode;
        this.updateVisibility();
      });

    sub
      .on('ndRangeSetting')
      .whenChanged()
      .handle((range) => {
        this.ndRangeSetting = a380EfisRangeSettings[range];
        this.updateVisibility();
      });
  }

  render(): VNode {
    return (
      <svg ref={this.topRef} viewBox="0 0 768 1024" xmlns="http://www.w3.org/2000/svg">
        <g>
          <line x1="105" x2="105" y1="800" y2="1000" stroke="red" stroke-width="2" />
          <line x1="105" x2="120" y1="820" y2="820" stroke="red" stroke-width="2" />
          <line x1="105" x2="120" y1="850" y2="850" stroke="red" stroke-width="2" />
          <line x1="105" x2="120" y1="880" y2="880" stroke="red" stroke-width="2" />
          <line x1="105" x2="120" y1="910" y2="910" stroke="red" stroke-width="2" />
          <line x1="105" x2="120" y1="940" y2="940" stroke="red" stroke-width="2" />
          <line x1="105" x2="120" y1="970" y2="970" stroke="red" stroke-width="2" />
        </g>
        <g>
          <line x1="150" x2="690" y1="800" y2="800" stroke="red" stroke-width="2" />
          <line x1="150" x2="150" y1="800" y2="1000" stroke="red" stroke-width="2" stroke-dasharray="8" />
          <line x1="285" x2="285" y1="800" y2="1000" stroke="red" stroke-width="2" stroke-dasharray="8" />
          <line x1="420" x2="420" y1="800" y2="1000" stroke="red" stroke-width="2" stroke-dasharray="8" />
          <line x1="555" x2="555" y1="800" y2="1000" stroke="red" stroke-width="2" stroke-dasharray="8" />
          <line x1="690" x2="690" y1="800" y2="1000" stroke="red" stroke-width="2" />
        </g>
      </svg>
    );
  }
}
