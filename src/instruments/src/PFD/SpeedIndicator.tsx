import React, { useEffect, useState } from 'react';
import { Arinc429Word } from '@shared/arinc429';
import { VerticalTape, BarberpoleIndicator } from './PFDUtils';
import { getSimVar } from '../util.js';

const ValueSpacing = 10;
const DistanceSpacing = 10;
const DisplayRange = 42;

const GraduationElement = (speed: number, offset: number) => {
    if (speed < 30) {
        return null;
    }

    let text = '';
    if (speed % 20 === 0) {
        text = Math.abs(speed).toString().padStart(3, '0');
    }

    return (
        <g transform={`translate(0 ${offset})`}>
            <path className="NormalStroke White" d="m19.031 80.818h-2.8206" />
            <text className="FontMedium MiddleAlign White" x="8.0348943" y="82.936722">{text}</text>
        </g>
    );
};

const V1BugElement = (offset: number) => (
    <g id="V1BugGroup" transform={`translate(0 ${offset})`}>
        <path className="NormalStroke Cyan" d="m16.613 80.82h5.4899" />
        <text className="FontLarge MiddleAlign Cyan" x="26.205544" y="82.96">1</text>
    </g>
);

const VRBugElement = (offset: number) => (
    <path id="RotateSpeedMarker" className="NormalStroke Cyan" transform={`translate(0 ${offset})`} d="m21.549 80.82a1.2592 1.2599 0 1 0-2.5184 0 1.2592 1.2599 0 1 0 2.5184 0z" />);

const GreenDotBugElement = (offset: number) => (
    <g id="GreenDotSpeedMarker" transform={`translate(0 ${offset})`}>
        <path className="ThickOutline" d="m20.29 80.85a1.2592 1.2599 0 1 0-2.5184 0 1.2592 1.2599 0 1 0 2.5184 0z" />
        <path className="ThickStroke Green" d="m20.29 80.85a1.2592 1.2599 0 1 0-2.5184 0 1.2592 1.2599 0 1 0 2.5184 0z" />
    </g>
);

const FlapRetractBugElement = (offset: number) => (
    <g id="FlapsSlatsBug" transform={`translate(0 ${offset})`}>
        <path className="NormalStroke Green" d="m19.031 80.82h3.8279" />
        <text className="FontLarge MiddleAlign Green" x="27.536509" y="83.327988">F</text>
    </g>
);

const SlatRetractBugElement = (offset: number) => (
    <g id="FlapsSlatsBug" transform={`translate(0 ${offset})`}>
        <path className="NormalStroke Green" d="m19.031 80.82h3.8279" />
        <text className="FontLarge MiddleAlign Green" x="27.536509" y="83.327988">S</text>
    </g>
);

const VFENextBugElement = (offset: number) => (
    <path id="VFeNextMarker" transform={`translate(0 ${offset})`} className="NormalStroke Amber" d="m19.031 81.34h-2.8709m0-1.0079h2.8709" />
);

const VAlphaProtBar = (offset: number) => (
    <path transform={`translate(0 ${offset})`} className="BarAmber" d="m21.952 82.254v1.5119m-0.94654-2.923h0.94654v1.4111h-2.9213v-1.4111z" />);

const VMaxBar = (offset: number) => (
    <path transform={`translate(0 ${offset})`} className="BarRed" d="m22.053 78.381v-2.6206m-3.022 5.0397h3.022v-2.4191h-3.022z" />
);

const VProtBug = (offset: number) => (
    <g id="SpeedProtSymbol" transform={`translate(0 ${offset})`}>
        <path className="NormalOutline" d="m13.994 81.289h3.022m-3.022-1.0079h3.022" />
        <path className="NormalStroke Green" d="m13.994 81.289h3.022m-3.022-1.0079h3.022" />
        <path style={{ display: 'none' }} className="NormalStroke Amber" d="m14.615 79.915 1.7808 1.7818m-1.7808 0 1.7808-1.7818" />
    </g>
);

interface AirspeedIndicatorProps {
    airspeed: Arinc429Word;
    airspeedAcc: number;
    FWCFlightPhase: number;
    altitude: Arinc429Word;
    VLs: number;
    VMax: number;
    showBars: boolean;
    onGround: boolean;
}

