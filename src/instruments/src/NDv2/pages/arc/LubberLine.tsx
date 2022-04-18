import { FSComponent, DisplayComponent, Subscribable, VNode } from 'msfssdk';

export class LubberLine extends DisplayComponent<{ available: Subscribable<boolean>, rotation: Subscribable<number> }> {
    render(): VNode | null {
        return (
            <g
                visibility={this.props.available.map((it) => (it ? 'visible' : 'hidden'))}
                transform={this.props.rotation.map(((rotation) => `rotate(${rotation} 384 626)`))}
            >
                <line
                    x1={384}
                    y1={116}
                    x2={384}
                    y2={152}
                    class="shadow"
                    strokeWidth={5.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
                <line
                    x1={384}
                    y1={116}
                    x2={384}
                    y2={152}
                    class="Yellow"
                    strokeWidth={5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
            </g>
        );
    }
}
