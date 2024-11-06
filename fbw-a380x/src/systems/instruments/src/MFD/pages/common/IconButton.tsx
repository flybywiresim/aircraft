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
  icon: 'double-up' | 'double-down' | 'ecl-single-up' | 'ecl-single-down' | 'ecl-check' | '' | null;
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
        {this.props.icon === 'ecl-single-up' && (
          <svg width="35" height="35" xmlns="http://www.w3.org/2000/svg">
            <g ref={this.svgGroupRef} fill-opacity="0.0" stroke={this.fillColor} stroke-width="3">
              <polygon points="3,32 17.5,3 32,32" />
            </g>
          </svg>
        )}
        {this.props.icon === 'ecl-single-down' && (
          <svg width="35" height="35" xmlns="http://www.w3.org/2000/svg">
            <g
              ref={this.svgGroupRef}
              fill-opacity="0.0"
              stroke={this.fillColor}
              stroke-width="3"
              transform="rotate(180 17.5 17.5)"
            >
              <polygon points="3,32 17.5,3 32,32" />
            </g>
          </svg>
        )}
        {this.props.icon === 'ecl-check' && (
          <svg width="35" height="35" xmlns="http://www.w3.org/2000/svg">
            <g
              ref={this.svgGroupRef}
              fill="white"
              stroke={this.fillColor}
              stroke-width="3"
              transform="translate(0.000000,35.000000) scale(0.100000,-0.100000)"
            >
              <path
                d="M255 270 c-52 -41 -145 -147 -145 -165 0 -5 -9 5 -20 23 -19 31 -52
                    43 -65 23 -3 -5 6 -26 19 -46 14 -20 28 -45 31 -56 12 -36 35 -18 93 72 24 37
                    69 94 100 128 66 70 60 79 -13 21z"
              />
            </g>
          </svg>
        )}
      </span>
    );
  }
}
