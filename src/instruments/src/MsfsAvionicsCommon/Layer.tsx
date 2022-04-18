import { FSComponent, DisplayComponent, VNode } from 'msfssdk';

export class Layer extends DisplayComponent<{ x: number, y: number }> {
    render(): VNode | null {
        const { x, y } = this.props;

        return (
            <g transform={`translate(${x}, ${y})`}>
                {this.props.children}
            </g>
        );
    }
}
