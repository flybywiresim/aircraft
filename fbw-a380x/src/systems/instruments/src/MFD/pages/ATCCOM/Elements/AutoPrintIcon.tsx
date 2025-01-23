import { ComponentProps, DisplayComponent, FSComponent, Subscribable, VNode } from '@microsoft/msfs-sdk';

interface AutoPrintIconProps extends ComponentProps {
  visible: Subscribable<boolean> | undefined;
}

export class AutoPrintIcon extends DisplayComponent<AutoPrintIconProps> {
  render(): VNode | null {
    return (
      <div class="d-atis-icon auto-print-symbol">
        {this.props.visible && (
          <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" fill="none">
            <path fill="#aaa" stroke="#fff" d="M1 30.3h29.7v-9l-3.9-3.9H6.2l-4.5 3.9v9" style="stroke-width:1.28822" />
            {/* right side big */}
            <path fill="#aaa" stroke="#fff" d="m30.7 30.3 4.5-5.1v-9l-4.5 5v9.1" style="stroke-width:1.28822" />
            {/* front ground */}
            <path fill="#aaa" stroke="#fff" d="m3.6 30.3 2.6 3.9h19.3l2.6-3.9H3.6" style="stroke-width:1.28822" />
            {/* right side ground */}
            <path fill="#aaa" stroke="#fff" d="m25.5 34.2 5.2-3.9H28l-2.6 3.9" style="stroke-width:1.28822" />
            {/* right side top */}
            <path
              fill="#ccc"
              stroke="#fff"
              d="M35.8 14.8 32 12.3l-5.2 5.1 3.9 3.9 5.1-6.5"
              style="stroke-width:1.28822"
            />
            {/* top */}
            <path fill="#ccc" stroke="#fff" d="m6.2 17.4 12.9-5.1h11.6l-5.2 5.1H6.2" style="stroke-width:1.28822" />
            {/* paper */}
            <path fill="#000" stroke="#fff" d="m8.8 17.4 6.4-11.6H32l-6.5 11.6H8.8" style="stroke-width:1.28822" />
            <path stroke="#0f0" d="M15.9 9.7h11.6M13.3 13.6h11.6" style="stroke-width:1.28822" />
            <path d="M1.7 21.5h28.7" style="fill:#fff;stroke:#fff;stroke-width:1.5777;stroke-opacity:1" />
          </svg>
        )}
      </div>
    );
  }
}
