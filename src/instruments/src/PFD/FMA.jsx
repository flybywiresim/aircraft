import { Component } from 'react';
import { getSimVar, renderTarget } from '../util.mjs';

export const FMA = () => {
    const SharedMode = getSimVar('L:A32NX_SharedAPMode', 'enum');
    const BC3Message = getSimVar('L:A32NX_BC3Message', 'enum');

    let secondBorder;
    if (SharedMode !== 0) {
        secondBorder = null;
    } else if (BC3Message !== 0) {
        secondBorder = <path d="m66.241 0.33732v15.766" />;
    } else {
        secondBorder = <path d="m66.241 0.33732v20.864" />;
    }

    return (
        <g id="FMA" className="NormalStroke Grey">
            <path d="m33.117 0.33732v20.864" />
            {secondBorder}
            <path d="m102.52 0.33732v20.864" />
            <path d="m133.72 0.33732v20.864" />
            <Row1 />
            <Row2 />
            <Row3 />
        </g>
    );
};

const Row1 = () => (
    <g>
        <A1A2Cell />
        <B1Cell />
        <E1Cell />
    </g>
);

const Row2 = () => (
    <g>
        <E2Cell />
    </g>
);

const Row3 = () => (
    <g>
        <E3Cell />
    </g>
);

const A1A2Cell = () => {
    const AThrMode = getSimVar('L:A32NX_ThrustLimitMode', 'enum');

    let text;

    switch (AThrMode) {
    case 1:
        return (
            <g>
                <path className="NormalStroke White" d="m24.023 1.8143v13.506h-15.048v-13.506z" />
                <text className="FontMedium MiddleAlign White" x="16.558302" y="6.8888531">MAN</text>
                <text className="FontMedium MiddleAlign White" x="16.511532" y="14.232082">TOGA</text>
            </g>
        );
    case 2:
        return (
            <g>
                <path className="NormalStroke White" d="m29.776 1.8143v13.506h-26.414v-13.506z" />
                <text className="FontMedium MiddleAlign White" x="16.558302" y="6.8888531">MAN</text>
                <text className="FontMedium MiddleAlign White" x="16.511532" y="14.232082">GA SOFT</text>
            </g>
        );
    case 3: {
        const FlexTemp = Math.round(getSimVar('L:AIRLINER_TO_FLEX_TEMP', 'number'));
        const FlexText = FlexTemp >= 0 ? (`+${FlexTemp}`) : FlexTemp.toString();
        return (
            <g>
                <path className="NormalStroke White" d="m31.521 1.8143v13.506h-30.217v-13.506z" />
                <text className="FontMedium MiddleAlign White" x="16.558302" y="6.8888531">MAN</text>
                <text className="FontMedium MiddleAlign White" x="16.511532" y="14.232082">
                    <tspan xmlSpace="preserve">FLX  </tspan>
                    <tspan className="Cyan">{FlexText}</tspan>
                </text>
            </g>
        );
    }
    case 4:
        return (
            <g>
                <path className="NormalStroke White" d="m23.172 1.8143v13.506h-12.99v-13.506z" />
                <text className="FontMedium MiddleAlign White" x="16.558302" y="6.8888531">MAN</text>
                <text className="FontMedium MiddleAlign White" x="16.511532" y="14.232082">DTO</text>
            </g>
        );
    case 5:
        return (
            <g>
                <path className="NormalStroke White" d="m23.172 1.8143v13.506h-12.99v-13.506z" />
                <text className="FontMedium MiddleAlign White" x="16.558302" y="6.8888531">MAN</text>
                <text className="FontMedium MiddleAlign White" x="16.511532" y="14.232082">MCT</text>
            </g>
        );
    case 6:
        return (
            <g>
                <path className="NormalStroke Amber" d="m23.172 1.8143v13.506h-12.99v-13.506z" />
                <text className="FontMedium MiddleAlign White" x="16.558302" y="6.8888531">MAN</text>
                <text className="FontMedium MiddleAlign White" x="16.511532" y="14.232082">THR</text>
            </g>
        );
    case 7:
        text = 'SPEED';
        break;
    case 8:
        text = 'MACH';
        break;
    case 9:
        text = 'THR MCT';
        break;
    case 10:
        text = 'THR CLB';
        break;
    case 11:
        text = 'THR LVR';
        break;
    case 12:
        text = 'THR IDLE';
        break;
    case 13:
        text = 'A.FLOOR';
        break;
    case 14:
        text = 'TOGA LK';
        break;
    default:
        return null;
    }

    return (
        <g>
            <ShowTenSeconds id={AThrMode}>
                <path className="NormalStroke White" d="m0.70556 1.8143h30.927v6.0476h-30.927z" />
            </ShowTenSeconds>
            <text className="FontMedium MiddleAlign Green" x="16.158028" y="6.8888531">{text}</text>
        </g>
    );
};

