import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';

type RollScaleTickProps = {
    angle: number,
    radius: number
}

class RollScaleTick extends DisplayComponent<RollScaleTickProps> {
    render(): VNode {
        const tickLength = 20;

        const sine = Math.sin(this.props.angle * Math.PI / 180);
        const cosine = Math.cos(this.props.angle * Math.PI / 180);

        const x = 256 + this.props.radius * sine;
        const y = 256 - this.props.radius * cosine;
        const dx = tickLength * sine;
        const dy = -tickLength * cosine;

        return (<path id={`AngleMarker-${this.props.angle}`} class="white-line" d={`M${x} ${y} l${dx} ${dy}`} />);
    }
}

export class RollScale extends DisplayComponent<unknown> {
    private readonly markerAngles = [-60, -45, -30, -20, -10, 10, 20, 30, 45, 60];

    private readonly radiusForMarkers = 138;

    private readonly dx = this.radiusForMarkers * Math.sin(30 * Math.PI / 180);

    private readonly dy = this.radiusForMarkers * Math.cos(30 * Math.PI / 180);

    render(): VNode {
        return (
            <g id="RollScale">
                <path class="white-line" d={`M ${256 - this.dx} ${256 - this.dy} a ${this.radiusForMarkers} ${this.radiusForMarkers} 0 0 1 ${2 * this.dx} 0`} />
                <g>
                    {this.markerAngles.map((angle) => (<RollScaleTick radius={this.radiusForMarkers} angle={angle} />))}
                </g>
                <path class="FillYellow StrokeYellow" d="M 256 116 l 10 -18 h-20z" />
            </g>
        );
    }
}
