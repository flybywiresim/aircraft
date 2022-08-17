import { FSComponent, DisplayComponent, ComponentProps, MappedSubject, Subscribable, VNode } from 'msfssdk';
import { Arinc429Word } from '@shared/arinc429';
import { EfisNdRangeValue } from '@shared/NavigationDisplay';
import { TcasMode } from '@tcas/lib/TcasConstants';
import { MathUtils } from '@shared/MathUtils';

export interface RoseModeOverlayProps {
    heading: Subscribable<Arinc429Word>,
    rangeValue: Subscribable<EfisNdRangeValue>,
    tcasMode: Subscribable<TcasMode>,
    visible: Subscribable<boolean>,
}

export class RoseModeUnderlay extends DisplayComponent<RoseModeOverlayProps> {
    private readonly headingValid = this.props.heading.map((it) => it.isNormalOperation());

    private readonly ringColor = this.headingValid.map((valid) => {
        if (valid) {
            return 'White';
        }

        return 'Red';
    })

    private readonly headingRingTransform = this.props.heading.map((heading) => {
        if (heading.isNormalOperation()) {
            return `rotate(${MathUtils.diffAngle(heading.value, 0)} 384 384)`;
        }

        return 'rotate(0 384 384)';
    });

    // eslint-disable-next-line
    private readonly middleRingNoTcasShown = MappedSubject.create(([tcasMode, rangeValue, headingValid]) => {
        return !headingValid || tcasMode === TcasMode.STBY && rangeValue > 10;
    }, this.props.tcasMode, this.props.rangeValue, this.headingValid);

    // eslint-disable-next-line
    private readonly middleRingTcasShown = MappedSubject.create(([tcasMode, rangeValue, headingValid]) => {
        return headingValid && (tcasMode !== TcasMode.STBY || rangeValue <= 10);
    }, this.props.tcasMode, this.props.rangeValue, this.headingValid);

    // eslint-disable-next-line
    private readonly smallRingNoTcasShown = MappedSubject.create(([tcasMode, rangeValue]) => {
        return tcasMode > TcasMode.STBY && rangeValue === 20;
    }, this.props.tcasMode, this.props.rangeValue);

    render(): VNode | null {
        return (
            <>
                <RoseMoveOverlayDefs />

                {/* C = 384,384 */}
                <g transform="rotateX(0deg)" class={this.ringColor} strokeWidth={2} fill="none">
                    <g clipPath="url(#rose-mode-overlay-clip)">
                        <g transform={this.headingRingTransform}>
                            <RoseModeOverlayHeadingRing headingValid={this.headingValid} />
                        </g>
                    </g>

                    {/* R = 125, middle range ring */}
                    <path
                        visibility={this.middleRingNoTcasShown.map((v) => (v ? 'inherit' : 'hidden'))}
                        d="M 509 384 A 125 125 0 0 1 259 384 M 259 384 A 125 125 180 0 1 509 384"
                        strokeDasharray="15 10"
                        strokeDashoffset="-4.2"
                    />

                    {/* middle range ring replaced with tcas range ticks */}
                    <g visibility={this.middleRingTcasShown.map((v) => (v ? 'inherit' : 'hidden'))}>
                        <line x1={384} x2={384} y1={264} y2={254} class="rounded White" transform="rotate(0 384 384)" />
                        <line x1={384} x2={384} y1={264} y2={254} class="rounded White" transform="rotate(30 384 384)" />
                        <line x1={384} x2={384} y1={264} y2={254} class="rounded White" transform="rotate(60 384 384)" />
                        <line x1={384} x2={384} y1={264} y2={254} class="rounded White" transform="rotate(90 384 384)" />
                        <line x1={384} x2={384} y1={264} y2={254} class="rounded White" transform="rotate(120 384 384)" />
                        <line x1={384} x2={384} y1={264} y2={254} class="rounded White" transform="rotate(150 384 384)" />
                        <line x1={384} x2={384} y1={264} y2={254} class="rounded White" transform="rotate(180 384 384)" />
                        <line x1={384} x2={384} y1={264} y2={254} class="rounded White" transform="rotate(210 384 384)" />
                        <line x1={384} x2={384} y1={264} y2={254} class="rounded White" transform="rotate(240 384 384)" />
                        <line x1={384} x2={384} y1={264} y2={254} class="rounded White" transform="rotate(270 384 384)" />
                        <line x1={384} x2={384} y1={264} y2={254} class="rounded White" transform="rotate(300 384 384)" />
                        <line x1={384} x2={384} y1={264} y2={254} class="rounded White" transform="rotate(330 384 384)" />
                    </g>

                    {/* R = 62, tcas range ticks */}
                    <g visibility={this.smallRingNoTcasShown.map((v) => (v ? 'inherit' : 'hidden'))}>
                        <line x1={384} x2={384} y1={327} y2={317} class="rounded White" transform="rotate(0 384 384)" />
                        <line x1={384} x2={384} y1={327} y2={317} class="rounded White" transform="rotate(30 384 384)" />
                        <line x1={384} x2={384} y1={327} y2={317} class="rounded White" transform="rotate(60 384 384)" />
                        <line x1={384} x2={384} y1={327} y2={317} class="rounded White" transform="rotate(90 384 384)" />
                        <line x1={384} x2={384} y1={327} y2={317} class="rounded White" transform="rotate(120 384 384)" />
                        <line x1={384} x2={384} y1={327} y2={317} class="rounded White" transform="rotate(150 384 384)" />
                        <line x1={384} x2={384} y1={327} y2={317} class="rounded White" transform="rotate(180 384 384)" />
                        <line x1={384} x2={384} y1={327} y2={317} class="rounded White" transform="rotate(210 384 384)" />
                        <line x1={384} x2={384} y1={327} y2={317} class="rounded White" transform="rotate(240 384 384)" />
                        <line x1={384} x2={384} y1={327} y2={317} class="rounded White" transform="rotate(270 384 384)" />
                        <line x1={384} x2={384} y1={327} y2={317} class="rounded White" transform="rotate(300 384 384)" />
                        <line x1={384} x2={384} y1={327} y2={317} class="rounded White" transform="rotate(330 384 384)" />
                    </g>

                    <text x={212} y={556} class="Cyan" fontSize={22}>
                        {this.props.rangeValue.map((range) => range / 2)}
                    </text>
                    <text x={310} y={474} class="Cyan" fontSize={22}>
                        {this.props.rangeValue.map((range) => range / 4)}
                    </text>

                    {/* fixed triangle markers every 45 deg except 12 o'clock */}
                    <g visibility={this.headingValid.map((valid) => (valid ? 'inherit' : 'hidden'))}>
                        <path d="M384,132 L379,123 L389,123 L384,132" transform="rotate(45 384 384)" fill="white" />
                        <path d="M384,132 L379,123 L389,123 L384,132" transform="rotate(90 384 384)" fill="white" />
                        <path d="M384,132 L379,123 L389,123 L384,132" transform="rotate(135 384 384)" fill="white" />
                        <path d="M384,132 L379,123 L389,123 L384,132" transform="rotate(180 384 384)" fill="white" />
                        <path d="M384,132 L379,123 L389,123 L384,132" transform="rotate(225 384 384)" fill="white" />
                        <path d="M384,132 L379,123 L389,123 L384,132" transform="rotate(270 384 384)" fill="white" />
                        <path d="M384,132 L379,123 L389,123 L384,132" transform="rotate(315 384 384)" fill="white" />
                    </g>
                </g>
            </>
        );
    }
}