export const AirspeedIndicator = ({ airspeed, airspeedAcc, FWCFlightPhase, altitude, VLs, VMax, showBars, onGround }: AirspeedIndicatorProps) => {
    let airspeedValue: number;
    if (airspeed.isFailureWarning() || (airspeed.isNoComputedData() && !onGround)) {
        airspeedValue = NaN;
    } else if (airspeed.isNoComputedData()) {
        airspeedValue = 30;
    } else {
        airspeedValue = airspeed.value;
    }

    if (Number.isNaN(airspeedValue)) {
        return (
            <>
                <path id="SpeedTapeBackground" className="TapeBackground" d="m1.9058 123.56v-85.473h17.125v85.473z" />
                <text id="SpeedFailText" className="Blink9Seconds FontLargest EndAlign Red" x="17.756115" y="83.386398">SPD</text>
                <SpeedTapeOutline airspeed={100} isRed />
            </>
        );
    }

    const ValphaProtection = getSimVar('L:A32NX_SPEEDS_ALPHA_PROTECTION', 'number');
    const ValphaMax = getSimVar('L:A32NX_SPEEDS_ALPHA_MAX', 'number');

    const bugs: [(offset: number) => JSX.Element, number][] = [];

    if (showBars) {
        bugs.push(...BarberpoleIndicator(airspeedValue, ValphaProtection, false, DisplayRange, VAlphaProtBar, 2.923));
    }
    bugs.push(...BarberpoleIndicator(airspeedValue, VMax, true, DisplayRange, VMaxBar, 5.040));

    const showVProt = VMax > 240;
    if (showVProt) {
        bugs.push([VProtBug, VMax + 6]);
    }

    const clampedSpeed = Math.max(Math.min(airspeedValue, 660), 30);

    const flapsHandleIndex = getSimVar('L:A32NX_FLAPS_HANDLE_INDEX', 'Number');

    let v1 = NaN;
    if (FWCFlightPhase <= 4) {
        v1 = getSimVar('L:AIRLINER_V1_SPEED', 'knots');
        if (v1 !== 0) {
            bugs.push([V1BugElement, Math.max(Math.min(v1, 660), 30)]);
        }
        const vr = getSimVar('L:AIRLINER_VR_SPEED', 'knots');
        if (vr !== 0) {
            bugs.push([VRBugElement, Math.max(Math.min(vr, 660), 30)]);
        }
    }

    if (flapsHandleIndex === 0) {
        const GreenDotSpeed = getSimVar('L:A32NX_SPEEDS_GD', 'number');
        bugs.push([GreenDotBugElement, GreenDotSpeed]);
    } else if (flapsHandleIndex === 1) {
        const SlatRetractSpeed = getSimVar('L:A32NX_SPEEDS_S', 'number');
        bugs.push([SlatRetractBugElement, SlatRetractSpeed]);
    } else if (flapsHandleIndex === 2 || flapsHandleIndex === 3) {
        const FlapRetractSpeed = getSimVar('L:A32NX_SPEEDS_F', 'number');
        bugs.push([FlapRetractBugElement, FlapRetractSpeed]);
    }

    if (altitude.isNormalOperation() && altitude.value < 15000 && flapsHandleIndex < 4) {
        const VFENext = getSimVar('L:A32NX_SPEEDS_VFEN', 'number');
        bugs.push([VFENextBugElement, VFENext]);
    }

    return (
        <g id="SpeedTapeElementsGroup">
            <path id="SpeedTapeBackground" className="TapeBackground" d="m1.9058 123.56v-85.473h17.125v85.473z" />
            <SpeedTapeOutline airspeed={airspeed.value} />
            <VerticalTape
                tapeValue={clampedSpeed}
                bugs={bugs}
                graduationElementFunction={GraduationElement}
                lowerLimit={30}
                upperLimit={660}
                valueSpacing={ValueSpacing}
                displayRange={DisplayRange + 6}
                distanceSpacing={DistanceSpacing}
            />
            <SpeedTrendArrow airspeedAcc={airspeedAcc} />
            {FWCFlightPhase <= 4
            && <V1Offtape airspeed={clampedSpeed} v1={v1} />}
            {showBars
                && (
                    <>
                        <VLsBar airspeed={airspeedValue} VLs={VLs} VAlphaProt={ValphaProtection} />
                        <VAlphaLimBar airspeed={airspeedValue} VAlphalim={ValphaMax} />
                    </>
                )}
        </g>
    );
};

const VAlphaLimBar = ({ VAlphalim, airspeed }) => {
    if (VAlphalim - airspeed < -DisplayRange) {
        return null;
    }

    const delta = airspeed - DisplayRange - VAlphalim;
    const offset = delta * DistanceSpacing / ValueSpacing;

    return (
        <path id="VAlimIndicator" className="Fill Red" d={`m19.031 123.56h3.425v${offset}h-3.425z`} />
    );
};

const VLsBar = ({ VAlphaProt, VLs, airspeed }) => {
    if (VLs - airspeed < -DisplayRange) {
        return null;
    }

    const VLsPos = (airspeed - VLs) * DistanceSpacing / ValueSpacing + 80.818;
    const offset = (VLs - VAlphaProt) * DistanceSpacing / ValueSpacing;

    return (
        <path id="VLsIndicator" className="NormalStroke Amber" d={`m19.031 ${VLsPos}h1.9748v${offset}`} />
    );
};

