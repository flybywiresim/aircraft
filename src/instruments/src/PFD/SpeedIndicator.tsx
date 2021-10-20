import React, { memo, useEffect, useMemo, useState } from 'react';
import { Arinc429Word } from '@instruments/common/arinc429';
import { VerticalTape, BarberpoleIndicator } from './PFDUtils';
import { getSimVar } from '../util.js';
import { Knots } from '../../../../typings';

const ValueSpacing = 10;
const DistanceSpacing = 10;
const DisplayRange = 42;

interface GraduationElementProps {
    speed: number;
    offset: number;
}

const GraduationElement = memo<GraduationElementProps>(({ speed, offset }) => {
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
            <text className="FontMedium MiddleAlign White" x="7.7348943" y="82.936722">{text}</text>
        </g>
    );
});

interface BugProps {
    offset: number;
}

const V1BugElement = memo<BugProps>(({ offset }) => {
    console.log('V1BugElement: render');

    return (
        <g id="V1BugGroup" transform={`translate(0 ${offset})`}>
            <path className="NormalStroke Cyan" d="m16.613 80.82h5.4899" />
            <text className="FontLarge MiddleAlign Cyan" x="26.205544" y="82.96">1</text>
        </g>
    );
});

const VRBugElement = memo<BugProps>(({ offset }) => {
    console.log('VRBugElement: render');

    return (
        <path
            id="RotateSpeedMarker"
            className="NormalStroke Cyan"
            transform={`translate(0 ${offset})`}
            d="m21.549 80.82a1.2592 1.2599 0 1 0-2.5184 0 1.2592 1.2599 0 1 0 2.5184 0z"
        />
    );
});

const GreenDotBugElement = memo<BugProps>(({ offset }) => {
    console.log(`GreenDotBugElement: render: (${offset})`);

    return (
        <g id="GreenDotSpeedMarker" transform={`translate(0 ${offset})`}>
            <path className="ThickOutline" d="m20.29 80.85a1.2592 1.2599 0 1 0-2.5184 0 1.2592 1.2599 0 1 0 2.5184 0z" />
            <path
                className="ThickStroke Green"
                d="m20.29 80.85a1.2592 1.2599 0 1 0-2.5184 0 1.2592 1.2599 0 1 0 2.5184 0z"
            />
        </g>
    );
});

const FlapRetractBugElement = memo<BugProps>(({ offset }) => {
    console.log('FlapRetractBugElement: render');

    return (
        <g id="FlapsSlatsBug" transform={`translate(0 ${offset})`}>
            <path className="NormalStroke Green" d="m19.031 80.82h3.8279" />
            <text className="FontLarge MiddleAlign Green" x="27.236509" y="83.327988">F</text>
        </g>
    );
});

const SlatRetractBugElement = memo<BugProps>(({ offset }) => {
    console.log('SlatRetractBugElement: render');

    return (
        <g id="FlapsSlatsBug" transform={`translate(0 ${offset})`}>
            <path className="NormalStroke Green" d="m19.031 80.82h3.8279" />
            <text className="FontLarge MiddleAlign Green" x="27.236509" y="83.327988">S</text>
        </g>
    );
});

const VFENextBugElement = memo<BugProps>(({ offset }) => {
    console.log('VFENextBugElement: render');

    return (
        <path
            id="VFeNextMarker"
            transform={`translate(0 ${offset})`}
            className="NormalStroke Amber"
            d="m19.031 81.34h-2.8709m0-1.0079h2.8709"
        />
    );
});

const VAlphaProtBar = (offset: number) => (
    <path transform={`translate(0 ${offset})`} className="BarAmber" d="m21.952 82.254v1.5119m-0.94654-2.923h0.94654v1.4111h-2.9213v-1.4111z" />);

const VMaxBar = (offset: number) => (
    <path transform={`translate(0 ${offset})`} className="BarRed" d="m22.053 78.381v-2.6206m-3.022 5.0397h3.022v-2.4191h-3.022z" />
);

interface VProtBugProps {
    offset: number;
}

const VProtBug = memo<VProtBugProps>(({ offset }) => {
    console.log(`VProtBug: render (${offset})`);

    return (
        <g id="SpeedProtSymbol" transform={`translate(0 ${offset})`}>
            <path className="NormalOutline" d="m13.994 81.289h3.022m-3.022-1.0079h3.022" />
            <path className="NormalStroke Green" d="m13.994 81.289h3.022m-3.022-1.0079h3.022" />
            <path
                style={{ display: 'none' }}
                className="NormalStroke Amber"
                d="m14.615 79.915 1.7808 1.7818m-1.7808 0 1.7808-1.7818"
            />
        </g>
    );
});

