import { ArincEventBus, EfisNdMode, EfisSide } from '@flybywiresim/fbw-sdk';
import { ComponentProps, DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

export interface VerticalDisplayProps extends ComponentProps {
    bus: ArincEventBus;
    side: EfisSide,
}

export interface GenericFcuEvents {
    ndMode: EfisNdMode,
}

export class VerticalDisplayDummy extends DisplayComponent<VerticalDisplayProps> {
    private topRef = FSComponent.createRef<SVGElement>();

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<GenericFcuEvents>();

        sub.on('ndMode').whenChanged().handle((mode) => {
            if (mode !== EfisNdMode.PLAN) {
                this.topRef.instance.style.display = 'block';
            } else {
                this.topRef.instance.style.display = 'none';
            }
        });
    }

    render(): VNode {
        return (
            <svg ref={this.topRef} viewBox="0 0 768 1024" xmlns="http://www.w3.org/2000/svg">
                <rect width="768" height="768" />
                <g>
                    <line x1="50" x2="50" y1="790" y2="980" stroke="red" stroke-width="2" />
                    <line x1="50" x2="75" y1="820" y2="820" stroke="red" stroke-width="2" />
                    <line x1="50" x2="75" y1="850" y2="850" stroke="red" stroke-width="2" />
                    <line x1="50" x2="75" y1="880" y2="880" stroke="red" stroke-width="2" />
                    <line x1="50" x2="75" y1="910" y2="910" stroke="red" stroke-width="2" />
                    <line x1="50" x2="75" y1="940" y2="940" stroke="red" stroke-width="2" />
                    <line x1="50" x2="75" y1="970" y2="970" stroke="red" stroke-width="2" />
                </g>
                <g>
                    <line x1="100" x2="700" y1="790" y2="790" stroke="red" stroke-width="2" />
                    <line x1="100" x2="100" y1="790" y2="980" stroke="red" stroke-width="2" stroke-dasharray="8" />
                    <line x1="250" x2="250" y1="790" y2="980" stroke="red" stroke-width="2" stroke-dasharray="8" />
                    <line x1="400" x2="400" y1="790" y2="980" stroke="red" stroke-width="2" stroke-dasharray="8" />
                    <line x1="550" x2="550" y1="790" y2="980" stroke="red" stroke-width="2" stroke-dasharray="8" />
                    <line x1="700" x2="700" y1="790" y2="980" stroke="red" stroke-width="2" />
                </g>
            </svg>
        );
    }
}