export const AirspeedIndicatorOfftape = ({ airspeed, targetSpeed, speedIsManaged, onGround }) => {
    let airspeedValue: number;
    if (airspeed.isFailureWarning() || (airspeed.isNoComputedData() && !onGround)) {
        airspeedValue = NaN;
    } else if (airspeed.isNoComputedData()) {
        airspeedValue = 30;
    } else {
        airspeedValue = airspeed.value;
    }

    if (Number.isNaN(airspeedValue)) {
        return (
            <>
                <path id="SpeedTapeOutlineUpper" className="NormalStroke Red" d="m1.9058 38.086h21.859" />
                <path id="SpeedTapeOutlineLower" className="NormalStroke Red" d="m1.9058 123.56h21.859" />
            </>
        );
    }

    const clampedSpeed = Math.max(Math.min(airspeedValue, 660), 30);
    const clampedTargetSpeed = Math.max(Math.min(targetSpeed, 660), 30);
    const showLower = clampedSpeed > 72;
    return (
        <g id="SpeedOfftapeGroup">
            <path id="SpeedTapeOutlineUpper" className="NormalStroke White" d="m1.9058 38.086h21.859" />
            {showLower ? <path id="SpeedTapeOutlineLower" className="NormalStroke White" d="m1.9058 123.56h21.859" /> : null}
            <SpeedTarget airspeed={clampedSpeed} targetSpeed={clampedTargetSpeed} isManaged={speedIsManaged} />
            <path className="Fill Yellow SmallOutline" d="m13.994 80.46v0.7257h6.5478l3.1228 1.1491v-3.0238l-3.1228 1.1491z" />
            <path className="Fill Yellow SmallOutline" d="m0.092604 81.185v-0.7257h2.0147v0.7257z" />
        </g>
    );
};

const SpeedTarget = ({ airspeed, targetSpeed, isManaged }) => {
    const color = isManaged ? 'Magenta' : 'Cyan';
    const text = Math.round(targetSpeed).toString().padStart(3, '0');
    if (airspeed - targetSpeed > DisplayRange) {
        return (
            <text id="SelectedSpeedLowerText" className={`FontSmallest EndAlign ${color}`} x="24.078989" y="128.27917">{text}</text>
        );
    } if (airspeed - targetSpeed < -DisplayRange) {
        return (
            <text id="SelectedSpeedLowerText" className={`FontSmallest EndAlign ${color}`} x="24.113895" y="36.670692">{text}</text>
        );
    }
    const offset = (airspeed - targetSpeed) * DistanceSpacing / ValueSpacing;
    return (
        <path className={`NormalStroke ${color} CornerRound`} transform={`translate(0 ${offset})`} d="m19.274 81.895 5.3577 1.9512v-6.0476l-5.3577 1.9512" />
    );
};

const SpeedTapeOutline = ({ airspeed, isRed = false }) => {
    const length = 42.9 + Math.max(Math.max(Math.min(airspeed, 72.1), 30) - 30, 0);
    const className = isRed ? 'NormalStroke Red' : 'NormalStroke White';

    return (
        <path id="SpeedTapeOutlineRight" className={className} d={`m19.031 38.086v${length}`} />
    );
};

interface MachNumberProps {
    mach: Arinc429Word,
    onGround: boolean,
}

export const MachNumber = ({ mach, onGround }: MachNumberProps) => {
    const machPermille = Math.round(mach.valueOr(0) * 1000);
    const [showMach, setShowMach] = useState(machPermille > 500);

    useEffect(() => {
        if (showMach && machPermille < 450) {
            setShowMach(false);
        }
        if (!showMach && machPermille > 500) {
            setShowMach(true);
        }
    }, [showMach, machPermille]);

    if (!mach.isNormalOperation() && !onGround) {
        return (
            <text id="MachFailText" className="Blink9Seconds FontLargest StartAlign Red" x="5.4257932" y="136.88908">MACH</text>
        );
    }

    if (!showMach) {
        return null;
    }

    return (
        <text id="CurrentMachText" className="FontLargest StartAlign Green" x="5.566751" y="137.03004">{`.${machPermille}`}</text>
    );
};

const V1Offtape = ({ airspeed, v1 }) => {
    if (v1 - airspeed > DisplayRange) {
        return (
            <text id="V1SpeedText" className="FontTiny Cyan" x="21.271021" y="43.23">{Math.round(v1)}</text>
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
        const neutralPos = 80.823;
        let pathString;
        if (sign > 0) {
            pathString = `m15.455 ${neutralPos + offset} l -1.2531 2.4607 M15.455 ${neutralPos + offset} l 1.2531 2.4607`;
        } else {
            pathString = `m15.455 ${neutralPos + offset} l 1.2531 -2.4607 M15.455 ${neutralPos + offset} l -1.2531 -2.4607`;
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
