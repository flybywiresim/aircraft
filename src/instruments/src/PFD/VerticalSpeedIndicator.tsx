import { Arinc429Word } from '@instruments/common/arinc429';
import React from 'react';
import { BitPacking } from '@shared/bitpacking';
import { getSimVar } from '../util.js';

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

    const yOffset = getYoffset(verticalSpeed);

    const tcasState = getSimVar('L:A32NX_TCAS_STATE', 'Enum');
    const tcasVSpeeds = getSimVar('L:A32NX_TCAS_VSPEEDS_PACKED', 'Number');

    return (
        <g>
            <path className="TapeBackground" d="m151.84 131.72 4.1301-15.623v-70.556l-4.1301-15.623h-5.5404v101.8z" />

            <VSpeedTcas tcasState={tcasState} tcasVSpeeds={tcasVSpeeds} />

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
                <VSpeedNeedle isAmber={isAmber} yOffset={yOffset} />
                <VSpeedText yOffset={yOffset} isAmber={isAmber} VSpeed={verticalSpeed.value} />
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

const VSpeedTcas = ({ tcasState, tcasVSpeeds }) => {
    if (tcasState !== 2) {
        return (
            <g id="VerticalSpeedTCASGroup" />
        );
    }

    const vSpeedsUnpacked = BitPacking.unpack8(tcasVSpeeds);

    vSpeedsUnpacked.forEach((v, i, a) => {
        a[i] = (v * 50);
    });

    let greenZone = null;
    let redZone = null;
    switch (vSpeedsUnpacked.length) {
    case 2:
        // Preventive RA, we only have a red zone
        redZone = vSpeedsUnpacked;
        break;
    case 4:
        // Corrective RA, with green and red zone
        redZone = vSpeedsUnpacked.slice(2);
        greenZone = vSpeedsUnpacked.slice(2, 4);
        break;
    default:
        return (
            <g id="VerticalSpeedTCASGroup" />
        );
    }

    const greenZoneSVG = <VSpeedTcasZone zoneBounds={greenZone} zoneClass="Fill Green" extended />;
    const redZoneSVG = <VSpeedTcasZone zoneBounds={redZone} zoneClass="Fill Red" />;

    return (
        <g id="VerticalSpeedTCASGroup">
            {redZoneSVG}
            {greenZoneSVG}
        </g>
    );
};

const VSpeedTcasZone = ({ zoneBounds, zoneClass, extended }) => {
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
        y1 = 80.82 + getYoffset(zoneBounds[0]);
    }

    if (zoneBounds[1] >= 6000) {
        y2 = 29.92;
    } else if (zoneBounds[1] <= -6000) {
        y2 = 131.72;
    } else {
        y2 = 80.82 + getYoffset(zoneBounds[1]);
    }

    if (Math.abs(zoneBounds[1]) > 1750 && Math.abs(zoneBounds[1]) > Math.abs(zoneBounds[0])) {
        y3 = y2;
    } else {
        y3 = y2 / 2;
    }

    if (Math.abs(zoneBounds[0]) > 1750 && Math.abs(zoneBounds[0]) > Math.abs(zoneBounds[1])) {
        y4 = y1;
    } else {
        y4 = y1 / 2;
    }

    const x1 = 151.84;
    const x2 = extended ? 157.75 : 155.9701;

    return (
        <path className={zoneClass} d={`m${x1},${y1} L${x1},${y2} L${x2},${y3} L${x2},${y4} Z`} />
    );
};

const VSpeedNeedle = ({ yOffset, isAmber }) => {
    const className = `HugeStroke ${isAmber ? 'Amber' : 'Green'}`;

    return (
        <>
            <path className="HugeOutline" d={`m162.74 80.822 l -12 ${yOffset}`} />
            <path className={className} id="VSpeedIndicator" d={`m162.74 80.822 l -12 ${yOffset}`} />
        </>
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