const B1Cell = () => {
    const activeVerticalMode = getSimVar('L:A32NX_VerticalAPMode', 'enum');

    let text;

    switch (activeVerticalMode) {
    case 1:
        text = 'G/S';
        break;
    case 2:
        text = 'F-G/S';
        break;
    case 3:
        text = 'G/S*';
        break;
    case 4:
        text = 'F-G/S*';
        break;
    case 5:
        text = 'EXP DES';
        break;
    case 6:
        text = 'EXP CLB';
        break;
    case 7:
        text = 'SRS';
        break;
    case 8:
        text = 'TCAS';
        break;
    case 9:
        text = 'FINAL';
        break;
    case 10:
        text = 'DES';
        break;
    case 11:
        text = 'OP DES';
        break;
    case 12:
        text = 'CLB';
        break;
    case 13:
        text = 'OP CLB';
        break;
    case 14:
        text = 'ALT';
        break;
    case 15:
        text = 'ALT*';
        break;
    case 16:
        text = 'ALT CST*';
        break;
    case 17:
        text = 'ALT CST';
        break;
    case 18:
        text = 'ALT CRZ';
        break;
    case 19: {
        const FPA = getSimVar('L:A32NX_AUTOPILOT_FPA_SELECTED', 'Degree');
        const FPAText = `${(FPA >= 0 ? '+' : '')}${(Math.round(FPA * 10) / 10).toFixed(1)}°`;

        text = [<tspan>FPA</tspan>, <tspan className="Cyan">{FPAText}</tspan>];
        break;
    }
    case 20: {
        const VS = getSimVar('AUTOPILOT VERTICAL HOLD VAR', 'feet per minute');
        const VSText = `${(VS >= 0 ? '+' : '')}${Math.round(VS).toString()}`.padStart(5, ' ');

        text = [<tspan>V/S</tspan>, <tspan className="Cyan">{VSText}</tspan>];
        break;
    }
    default:
        return null;
    }

    return (
        <g>
            <ShowTenSeconds id={activeVerticalMode}>
                <path className="NormalStroke White" d="m34.656 1.8143h29.918v6.0476h-29.918z" />
            </ShowTenSeconds>
            <text className="FontMedium MiddleAlign Green" x="49.498924" y="6.8785663" xmlSpace="preserve">{text}</text>
        </g>
    );
};

const E1Cell = () => {
    const AP1Engaged = getSimVar('L:XMLVAR_Autopilot_1_Status', 'bool');
    const AP2Engaged = getSimVar('L:XMLVAR_Autopilot_2_Status', 'bool');

    let text;
    let id = 0;
    if (!AP1Engaged && !AP2Engaged) {
        return null;
    } else if (AP1Engaged && !AP2Engaged) {
        text = 'AP1';
        id = 1;
    } else if (AP2Engaged && !AP1Engaged) {
        text = 'AP2';
        id = 2;
    } else {
        text = 'AP1+2';
        id = 3;
    }

    return (
        <g>
            <ShowTenSeconds id={id}>
                <path className="NormalStroke White" d="m156.13 1.8143v6.0476h-20.81v-6.0476z" />
            </ShowTenSeconds>
            <text className="FontMedium MiddleAlign White" x="145.61546" y="6.9559975">{text}</text>
        </g>
    );
};

const E2Cell = () => {
    const FD1Active = getSimVar('AUTOPILOT FLIGHT DIRECTOR ACTIVE:1', 'bool');
    const FD2Active = getSimVar('AUTOPILOT FLIGHT DIRECTOR ACTIVE:2', 'bool');

    if (!FD1Active && !FD2Active) {
        return null;
    }

    const text = `${FD1Active ? '1' : '-'} FD ${FD2Active ? '2' : '-'}`;
    return (
        <text className="FontMedium MiddleAlign White" x="145.8961" y="14.218581">{text}</text>
    );
};

const E3Cell = () => {
    const AThrArm = getSimVar('AUTOPILOT THROTTLE ARM', 'bool');
    const AThrActive = getSimVar('AUTOPILOT MANAGED THROTTLE ACTIVE', 'bool');

    let color;
    let id = 0;
    if (!AThrArm && !AThrActive) {
        return null;
    } if (AThrArm && !AThrActive) {
        color = 'Cyan';
        id = 1;
    } else if (AThrActive) {
        color = 'White';
        id = 2;
    }

    return (
        <g>
            <ShowTenSeconds id={id}>
                <path className="NormalStroke White" d="m135.32 16.329h20.81v6.0476h-20.81z" />
            </ShowTenSeconds>
            <text className={`FontMedium MiddleAlign ${color}`} x="145.75578" y="21.434536">A/THR</text>
        </g>
    );
};

class ShowTenSeconds extends Component {
    constructor(props) {
        super(props);

        this.Timer = 10;
        this.PrevID = NaN;
        const updateFunction = (event) => {
            if (this.Timer > 0) {
                this.Timer -= event.detail / 1000;
            }
            console.log(this.Timer);
            console.log(event.detail);
            this.forceUpdate();
        };
        this.Update = updateFunction.bind(this);
    }

    componentDidMount() {
        renderTarget.parentElement.addEventListener('update', this.Update);
    }

    shouldComponentUpdate(nextProps, _nextState, _nextContext) {
        if (this.PrevID !== nextProps.id) {
            this.PrevID = nextProps.id;
            this.Timer = 10;
        }
    }

    componentWillUnmount() {
        renderTarget.parentElement.removeEventListener('update', this.Update);
    }

    render() {
        if (this.Timer > 0) {
            return (
                this.props.children
            );
        }
        return null;
    }
}
