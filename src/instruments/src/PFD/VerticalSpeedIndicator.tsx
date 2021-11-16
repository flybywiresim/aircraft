import { Arinc429Word } from '@shared/arinc429';
import { useSimVar } from '@instruments/common/simVars';
import React from 'react';

interface VerticalSpeedIndicatorProps {
    radioAlt: number,
    verticalSpeed: Arinc429Word
}

export const VerticalSpeedIndicator = ({ radioAlt, verticalSpeed }: VerticalSpeedIndicatorProps) => {
    if (!verticalSpeed.isNormalOperation()) {
        return (
            <>
                <path className="TapeBackground" d="m151.84 131.72 4.1301-15.623v-70.556l-4.1301-15.623h-5.5404v101.8z" />
                <g id="VSpeedFailText">
                    <text className="Blink9Seconds FontLargest Red EndAlign" x="153.13206" y="77.501472">V</text>
                    <text className="Blink9Seconds FontLargest Red EndAlign" x="153.13406" y="83.211388">/</text>
                    <text className="Blink9Seconds FontLargest Red EndAlign" x="152.99374" y="88.870819">S</text>
                </g>
            </>
        );
    }

    const absVSpeed = Math.abs(verticalSpeed.value);

    let isAmber = false;
    if (absVSpeed > 6000 || (radioAlt < 2500 && radioAlt > 1000 && verticalSpeed.value < -2000) || (radioAlt < 1000 && verticalSpeed.value < -1200)) {
        isAmber = true;
    }

    const yOffset = getYoffset(verticalSpeed.value);

    const [tcasState] = useSimVar('L:A32NX_TCAS_STATE', 'Enum', 200);
    const [tcasCorrective] = useSimVar('L:A32NX_TCAS_RA_CORRECTIVE', 'Boolean', 200);
    const [tcasRedZoneL] = useSimVar('L:A32NX_TCAS_VSPEED_RED:1', 'Number', 200);
    const [tcasRedZoneH] = useSimVar('L:A32NX_TCAS_VSPEED_RED:2', 'Number', 200);
    const [tcasGreenZoneL] = useSimVar('L:A32NX_TCAS_VSPEED_GREEN:1', 'Number', 200);
    const [tcasGreenZoneH] = useSimVar('L:A32NX_TCAS_VSPEED_GREEN:2', 'Number', 200);

    return (
        <g>
            <path className="TapeBackground" d="m151.84 131.72 4.1301-15.623v-70.556l-4.1301-15.623h-5.5404v101.8z" />

            <VSpeedTcas tcasState={tcasState} tcasCorrective={tcasCorrective} redZone={[tcasRedZoneL, tcasRedZoneH]} greenZone={[tcasGreenZoneL, tcasGreenZoneH]} />

            <g id="VerticalSpeedGroup">
                <g className="Fill White">
                    <path d="m149.92 54.339v-1.4615h1.9151v1.4615z" />
                    <path d="m149.92 44.26v-1.4615h1.9151v1.4615z" />
                    <path d="m149.92 34.054v-1.2095h1.9151v1.2095z" />
                    <path d="m151.84 107.31h-1.9151v1.4615h1.9151z" />
                    <path d="m151.84 117.39h-1.9151v1.4615h1.9151z" />
                    <path d="m151.84 127.59h-1.9151v1.2095h1.9151z" />
                </g>
                <g className="NormalStroke White">
                    <path d="m149.92 67.216h1.7135" />
                    <path d="m151.84 48.569h-1.9151" />
                    <path d="m151.84 38.489h-1.9151" />
                    <path d="m149.92 94.43h1.7135" />
                    <path d="m151.84 113.08h-1.9151" />
                    <path d="m151.84 123.16h-1.9151" />
                </g>
                <g className="FontSmallest MiddleAlign Fill White">
                    <text x="148.07108" y="109.72845">1</text>
                    <text x="148.14471" y="119.8801">2</text>
                    <text x="148.07108" y="129.90607">6</text>
                    <text x="148.09711" y="55.316456">1</text>
                    <text x="148.06529" y="45.356102">2</text>
                    <text x="148.11371" y="35.195072">6</text>
                </g>
                <path className="Fill Yellow" d="m145.79 80.067h6.0476v1.5119h-6.0476z" />
                <VSpeedNeedle isAmber={isAmber} yOffset={yOffset} activeRA={tcasState === 2} />
                <VSpeedText
                    yOffset={yOffset}
                    isAmber={isAmber}
                    VSpeed={verticalSpeed.value}
                    tcasRedZone={[tcasRedZoneL, tcasRedZoneH]}
                    tcasGreenZone={[tcasGreenZoneL, tcasGreenZoneH]}
                    activeRA={tcasState === 2}
                    isCorrective={tcasCorrective}
                />
            </g>
        </g>
    );
};

