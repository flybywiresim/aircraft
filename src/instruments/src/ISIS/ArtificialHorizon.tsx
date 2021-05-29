import { useInteractionEvent } from '@instruments/common/hooks';
import { useSimVar } from '@instruments/common/simVars';
import React, { useState, useEffect } from 'react';
import { LandingSystem } from './LandingSystem';

type DrumProps = {
    x: number,
    y: number,
    fontSize: number,
    digits: number,
    value: number,
    leadingZeroes: boolean,
}

// TODO extra zeros appended with last digit
const Drum: React.FC<DrumProps> = (props) => {
    const maxValue = 10 ** props.digits - 1;
    const value = Math.min(maxValue, props.value);

    const rounded = Math.floor(value);
    let digitStr = rounded.toString();
    let start = 0;
    if (digitStr.length < props.digits) {
        digitStr = digitStr.padStart(props.digits, "0");
        if (!props.leadingZeroes) {
            start = props.digits - digitStr.length;
        } else if (rounded < 1) {
            start = digitStr.length - 1;
        }
    }

    const columns = new Array();

    for (let i = start; i < props.digits; i++) {
        const fraction = rounded / (10 * (i + 1)) % 1;
        columns.push(
            <g transform={`translate(0 ${-fraction * props.fontSize})`}>
                <text
                    x={props.x + i * props.fontSize}
                    y={props.y - props.fontSize}
                    fill="lime"
                    fontSize={props.fontSize}>
                        {(parseInt(digitStr.charAt(i)) + 1) % 10}
                </text>
                <text
                    x={props.x + i * props.fontSize}
                    y={props.y}
                    fill="lime"
                    fontSize={props.fontSize}>
                        {digitStr.charAt(i)}
                </text>
                <text
                    x={props.x + i * props.fontSize}
                    y={props.y + props.fontSize}
                    fill="lime"
                    fontSize={props.fontSize}>
                        {(parseInt(digitStr.charAt(i)) - 1) % 10}
                </text>
            </g>
        );
    }

    return <>
        <clipPath id="drumClip"><rect x={props.x} y={props.y} width={props.fontSize * props.digits} height={props.fontSize} /></clipPath>
        <g clipPath="url(#drumClip)">
            {columns}
        </g>
    </>;
};

const PitchScale: React.FC<{pitchDegPixels: number}> = ({pitchDegPixels}) => {
    let markers = Array();
    for (let d = -30; d <= 30; d += 10) {
        if (d === 0) {
            continue;
        }
        const y = 256 - d * pitchDegPixels;
        markers.push(
            <g>
                <text x={220} y={y} fontSize={32} fill="white" textAnchor="end" alignmentBaseline="middle">{Math.abs(d).toFixed(0)}</text>
                <line x1={232} x2={280} y1={y} y2={y} stroke="white" strokeWidth={4} />
            </g>
        );
    }

    for (let d = -25; d <= 25; d += 10) {
        const y = 256 - d * pitchDegPixels;
        markers.push(
            <line x1={242} x2={270} y1={y} y2={y} stroke="white" strokeWidth={4} />
        );
    }

    for (let d = -27.5; d <= 22.5; d += 10) {
        const y = 256 - d * pitchDegPixels;
        markers.push(
            <line x1={248} x2={264} y1={y} y2={y} stroke="white" strokeWidth={4} />
        );
    }

    for (let d = -22.5; d <= 27.5; d += 10) {
        const y = 256 - d * pitchDegPixels;
        markers.push(
            <line x1={248} x2={264} y1={y} y2={y} stroke="white" strokeWidth={4} />
        );
    }

    return markers;
};

export const ArtificialHorizon: React.FC = () => {
    const [alt] = useSimVar('INDICATED ALTITUDE:2', 'feet');
    const [pitch] = useSimVar('PLANE PITCH DEGREES', 'degrees');
    const [roll] = useSimVar('PLANE BANK DEGREES', 'degrees');
    const [heading] = useSimVar('PLANE HEADING DEGREES MAGNETIC', 'degrees');
    const [lsActive, setLsActive] = useState(false);
    useInteractionEvent('A32NX_ISIS_LS_PRESSED', () => setLsActive(!lsActive));

    const maskWidth = 108;
    const pitchDegPixels = (512 - 2 * maskWidth) / 35;

    const pitchShift = -pitch * pitchDegPixels;

    return <g transform="rotateX(0deg)">
        <clipPath id="clip-ahi">
            <rect x={maskWidth} y={maskWidth} width={512 - 2 * maskWidth} height={512 - 2 * maskWidth} />
        </clipPath>
        <g clipPath="url(#clip-ahi)">
            <g id="horizon" transform={`rotate(${roll} 256 256) translate(0 ${pitchShift})`}>
                <rect x={-256} y={-256} width={1024} height={512} className="sky" />
                <rect x={-256} y={256} width={1024} height={512} className="earth" />
                <line x1={-256} x2={768} y1={256} y2={256} strokeWidth={4} stroke="white" />
                <PitchScale pitchDegPixels={pitchDegPixels} />
            </g>
        </g>
        <g id="fixedOverlay">
            <rect x={360} y={232} width={512 - 360} height={48} fill="black" />
            <path
                d="M512,224 L440,224 L440,232 L340,232 L340,288 L440,288 L440,296 L512,296"
                fill="black"
                stroke="yellow"
                strokeWidth={3}
            />
            { /* alt tape goes here */ }
            { /* if alt < 0 show NEG banner */ }
            { /*<text x={434} y={257} fontSize={48} textAnchor="end" alignmentBaseline="central" fill="lime">{Math.round(alt / 100).toFixed(0).padStart(3)}</text>*/}
            <Drum x={335} y={232} fontSize={48} digits={3} value={Math.abs(alt / 100)} leadingZeroes={false} />
            <rect x={maskWidth} y={236} width={34} height={40} fill="black" />
            <path
                d={`M${maskWidth},256 L${maskWidth + 34},236 L${maskWidth + 34},276 L${maskWidth},256`}
                fill="yellow"
            />
            { lsActive && <LandingSystem /> }
            <PressureIndicator />
            <MachIndicator />
        </g>
    </g>;
};

enum BaroMode {
    QNH = 0,
    STD = 1
}

const PressureIndicator: React.FC = () => {
    const [baroMode] = useSimVar('L:A32NX_ISIS_BARO_MODE', 'enum');
    const [qnh] = useSimVar('A:KOHLSMAN SETTING MB:2', 'millibars');

    if (baroMode === BaroMode.STD) {
        return <text x={256} y={466} width="100%" textAnchor="middle" fontSize={36} fill="cyan">STD</text>;
    } else {
        return <text x={256} y={466} width="100%" textAnchor="middle" fontSize={36} fill="cyan">{Math.round(qnh)}/{((qnh * 0.03).toFixed(2))}</text>;
    }
};

const MachIndicator: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const [mach] = useSimVar('AIRSPEED MACH', 'mach');

    useEffect(() => {
        if (mach > 0.5 && !visible) {
            setVisible(true);
        } else if (mach < 0.45 && visible) {
            setVisible(false);
        }
    }, [mach]);

    return <>
        {visible && <text x={60} y={456} fill="lime" fontSize={38}>{mach.toFixed(2).slice(1)}</text>}
    </>;
}