interface AirspeedIndicatorProps {
    airspeed: number;
    airspeedAcc: number;
    FWCFlightPhase: number;
    altitude: Arinc429Word;
    VLs: number;
    VMax: number;
    showBars: boolean;
}

// FIXME this is not smooth anymore, check for overly aggressive fixing
export const AirspeedIndicator = ({ airspeed, airspeedAcc, FWCFlightPhase, altitude, VLs, VMax, showBars }: AirspeedIndicatorProps) => {
    const clampedSpeed = Math.max(Math.min(airspeed, 660), 30);

    let v1 = NaN;
    if (FWCFlightPhase <= 4) {
        v1 = getSimVar('L:AIRLINER_V1_SPEED', 'knots');
    }

    const ValphaProtection = Math.round(getSimVar('L:A32NX_SPEEDS_ALPHA_PROTECTION', 'number'));
    const ValphaMax = getSimVar('L:A32NX_SPEEDS_ALPHA_MAX', 'number');
    const fixedValphaMax = Number(ValphaMax.toFixed(1));

    const altitudeIsNormalOperation = altitude.isNormalOperation();
    const altitudeValueBelow15000 = altitude.value < 15_000;

    const bugs = useMemo(() => {
        const bugs: JSX.Element[] = [];

        if (showBars) {
            // FIXME need to redo this...
            // bugs.push(...BarberpoleIndicator(airspeed, ValphaProtection, false, DisplayRange, VAlphaProtBar, 2.923));
        }
        // FIXME need to redo this...
        // bugs.push(...BarberpoleIndicator(airspeed, VMax, true, DisplayRange, VMaxBar, 5.040));

        const offset = (value) => -value * DistanceSpacing / ValueSpacing;

        const showVProt = VMax > 240;
        if (showVProt) {
            bugs.push(<VProtBug offset={offset(VMax + 6)} />);
        }

        const flapsHandleIndex = getSimVar('L:A32NX_FLAPS_HANDLE_INDEX', 'Number');

        if (FWCFlightPhase <= 4) {
            if (v1 !== 0) {
                bugs.push(<V1BugElement offset={offset(Math.max(Math.min(v1, 660), 30))} />);
            }
            const vr = getSimVar('L:AIRLINER_VR_SPEED', 'knots');
            if (vr !== 0) {
                bugs.push(<VRBugElement offset={offset(Math.max(Math.min(vr, 660), 30))} />);
            }
        }

        if (flapsHandleIndex === 0) {
            const GreenDotSpeed = getSimVar('L:A32NX_SPEEDS_GD', 'number');
            bugs.push(<GreenDotBugElement offset={offset(GreenDotSpeed)} />);
        } else if (flapsHandleIndex === 1) {
            const SlatRetractSpeed = getSimVar('L:A32NX_SPEEDS_S', 'number');
            bugs.push(<SlatRetractBugElement offset={offset(SlatRetractSpeed)} />);
        } else if (flapsHandleIndex === 2 || flapsHandleIndex === 3) {
            const FlapRetractSpeed = getSimVar('L:A32NX_SPEEDS_F', 'number');
            bugs.push(<FlapRetractBugElement offset={offset(FlapRetractSpeed)} />);
        }

        if (altitudeIsNormalOperation && altitudeValueBelow15000 && flapsHandleIndex < 4) {
            const VFENext = getSimVar('L:A32NX_SPEEDS_VFEN', 'number');
            bugs.push(<VFENextBugElement offset={offset(VFENext)} />);
        }

        return bugs;
    }, [FWCFlightPhase, VMax, ValphaProtection, airspeed, altitudeIsNormalOperation, altitudeValueBelow15000, showBars, v1]);

    const fixedAirspeed = Number(airspeed.toFixed(2));

    return (
        <g id="SpeedTapeElementsGroup">
            <path id="SpeedTapeBackground" className="TapeBackground" d="m1.9058 123.56v-85.473h17.125v85.473z" />
            <SpeedTapeOutline airspeed={airspeed} />
            {/* eslint-disable-next-line max-len */}
            <VerticalTape
                tapeValue={clampedSpeed}
                graduationElementFunction={SpeedTick}
                lowerLimit={30}
                upperLimit={660}
                valueSpacing={ValueSpacing}
                displayRange={DisplayRange + 6}
                distanceSpacing={DistanceSpacing}
            >
                {bugs}
            </VerticalTape>
            <SpeedTrendArrow airspeedAcc={airspeedAcc} />
            {FWCFlightPhase <= 4
            && <V1Offtape airspeed={clampedSpeed} v1={v1} />}
            {showBars
                && (
                    <>
                        <VLsBar airspeed={fixedAirspeed} VLs={VLs} VAlphaProt={ValphaProtection} />
                        <VAlphaLimBar airspeed={fixedAirspeed} VAlphalim={fixedValphaMax} />
                    </>
                )}
        </g>
    );
};

