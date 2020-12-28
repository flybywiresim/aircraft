import { useState } from 'react';
import { VerticalTape } from './PFDUtils.jsx';

const ValueSpacing = 10;
const DistanceSpacing = 10;
const DisplayRange = 42;

const GraduationElement = (speed, offset) => {
    if (speed < 30) {
        return null;
    }

    let text = '';
    let isText = false;
    if (speed % 20 === 0) {
        isText = true;
        text = Math.abs(speed).toString().padStart(3, '0');
    }

    return (
        <g transform={`translate(0 ${offset})`}>
            <path className="NormalStroke White" d="m19.031 80.818h-2.8206" />
            <text className="FontMedium MiddleAlign White" x="7.7348943" y="82.936722">{text}</text>
        </g>
    );
};

const V1BugElement = (offset) => (
    <g id="V1BugGroup" transform={`translate(0 ${offset})`}>
        <path className="NormalStroke Cyan" d="m16.613 80.82h5.4899" />
        <text className="FontLarge MiddleAlign Cyan" x="26.205544" y="82.96">1</text>
    </g>
);

const VRBugElement = (offset) => (
    <path id="RotateSpeedMarker" className="NormalStroke Cyan" transform={`translate(0 ${offset})`} d="m21.549 80.82a1.2592 1.2599 0 1 0-2.5184 0 1.2592 1.2599 0 1 0 2.5184 0z" />);

const GreenDotBugElement = (offset) => (
    <path id="GreenDotSpeedMarker" transform={`translate(0 ${offset})`} className="NormalStroke Green" d="m20.29 80.85a1.2592 1.2599 0 1 0-2.5184 0 1.2592 1.2599 0 1 0 2.5184 0z" />
);

const FlapRetractBugElement = (offset) => (
    <g id="FlapsSlatsBug" transform={`translate(0 ${offset})`}>
        <path className="NormalStroke Green" d="m19.031 75.81h3.8279" />
        <text className="FontLarge MiddleAlign Green" x="27.236509" y="78.32">F</text>
    </g>
);

const SlatRetractBugElement = (offset) => (
    <g id="FlapsSlatsBug" transform={`translate(0 ${offset})`}>
        <path className="NormalStroke Green" d="m19.031 75.81h3.8279" />
        <text className="FontLarge MiddleAlign Green" x="27.236509" y="78.32">S</text>
    </g>
);

const VFENextBugElement = (offset) => (
    <path id="VFeNextMarker" transform={`translate(0 ${offset})`} className="NormalStroke Amber" d="m19.031 81.34h-2.8709m0-1.0079h2.8709" />
);

export const AirspeedIndicator = ({ airspeed, airspeedAcc, FWCFlightPhase, altitude }) => {
    const bugs = [];

    const clampedSpeed = Math.max(Math.min(airspeed, 660), 30);

    const flapsHandleIndex = SimVar.GetSimVarValue('FLAPS HANDLE INDEX', 'Number');

    let v1 = NaN;
    if (FWCFlightPhase <= 4) {
        v1 = SimVar.GetSimVarValue('L:AIRLINER_V1_SPEED', 'knots');
        if (v1 !== 0) {
            bugs.push([V1BugElement, Math.max(Math.min(v1, 660), 30)]);
        }
        const vr = SimVar.GetSimVarValue('L:AIRLINER_VR_SPEED', 'knots');
        if (vr !== 0) {
            bugs.push([VRBugElement, Math.max(Math.min(vr, 660), 30)]);
        }
    }

    if (flapsHandleIndex === 0) {
        const GreenDotSpeed = SimVar.GetSimVarValue('L:A32NX_SPEEDS_GD', 'number');
        bugs.push([GreenDotBugElement, GreenDotSpeed]);
    } else if (flapsHandleIndex === 1) {
        const SlatRetractSpeed = SimVar.GetSimVarValue('L:A32NX_SPEEDS_S', 'number');
        bugs.push([SlatRetractBugElement, SlatRetractSpeed]);
    } else if (flapsHandleIndex === 2 || flapsHandleIndex === 3) {
        const FlapRetractSpeed = SimVar.GetSimVarValue('L:A32NX_SPEEDS_F', 'number');
        bugs.push([FlapRetractBugElement, FlapRetractSpeed]);
    }

    if (altitude < 15000 && flapsHandleIndex < 3) {
        const VFENext = SimVar.GetSimVarValue('L:A32NX_SPEEDS_VFEN', 'number');
        bugs.push([VFENextBugElement, VFENext]);
    }

    return (
        <g id="SpeedTapeElementsGroup">
            <path id="SpeedTapeBackground" className="TapeBackground" d="m1.9058 123.56v-85.473h17.125v85.473z" />
            <SpeedTapeOutline airspeed={airspeed} />
            <VerticalTape tapeValue={clampedSpeed} bugs={bugs} graduationElementFunction={GraduationElement} lowerLimit={30} upperLimit={660} valueSpacing={ValueSpacing} displayRange={DisplayRange + 6} distanceSpacing={DistanceSpacing} />
            {/* <SpeedTrendArrow airspeedAcc={airspeedAcc} /> */}
            {FWCFlightPhase <= 4
            && <V1Offtape airspeed={clampedSpeed} v1={v1} />}
        </g>
    );
};

