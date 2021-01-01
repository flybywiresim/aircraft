import { getSimVar } from '../util.mjs';

export const VerticalSpeedIndicator = ({ radioAlt }) => {
    if (!getSimVar('L:A32NX_ADIRS_PFD_ALIGNED_FIRST', 'Bool')) {
        return ([
            <path className="TapeBackground" d="m151.84 131.72 4.1301-15.623v-70.556l-4.1301-15.623h-5.5404v101.8z" />,
            <g id="VSpeedFailText">
                <text className="Blink9Seconds FontLargest Red EndAlign" x="153.13206" y="77.501472">V</text>
                <text className="Blink9Seconds FontLargest Red EndAlign" x="153.13406" y="83.211388">/</text>
                <text className="Blink9Seconds FontLargest Red EndAlign" x="152.99374" y="88.870819">S</text>
            </g>,
        ]
        );
    }

    // This represents inertial vertical speed
    const verticalSpeed = getSimVar('VELOCITY WORLD Y', 'feet per minute');

    let isAmber = false;
    if ((Math.abs(verticalSpeed) > 6000 || (radioAlt < 2500 && radioAlt > 1000 && verticalSpeed < -2000) || (radioAlt < 1000 && verticalSpeed < -1200))) {
        isAmber = true;
    }

    const absVSpeed = Math.abs(verticalSpeed);
    const sign = Math.sign(verticalSpeed);

    let yOffset = 0;

    if (absVSpeed < 1000) {
        yOffset = verticalSpeed / 1000 * -25.5255;
    } else if (absVSpeed < 2000) {
        yOffset = (verticalSpeed - sign * 1000) / 1000 * -10.14 - sign * 25.5255;
    } else if (absVSpeed < 6000) {
        yOffset = (verticalSpeed - sign * 2000) / 4000 * -10.14 - sign * 35.6655;
    } else {
        yOffset = sign * -45.8055;
    }

    return (
        <g>
            <path className="TapeBackground" d="m151.84 131.72 4.1301-15.623v-70.556l-4.1301-15.623h-5.5404v101.8z" />
            <g id="VerticalSpeedGroup">
                <g className="Fill White">
                    <path d="m151.84 54.566v1.4615h-1.914v-1.4615z" />
                    <path d="m151.84 44.426v1.4615h-1.914v-1.4615z" />
                    <path d="m149.93 35.685v-1.2095h1.914v1.2095z" />
                    <path d="m151.84 107.08v-1.4615h-1.914v1.4615z" />
                    <path d="m151.84 117.22v-1.4615h-1.914v1.4615z" />
                    <path d="m151.84 125.96h-1.914v1.2095h1.914z" />
                </g>
                <g className="NormalStroke White">
                    <path d="m149.93 68.122h1.7125h0" />
                    <path d="m151.84 50.221h-1.914h0" />
                    <path d="m151.84 40.069h-1.914h0" />
                    <path d="m149.93 93.522h1.7125h0" />
                    <path d="m151.84 111.42h-1.914h0" />
                    <path d="m151.84 121.58h-1.914h0" />
                </g>
                <g className="FontSmallest MiddleAlign Fill White">
                    <text x="148.07108" y="108.12872">1</text>
                    <text x="148.14471" y="118.18059">2</text>
                    <text x="148.07108" y="128.30609">6</text>
                    <text x="148.09711" y="56.916523">1</text>
                    <text x="148.06529" y="46.855984">2</text>
                    <text x="148.11371" y="36.795124">6</text>
                </g>
                <path className="Fill Yellow" d="m145.8 81.679v-1.7135h6.0441v1.7135z" />
                <VSpeedNeedle isAmber={isAmber} yOffset={yOffset} />
                <VSpeedText yOffset={yOffset} isAmber={isAmber} VSpeed={verticalSpeed} />
            </g>
        </g>
    );
};

const VSpeedNeedle = ({ yOffset, isAmber }) => {
    const className = `NormalStroke ${isAmber ? 'Amber' : 'Green'}`;

    return (
        <path className={className} id="VSpeedIndicator" d={`m162.74 80.822 l -12.125 ${yOffset}`} />
    );
};

const VSpeedText = ({ VSpeed, yOffset, isAmber }) => {
    const absVSpeed = Math.abs(VSpeed);
    const sign = Math.sign(VSpeed);

    if (absVSpeed < 200) {
        return null;
    }

    const textOffset = yOffset - sign * 2.4;

    const text = (Math.round(absVSpeed / 100) < 10 ? '0' : '') + Math.round(absVSpeed / 100).toString();
    const className = `FontSmallest MiddleAlign ${isAmber ? 'Amber' : 'Green'}`;

    return (
        <g id="VSpeedTextGroup" transform={`translate(0 ${textOffset})`}>
            <path className="BackgroundFill" d="m158.4 83.011h-7.0514v-4.3989h7.0514z" />
            <text id="VSpeedText" className={className} x="154.84036" y="82.554581">{text}</text>
        </g>
    );
};