const getYoffset = (VSpeed) => {
    const absVSpeed = Math.abs(VSpeed);
    const sign = Math.sign(VSpeed);

    if (absVSpeed < 1000) {
        return VSpeed / 1000 * -27.22;
    }
    if (absVSpeed < 2000) {
        return (VSpeed - sign * 1000) / 1000 * -10.1 - sign * 27.22;
    }
    if (absVSpeed < 6000) {
        return (VSpeed - sign * 2000) / 4000 * -10.1 - sign * 37.32;
    }
    return sign * -47.37;
};

const VSpeedTcas = ({ tcasState, tcasCorrective, redZone, greenZone }) => {
    if (tcasState !== 2) {
        return (
            <g id="VerticalSpeedTCASGroup" />
        );
    }

    if (tcasCorrective) {
        return (
            <g id="VerticalSpeedTCASGroup">
                <rect className="TapeBackground" height="101.8" width="5.5404" y="29.92" x="151.84" />
                <VSpeedTcasZone zoneBounds={redZone} zoneClass="Fill Red" isCorrective />
                <VSpeedTcasZone zoneBounds={greenZone} zoneClass="Fill Green" extended isCorrective />
            </g>
        );
    }

    return (
        <g id="VerticalSpeedTCASGroup">
            <VSpeedTcasZone zoneBounds={redZone} zoneClass="Fill Red" />
        </g>
    );
};

const VSpeedTcasZone = ({ zoneBounds, zoneClass, extended, isCorrective }) => {
    if (zoneBounds === null) {
        return (
            <path />
        );
    }

    let y1;
    let y2;
    let y3;
    let y4;

    if (zoneBounds[0] >= 6000) {
        y1 = 29.92;
    } else if (zoneBounds[0] <= -6000) {
        y1 = 131.72;
    } else {
        y1 = 80.822 + getYoffset(zoneBounds[0]);
    }

    if (zoneBounds[1] >= 6000) {
        y2 = 29.92;
    } else if (zoneBounds[1] <= -6000) {
        y2 = 131.72;
    } else {
        y2 = 80.822 + getYoffset(zoneBounds[1]);
    }

    if ((Math.abs(zoneBounds[1]) > 1750 && Math.abs(zoneBounds[1]) > Math.abs(zoneBounds[0]))
        || (isCorrective && zoneClass === 'Fill Red')) {
        y3 = y2;
    } else {
        // y3 = 80.822 + getYoffset(zoneBounds[1] / 2);
        y3 = 80.822;
    }

    if (Math.abs(zoneBounds[0]) > 1750 && Math.abs(zoneBounds[0]) > Math.abs(zoneBounds[1])
        || (isCorrective && zoneClass === 'Fill Red')) {
        y4 = y1;
    } else {
        // y4 = 80.822 + getYoffset(zoneBounds[0] / 2);
        y4 = 80.822;
    }

    const x1 = 151.84;
    const x2 = extended ? 162.74 : 157.3804;

    console.log(`TCAS PATH DEBUG: ${zoneClass}: m${x1},${y1} L${x1},${y2} L${x2},${y3} L${x2},${y4} L${x1},${y1}z, BOUNDS: `, zoneBounds);

    return (
        <path className={zoneClass} d={`m${x1},${y1} L${x1},${y2} L${x2},${y3} L${x2},${y4} L${x1},${y1}z`} />
    );
};

const VSpeedNeedle = ({ yOffset, isAmber, activeRA }) => {
    let className;
    if (activeRA) {
        className = 'HugeStroke White';
    } else {
        className = `HugeStroke ${isAmber ? 'Amber' : 'Green'}`;
    }

    return (
        <>
            <path className="HugeOutline" d={`m162.74 80.822 l -12 ${yOffset}`} />
            <path className={className} id="VSpeedIndicator" d={`m162.74 80.822 l -12 ${yOffset}`} />
        </>
    );
};

const VSpeedText = ({ VSpeed, yOffset, isAmber, tcasRedZone, tcasGreenZone, activeRA, isCorrective }) => {
    const absVSpeed = Math.abs(VSpeed);
    const sign = Math.sign(VSpeed);
    const isRed = activeRA
        && (VSpeed >= tcasRedZone[0] && VSpeed <= tcasRedZone[1])
        && (isCorrective && VSpeed <= tcasGreenZone[0] && VSpeed >= tcasGreenZone[1]);

    if (absVSpeed < 200) {
        return null;
    }

    const textOffset = yOffset - sign * 2.4;

    const text = (Math.round(absVSpeed / 100) < 10 ? '0' : '') + Math.round(absVSpeed / 100).toString();

    let className;
    if (isRed) {
        className = 'FontSmallest MiddleAlign Red';
    } else {
        className = `FontSmallest MiddleAlign ${isAmber ? 'Amber' : 'Green'}`;
    }

    return (
        <g id="VSpeedTextGroup" transform={`translate(0 ${textOffset})`}>
            <path className="BackgroundFill" d="m158.4 83.011h-7.0514v-4.3989h7.0514z" />
            <text id="VSpeedText" className={className} x="154.84036" y="82.554581">{text}</text>
        </g>
    );
};