export class RoseMoveOverlayDefs extends DisplayComponent<{}> {
    render(): VNode | null {
        return (
            <>
                <clipPath id="rose-mode-map-clip">
                    <path d="M45,155 L282,155 a250,250 0 0 1 204,0 L723,155 L723,562 L648,562 L591,625 L591,768 L174,768 L174,683 L122,625 L45,625 L45,155" />
                </clipPath>
                <clipPath id="rose-mode-wx-terr-clip">
                    <path d="M45,155 L282,155 a250,250 0 0 1 204,0 L723,155 L723,384 L45,384 L45,155" />
                </clipPath>
                <clipPath id="rose-mode-tcas-clip">
                    <path d="M45,155 L282,155 a250,250 0 0 1 204,0 L723,155 L723,562 L648,562 L591,625 L591,768 L174,768 L174,683 L122,625 L45,625 L45,155" />
                </clipPath>
            </>
        );
    }
}

interface RoseModeOverlayHeadingRingProps extends ComponentProps {
    headingValid: Subscribable<boolean>,
}

export class RoseModeOverlayHeadingRing extends DisplayComponent<RoseModeOverlayHeadingRingProps> {
    render(): VNode | null {
        return (
            <>
                {/* R = 250 */}
                <circle cx={384} cy={384} r={250} />

                <g visibility={this.props.headingValid.map((valid) => (valid ? 'inherit' : 'hidden'))}>
                    <g transform="rotate(0 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                        <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">0</text>
                    </g>

                    <g transform="rotate(5 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(10 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(15 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(20 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(25 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(30 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                        <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">3</text>
                    </g>

                    <g transform="rotate(35 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(40 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(45 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(50 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(55 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(60 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                        <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">6</text>
                    </g>

                    <g transform="rotate(65 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(70 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(75 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(80 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(85 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(90 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                        <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">9</text>
                    </g>

                    <g transform="rotate(95 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(100 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(105 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(110 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(115 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(120 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                        <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">12</text>
                    </g>

                    <g transform="rotate(125 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(130 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(135 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(140 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(145 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(150 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                        <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">15</text>
                    </g>

                    <g transform="rotate(155 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(160 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(165 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(170 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(175 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(180 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                        <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">18</text>
                    </g>

                    <g transform="rotate(185 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(190 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(195 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(200 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(205 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(210 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                        <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">21</text>
                    </g>

                    <g transform="rotate(215 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(220 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(225 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(230 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(235 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(240 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                        <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">24</text>
                    </g>

                    <g transform="rotate(245 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(250 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(255 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(260 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(265 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(270 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                        <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">27</text>
                    </g>

                    <g transform="rotate(275 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(280 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(285 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(290 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(295 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(300 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                        <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">30</text>
                    </g>

                    <g transform="rotate(305 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(310 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(315 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(320 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(325 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(330 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                        <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">33</text>
                    </g>

                    <g transform="rotate(335 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(340 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(345 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(350 384 384)">
                        <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
                    </g>

                    <g transform="rotate(355 384 384)">
                        <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
                    </g>
                </g>
            </>
        );
    }
}
