import { ComponentProps, DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

export class TriangleDown extends DisplayComponent<ComponentProps> {
    render(): VNode {
        return (
            <svg height="15" width="15">
                <polygon points="0,0 15,0 7.5,15" style="fill: white" />
            </svg>
        );
    }
}

export class TriangleUp extends DisplayComponent<ComponentProps> {
    render(): VNode {
        return (
            <svg height="15" width="15">
                <polygon points="7.5,0 15,15 0,15" style="fill: white" />
            </svg>
        );
    }
}