export const AirspeedIndicatorOfftape = ({
    airspeed, mach, airspeedAcc, targetSpeed, speedIsManaged,
}) => {
    const clampedSpeed = Math.max(Math.min(airspeed, 660), 30);
    const clampedTargetSpeed = Math.max(Math.min(targetSpeed, 660), 30);
    return (
        <g id="SpeedOfftapeGroup">
            <path id="SpeedTapeOutlineUpper" className="NormalStroke White" d="m1.9058 38.086h21.859" />
            <path id="SpeedTapeOutlineLower" className="NormalStroke White" d="m1.9058 123.56h21.859" />
            <SpeedTarget airspeed={clampedSpeed} targetSpeed={clampedTargetSpeed} isManaged={speedIsManaged} />
            <path className="Fill Yellow" d="m13.994 80.46v0.7257h6.5478l3.1228 1.1491v-3.0238l-3.1228 1.1491z" />
            <path className="Fill Yellow" d="m0.092604 81.185v-0.7257h2.0147v0.7257z" />
            <MachNumber mach={mach} airspeedAcc={airspeedAcc} />
        </g>
    );
};

const SpeedTarget = ({ airspeed, targetSpeed, isManaged }) => {
    const color = isManaged ? 'Magenta' : 'Cyan';
    const text = Math.round(targetSpeed).toString().padStart(3, '0');
    if (airspeed - targetSpeed > DisplayRange) {
        return (
            <text id="SelectedSpeedLowerText" className={`FontSmallest EndAlign ${color}`} x="23.994415" y="128.3132">{text}</text>
        );
    } if (airspeed - targetSpeed < -DisplayRange) {
        return (
            <text id="SelectedSpeedLowerText" className={`FontSmallest EndAlign ${color}`} x="23.994289" y="36.750431">{text}</text>
        );
    }
    const offset = (airspeed - targetSpeed) * DistanceSpacing / ValueSpacing;
    return (
        <path className={`NormalStroke ${color}`} transform={`translate(0 ${offset})`} d="m19.274 81.895 5.3577 1.9512v-6.0476l-5.3577 1.9512" />
    );
};

const SpeedTapeOutline = ({ airspeed }) => {
    const length = Math.max(Math.min(airspeed, 72), 30) * 1.01754 + 12.2104;

    return (
        <path id="SpeedTapeOutlineRight" className="NormalStroke White" d={`m19.031 38.086v${length}`} />
    );
};

const MachNumber = ({ mach, airspeedAcc }) => {
    if ((airspeedAcc > 0 && mach < 0.5) || (airspeedAcc < 0 && mach <= 0.45)) {
        return null;
    }

    return (
        <text id="CurrentMachText" className="FontLargest StartAlign Green" x="5.4257932" y="136.88908">{`.${Math.round(mach * 1000)}`}</text>
    );
};

const V1Offtape = ({ airspeed, v1 }) => {
    if (v1 - airspeed > DisplayRange) {
        return (
            <text id="V1SpeedText" className="FontTiny Cyan" x="21.144159" y="43.103134">{Math.round(v1)}</text>
        );
    }
    return null;
};

// Needs filtering, not going to use until then
const SpeedTrendArrow = ({ airspeedAcc }) => {
    const targetSpeed = airspeedAcc * 10;
    const sign = Math.sign(airspeedAcc);
    const [ArrowShown, setArrowShown] = useState(false);

    const offset = -targetSpeed * DistanceSpacing / ValueSpacing;

    if (!ArrowShown && Math.abs(targetSpeed) > 2) {
        setArrowShown(true);
    } else if (ArrowShown && Math.abs(targetSpeed) < 1) {
        setArrowShown(false);
    }

    if (ArrowShown) {
        let pathString;
        if (sign > 0) {
            pathString = `m15.455 ${80.823 + offset} l -1.2531 2.4607 M15.455 ${80.823 + offset} l 1.2531 2.4607`
        } else {
            pathString = `m15.455 ${80.823 + offset} l 1.2531 -2.4607 M15.455 ${80.823 + offset} l -1.2531 -2.4607`
        }

        return (
            <g id="SpeedTrendArrow">
                <path id="SpeedTrendArrowBase" className="NormalStroke Yellow" d={`m15.455 80.823v${offset}`} />
                <path id="SpeedTrendArrowHead" className="NormalStroke Yellow" d={pathString} />
            </g>
        );
    }
    return null;
};
