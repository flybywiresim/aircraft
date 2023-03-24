import { FSComponent, DisplayComponent, Subscribable, VNode } from 'msfssdk';

export class LubberLine extends DisplayComponent<{ available: Subscribable<boolean>, rotation: Subscribable<number> }> {
    render(): VNode | null {
        return (
            <g
                visibility={this.props.available.map((it) => (it ? 'inherit' : 'hidden'))}
                transform={this.props.rotation.map(((rotation) => `rotate(${rotation} 384 626)`))}
            >
                <line
                    x1={384}
                    y1={116}
                    x2={384}
                    y2={152}
                    class="shadow"
                    stroke-width={5.5}
                    stroke-linejoin="round"
                    stroke-linecap="round"
                />
                <line
                    x1={384}
                    y1={116}
                    x2={384}
                    y2={152}
                    class="Yellow"
                    stroke-width={5}
                    stroke-linejoin="round"
                    stroke-linecap="round"
                />
            </g>
        );
    }
}
