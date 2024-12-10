import { ComponentProps, DisplayComponent, FSComponent, Subscribable, VNode } from '@microsoft/msfs-sdk';

interface NewAtisIconProps extends ComponentProps {
  visible: Subscribable<boolean> | undefined;
}

export class NewAtisIcon extends DisplayComponent<NewAtisIconProps> {
  render(): VNode | null {
    return (
      <div class="d-atis-icon new-atis-symbol">
        {this.props.visible && (
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="30" viewBox="0 0 40 28" fill="none">
            <rect x="0" y="0" width="40" height="30" fill="white" />
            <rect x="2" y="2" width="36" height="25" stroke="black" stroke-width="1.5" fill="none" />
            <path d="M 2 2 l 16 15 h 4 l 16 -15" stroke="black" stroke-width="1.5" fill="none" />
            <path d="M 2 27 l 13.8 -11.7" stroke="black" stroke-width="1.5" fill="none" />
            <path d="M 38 27 l -13.8 -11.7" stroke="black" stroke-width="1.5" fill="none" />
          </svg>
        )}
      </div>
    );
  }
}
