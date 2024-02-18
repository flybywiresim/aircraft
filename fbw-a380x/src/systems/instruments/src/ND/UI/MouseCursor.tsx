import { ComponentProps, DisplayComponent, FSComponent, Subscribable, VNode } from '@microsoft/msfs-sdk';
import './style.scss';

interface MouseCursorProps extends ComponentProps {
    side: Subscribable<'CAPT' | 'FO'>;
}

export class MouseCursor extends DisplayComponent<MouseCursorProps> {
    private divRef = FSComponent.createRef<HTMLSpanElement>();

    private fillColor = '#ffff00'; // or ff94ff = purple

    updatePosition(x: number, y: number) {
        if (this.props.side.get() === 'CAPT') {
            this.divRef.instance.style.left = `${x - 40}px`;
            this.divRef.instance.style.top = `${y - 40}px`;
        } else {
            this.divRef.instance.style.left = `${x - 40 - 768}px`; // Workaround for double screen, remove when rpc sync implemented
            this.divRef.instance.style.top = `${y - 40}px`;
        }
    }

    show() {
        this.divRef.instance.style.display = 'none';
    }

    hide() {
        this.divRef.instance.style.display = 'block';
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);
    }

    render(): VNode {
        return (
            <div ref={this.divRef} class="mfd-mouse-cursor">
                <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="0,0 40,35 80,0" style={`fill: none; stroke: ${this.fillColor}; stroke-width: 3`} />
                    <line x1="40" y1="39" x2="40" y2="41" style={`stroke: ${this.fillColor}; stroke-width: 2`} />
                    <line x1="39" y1="40" x2="41" y2="40" style={`stroke: ${this.fillColor}; stroke-width: 2`} />
                    <polyline points="0,80 40,45 80,80" style={`fill: none; stroke: ${this.fillColor}; stroke-width: 3`} />
                </svg>
            </div>
        );
    }
}