const SpeedTick = (speed, offset) => (
    <GraduationElement key={speed} speed={speed} offset={offset} />
);

export const AirspeedIndicatorFail = memo(() => (
    <>
        <path id="SpeedTapeBackground" className="TapeBackground" d="m1.9058 123.56v-85.473h17.125v85.473z" />
        <text id="SpeedFailText" className="Blink9Seconds FontLargest EndAlign Red" x="17.756115" y="83.386398">
            SPD
        </text>
        <SpeedTapeOutline airspeed={100} isRed />
    </>
));

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

export interface AirspeedIndicatorOfftapeProps {
    airspeed: number,
    targetSpeed: number | null,
    speedIsManaged: boolean,
}

export const AirspeedIndicatorOfftape = memo(({ airspeed, targetSpeed, speedIsManaged }: AirspeedIndicatorOfftapeProps) => {
    const clampedSpeed = Math.max(Math.min(airspeed, 660), 30);
    const clampedTargetSpeed = Math.max(Math.min(targetSpeed ?? 0, 660), 30);

    return (
        <g id="SpeedOfftapeGroup">
            <path id="SpeedTapeOutlineUpper" className="NormalStroke White" d="m1.9058 38.086h21.859" />
            <path id="SpeedTapeOutlineLower" className="NormalStroke White" d="m1.9058 123.56h21.859" />
            <SpeedTarget airspeed={clampedSpeed} targetSpeed={clampedTargetSpeed} isManaged={speedIsManaged} />
            <path className="Fill Yellow SmallOutline" d="m13.994 80.46v0.7257h6.5478l3.1228 1.1491v-3.0238l-3.1228 1.1491z" />
            <path className="Fill Yellow SmallOutline" d="m0.092604 81.185v-0.7257h2.0147v0.7257z" />
        </g>
    );
});

export const AirspeedIndicatorOfftapeFail = () => (
    <>
        <path id="SpeedTapeOutlineUpper" className="NormalStroke Red" d="m1.9058 38.086h21.859" />
        <path id="SpeedTapeOutlineLower" className="NormalStroke Red" d="m1.9058 123.56h21.859" />
    </>
);

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

    const offset = Number((airspeed - targetSpeed) * DistanceSpacing / ValueSpacing).toFixed(1);

    return (
        <path className={`NormalStroke ${color} CornerRound`} transform={`translate(0 ${offset})`} d="m19.274 81.895 5.3577 1.9512v-6.0476l-5.3577 1.9512" />
    );
};

interface SpeedTapeOutlineProps {
    airspeed: Knots,
    isRed?: boolean,
}

const SpeedTapeOutline = memo(({ airspeed, isRed = false }: SpeedTapeOutlineProps) => {
    const length = Math.max(Math.min(airspeed, 72), 30) * 1.01754 + 12.2104;
    const className = isRed ? 'NormalStroke Red' : 'NormalStroke White';

    return (
        <path id="SpeedTapeOutlineRight" className={className} d={`m19.031 38.086v${length}`} />
    );
});

interface MachNumberProps {
    mach: number,
}

export const MachNumber = memo(({ mach }: MachNumberProps) => {
    const machPermille = Math.round(mach * 1000);
    const [showMach, setShowMach] = useState(machPermille > 500);

    useEffect(() => {
        if (showMach && machPermille < 450) {
            setShowMach(false);
        }
        if (!showMach && machPermille > 500) {
            setShowMach(true);
        }
    }, [showMach, machPermille]);

    if (!showMach) {
        return null;
    }

    return (
        <text id="CurrentMachText" className="FontLargest StartAlign Green" x="5.4257932" y="136.88908">{`.${machPermille}`}</text>
    );
});

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
