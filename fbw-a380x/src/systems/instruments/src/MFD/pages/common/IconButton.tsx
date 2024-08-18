import {
  ComponentProps,
  DisplayComponent,
  FSComponent,
  Subject,
  Subscribable,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import './style.scss';

interface IconButtonProps extends ComponentProps {
  containerStyle?: string;
  icon: 'double-up' | 'double-down' | '' | null;
  disabled?: Subscribable<boolean>;
  onClick?: () => void;
}

/*
 * Button without text, just an icon
 */
export class IconButton extends DisplayComponent<IconButtonProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private subs = [] as Subscription[];

  private spanRef = FSComponent.createRef<HTMLSpanElement>();

  private svgGroupRef = FSComponent.createRef<SVGGElement>();

  private fillColor = Subject.create('white');

  clickHandler(): void {
    if (!this.props?.disabled?.get() && this.props.onClick !== undefined) {
      this.props.onClick();
    }
  }

  updateSvgColor(color: string) {
    if (this.svgGroupRef) {
      this.svgGroupRef.getOrDefault()?.setAttribute('fill', color);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    if (this.props.disabled === undefined) {
      this.props.disabled = Subject.create(false);
    }

    this.subs.push(
      this.props.disabled.sub((val) => {
        if (val) {
          this.updateSvgColor('grey');
        } else {
          this.updateSvgColor('white');
        }
      }, true),
    );

    this.spanRef.instance.addEventListener('click', () => this.clickHandler());
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    super.destroy();
  }

  render(): VNode {
    return (
      <span ref={this.spanRef} class="mfd-icon-button" style={`${this.props.containerStyle}`}>
        {this.props.icon === 'double-up' && (
          <svg width="35" height="35" xmlns="http://www.w3.org/2000/svg">
            <g ref={this.svgGroupRef} fill={this.fillColor}>
              <polygon points="0,17.5 17.5,0 35,17.5" />
              <polygon points="0,35 17.5,17.5 35,35" />
            </g>
          </svg>
        )}
        {this.props.icon === 'double-down' && (
          <svg width="35" height="35" xmlns="http://www.w3.org/2000/svg">
            <g ref={this.svgGroupRef} fill={this.fillColor} transform="rotate(180 17.5 17.5)">
              <polygon points="0,17.5 17.5,0 35,17.5" />
              <polygon points="0,35 17.5,17.5 35,35" />
            </g>
          </svg>
        )}
      </span>
    );
  }
}
