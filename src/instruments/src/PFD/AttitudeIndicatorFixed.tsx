import { Arinc429Word } from '@shared/arinc429';
import { getSmallestAngle } from '@instruments/common/utils.js';
import { LateralMode, VerticalMode } from '@shared/autopilot.js';
import React from 'react';
import { calculateHorizonOffsetFromPitch } from './PFDUtils';
import { getSimVar } from '../util.js';

const DistanceSpacing = 15;
const ValueSpacing = 10;

interface AttitudeIndicatorFixedUpperProps {
    pitch: Arinc429Word;
    roll: Arinc429Word;
}

export const AttitudeIndicatorFixedUpper = ({ pitch, roll }: AttitudeIndicatorFixedUpperProps) => {
    if (!pitch.isNormalOperation() || !roll.isNormalOperation()) {
        return null;
    }

    return (
        <g id="AttitudeUpperInfoGroup">
            <g id="RollProtGroup" className="SmallStroke Green">
                <path id="RollProtRight" d="m105.64 62.887 1.5716-0.8008m-1.5716-0.78293 1.5716-0.8008" />
                <path id="RollProtLeft" d="m32.064 61.303-1.5716-0.8008m1.5716 2.3845-1.5716-0.8008" />
            </g>
            <g id="RollProtLost" style={{ display: 'none' }} className="NormalStroke Amber">
                <path id="RollProtLostRight" d="m107.77 60.696-1.7808 1.7818m1.7808 0-1.7808-1.7818" />
                <path id="RollProtLostLeft" d="m30.043 62.478 1.7808-1.7818m-1.7808 0 1.7808 1.7818" />
            </g>
            <g className="SmallStroke White">
                <path d="m98.645 51.067 2.8492-2.8509" />
                <path d="m39.168 51.067-2.8492-2.8509" />
                <path d="m90.858 44.839a42.133 42.158 0 0 0-43.904 0" />
                <path d="m89.095 43.819 1.8313-3.1738 1.7448 1.0079-1.8313 3.1738" />
                <path d="m84.259 41.563 0.90817-2.4967-1.8932-0.68946-0.90818 2.4966" />
                <path d="m75.229 39.142 0.46109-2.6165 1.9841 0.35005-0.46109 2.6165" />
                <path d="m60.6 39.492-0.46109-2.6165 1.9841-0.35005 0.46109 2.6165" />
                <path d="m53.553 41.563-0.90818-2.4967 0.9466-0.34474 0.9466-0.34472 0.90818 2.4966" />
                <path d="m46.973 44.827-1.8313-3.1738 1.7448-1.0079 1.8313 3.1738" />
            </g>
            <path className="NormalStroke Yellow CornerRound" d="m68.906 38.650-2.5184-3.7000h5.0367l-2.5184 3.7000" />
        </g>
    );
};

interface AttitudeIndicatorFixedCenterProps {
    pitch: Arinc429Word;
    roll: Arinc429Word;
    vs: Arinc429Word;
    gs: Arinc429Word;
    heading: Arinc429Word;
    track: Arinc429Word
    isOnGround: boolean;
    FDActive: boolean;
    isAttExcessive: boolean;
}

export const AttitudeIndicatorFixedCenter = ({ pitch, roll, vs, gs, heading, track, isOnGround, FDActive, isAttExcessive }: AttitudeIndicatorFixedCenterProps) => {
    if (!pitch.isNormalOperation() || !roll.isNormalOperation()) {
        return (
            <text id="AttFailText" className="Blink9Seconds FontLargest Red EndAlign" x="75.893127" y="83.136955">ATT</text>
        );
    }

    return (
        <g id="AttitudeSymbolsGroup">
            <SidestickIndicator isOnGround={isOnGround} />
            <path className="BlackFill" d="m67.647 82.083v-2.5198h2.5184v2.5198z" />
            {!isAttExcessive && (
                <>
                    <FDYawBar FDActive={FDActive} />
                    <FlightDirector FDActive={FDActive} />
                </>
            )}
            <path className="NormalOutline" d="m67.647 82.083v-2.5198h2.5184v2.5198z" />
            <path className="NormalStroke Yellow" d="m67.647 82.083v-2.5198h2.5184v2.5198z" />
            <g className="NormalOutline">
                <path d="m88.55 86.114h2.5184v-4.0317h12.592v-2.5198h-15.11z" />
                <path d="m34.153 79.563h15.11v6.5516h-2.5184v-4.0317h-12.592z" />
            </g>
            <g id="FixedAircraftReference" className="NormalStroke Yellow BlackFill">
                <path d="m88.55 86.114h2.5184v-4.0317h12.592v-2.5198h-15.11z" />
                <path d="m34.153 79.563h15.11v6.5516h-2.5184v-4.0317h-12.592z" />
            </g>
            <FlightPathVector pitch={pitch} roll={roll} vs={vs} gs={gs} heading={heading} track={track} />
            {!isAttExcessive && (
                <FlightPathDirector
                    pitch={pitch}
                    roll={roll}
                    vs={vs}
                    gs={gs}
                    heading={heading}
                    track={track}
                    FDActive={FDActive}
                />
            ) }
        </g>
    );
};

const FDYawBar = ({ FDActive }) => {
    const lateralMode = getSimVar('L:A32NX_FMA_LATERAL_MODE', 'number');

    if (!FDActive || !(lateralMode === LateralMode.RWY || lateralMode === LateralMode.FLARE || lateralMode === LateralMode.ROLL_OUT)) {
        return null;
    }

    const FDYawCommand = getSimVar('L:A32NX_FLIGHT_DIRECTOR_YAW', 'number');
    const offset = -Math.max(Math.min(FDYawCommand, 45), -45) * 0.44;

    return (
        <path id="GroundYawSymbol" className="NormalStroke Green" transform={`translate(${offset} 0)`} d="m67.899 82.536v13.406h2.0147v-13.406l-1.0074-1.7135z" />
    );
};

const FlightDirector = ({ FDActive }) => {
    if (!FDActive || getSimVar('L:A32NX_TRK_FPA_MODE_ACTIVE', 'bool')) {
        return null;
    }

    const lateralAPMode = getSimVar('L:A32NX_FMA_LATERAL_MODE', 'number');
    const verticalAPMode = getSimVar('L:A32NX_FMA_VERTICAL_MODE', 'enum');

    const showLateralFD = lateralAPMode !== LateralMode.NONE && lateralAPMode !== LateralMode.ROLL_OUT && lateralAPMode !== LateralMode.RWY;
    const showVerticalFD = verticalAPMode !== VerticalMode.NONE && verticalAPMode !== VerticalMode.ROLL_OUT;

    let FDRollOffset = 0;
    let FDPitchOffset = 0;

    if (showLateralFD) {
        const FDRollOrder = getSimVar('L:A32NX_FLIGHT_DIRECTOR_BANK', 'number');
        FDRollOffset = Math.min(Math.max(FDRollOrder, -45), 45) * 0.44;
    }

    if (showVerticalFD) {
        const FDPitchOrder = getSimVar('L:A32NX_FLIGHT_DIRECTOR_PITCH', 'number');
        FDPitchOffset = Math.min(Math.max(FDPitchOrder, -22.5), 22.5) * 0.89;
    }

    return (
        <>
            <g className="ThickOutline">
                {showLateralFD
                    && <path transform={`translate(${FDRollOffset} 0)`} d="m68.903 61.672v38.302" />}
                {showVerticalFD
                    && <path transform={`translate(0 ${FDPitchOffset})`} d="m49.263 80.823h39.287" />}
            </g>
            <g className="ThickStroke Green">
                {showLateralFD
                && <path id="FlightDirectorRoll" transform={`translate(${FDRollOffset} 0)`} d="m68.903 61.672v38.302" />}
                {showVerticalFD
                && <path id="FlightDirectorPitch" transform={`translate(0 ${FDPitchOffset})`} d="m49.263 80.823h39.287" />}
            </g>
        </>
    );
};

interface FPVProps {
    pitch: Arinc429Word;
    roll: Arinc429Word;
    vs: Arinc429Word;
    gs: Arinc429Word;
    heading: Arinc429Word;
    track: Arinc429Word
}
const FlightPathVector = ({ pitch, roll, vs, gs, heading, track }: FPVProps) => {
    if (!getSimVar('L:A32NX_TRK_FPA_MODE_ACTIVE', 'bool')) {
        return null;
    }

    // TODO FPA and DA should come directly from the IR, and not be calculated here.
    const FPA = Math.atan(vs.value / gs.value * 0.009875) * 180 / Math.PI;
    const DA = getSmallestAngle(track.value, heading.value);

    const daLimConv = Math.max(Math.min(DA, 21), -21) * DistanceSpacing / ValueSpacing;
    const pitchSubFpaConv = (calculateHorizonOffsetFromPitch(-pitch.value) - calculateHorizonOffsetFromPitch(FPA));
    const rollCos = Math.cos(roll.value * Math.PI / 180);
    const rollSin = Math.sin(roll.value * Math.PI / 180);

    const xOffset = daLimConv * rollCos - pitchSubFpaConv * rollSin;
    const yOffset = pitchSubFpaConv * rollCos + daLimConv * rollSin;

    return (
        <g transform={`translate(${xOffset} ${yOffset})`}>
            <svg x="53.4" y="65.3" width="31px" height="31px" version="1.1" viewBox="0 0 31 31" xmlns="http://www.w3.org/2000/svg">
                <g>
                    <path
                        className="NormalOutline"
                        // eslint-disable-next-line max-len
                        d="m17.766 15.501c8.59e-4 -1.2531-1.0142-2.2694-2.2665-2.2694-1.2524 0-2.2674 1.0163-2.2665 2.2694-8.57e-4 1.2531 1.0142 2.2694 2.2665 2.2694 1.2524 0 2.2674-1.0163 2.2665-2.2694z"
                    />
                    <path className="ThickOutline" d="m17.766 15.501h5.0367m-9.5698 0h-5.0367m7.3033-2.2678v-2.5199" />
                    <path
                        className="NormalStroke Green"
                        // eslint-disable-next-line max-len
                        d="m17.766 15.501c8.59e-4 -1.2531-1.0142-2.2694-2.2665-2.2694-1.2524 0-2.2674 1.0163-2.2665 2.2694-8.57e-4 1.2531 1.0142 2.2694 2.2665 2.2694 1.2524 0 2.2674-1.0163 2.2665-2.2694z"
                    />
                    <path className="ThickStroke Green" d="m17.766 15.501h5.0367m-9.5698 0h-5.0367m7.3033-2.2678v-2.5199" />
                </g>
            </svg>
        </g>
    );
};

interface FPDProps {
    pitch: Arinc429Word;
    roll: Arinc429Word;
    vs: Arinc429Word;
    gs: Arinc429Word;
    heading: Arinc429Word;
    track: Arinc429Word;
    FDActive: boolean;
}
const FlightPathDirector = ({ pitch, roll, vs, gs, heading, track, FDActive }: FPDProps) => {
    if (!FDActive || !getSimVar('L:A32NX_TRK_FPA_MODE_ACTIVE', 'bool')) {
        return null;
    }

    const lateralAPMode = getSimVar('L:A32NX_FMA_LATERAL_MODE', 'number');
    const verticalAPMode = getSimVar('L:A32NX_FMA_VERTICAL_MODE', 'enum');
    const showLateralFD = lateralAPMode !== LateralMode.NONE && lateralAPMode !== LateralMode.ROLL_OUT && lateralAPMode !== LateralMode.RWY;
    const showVerticalFD = verticalAPMode !== VerticalMode.NONE && verticalAPMode !== VerticalMode.ROLL_OUT;

    if (!showVerticalFD && !showLateralFD) {
        return null;
    }

    const FDRollOrder = getSimVar('L:A32NX_FLIGHT_DIRECTOR_BANK', 'number');
    const FDRollOrderLim = Math.max(Math.min(FDRollOrder, 45), -45);
    const FDPitchOrder = getSimVar('L:A32NX_FLIGHT_DIRECTOR_PITCH', 'number');
    const FDPitchOrderLim = Math.max(Math.min(FDPitchOrder, 22.5), -22.5) * 1.9;

    // TODO FPA and DA should come directly from the IR, and not be calculated here.
    const FPA = Math.atan(vs.value / gs.value * 0.009875) * 180 / Math.PI;
    const DA = getSmallestAngle(track.value, heading.value);

    const daLimConv = Math.max(Math.min(DA, 21), -21) * DistanceSpacing / ValueSpacing;
    const pitchSubFpaConv = (calculateHorizonOffsetFromPitch(-pitch.value) - calculateHorizonOffsetFromPitch(FPA));
    const rollCos = Math.cos(roll.value * Math.PI / 180);
    const rollSin = Math.sin(roll.value * Math.PI / 180);

    const FDRollOffset = FDRollOrderLim * 0.77;
    const xOffsetFpv = daLimConv * rollCos - pitchSubFpaConv * rollSin;
    const yOffsetFpv = pitchSubFpaConv * rollCos + daLimConv * rollSin;

    const xOffset = xOffsetFpv - FDPitchOrderLim * rollSin;
    const yOffset = yOffsetFpv + FDPitchOrderLim * rollCos;

    return (
        <g transform={`translate(${xOffset} ${yOffset})`}>
            <svg x="53.4" y="65.3" width="31px" height="31px" version="1.1" viewBox="0 0 31 31" xmlns="http://www.w3.org/2000/svg">
                <g transform={`rotate(${FDRollOffset} 15.5 15.5)`} className="CornerRound">
                    <path
                        className="NormalOutline"
                        // eslint-disable-next-line max-len
                        d="m16.507 15.501a1.0074 1.008 0 1 0-2.0147 0 1.0074 1.008 0 1 0 2.0147 0zm7.5551 0 6.5478-1.5119v3.0238l-6.5478-1.5119m-17.125 0-6.5478-1.5119v3.0238l6.5478-1.5119h17.125"
                    />
                    <path
                        className="NormalStroke Green"
                        // eslint-disable-next-line max-len
                        d="m16.507 15.501a1.0074 1.008 0 1 0-2.0147 0 1.0074 1.008 0 1 0 2.0147 0zm7.5551 0 6.5478-1.5119v3.0238l-6.5478-1.5119m-17.125 0-6.5478-1.5119v3.0238l6.5478-1.5119h17.125"
                    />
                </g>
            </svg>
        </g>
    );
};

const SidestickIndicator = ({ isOnGround }) => {
    const oneEngineRunning = getSimVar('GENERAL ENG COMBUSTION:1', 'bool') || getSimVar('GENERAL ENG COMBUSTION:2', 'bool');
    if (!isOnGround || !oneEngineRunning) {
        return null;
    }

    const SidestickPosX = getSimVar('L:A32NX_SIDESTICK_POSITION_X', 'number') * 29.56;
    const SidestickPosY = -getSimVar('L:A32NX_SIDESTICK_POSITION_Y', 'number') * 23.02;

    return (
        <g id="GroundCursorGroup" className="NormalStroke White">
            <path id="GroundCursorBorders" d="m92.327 103.75h6.0441v-6.0476m-58.93 0v6.0476h6.0441m46.842-45.861h6.0441v6.0476m-58.93 0v-6.0476h6.0441" />
            <path
                id="GroundCursorCrosshair"
                transform={`translate(${SidestickPosX} ${SidestickPosY})`}
                d="m73.994 81.579h-4.3316v4.3341m-5.8426-4.3341h4.3316v4.3341m5.8426-5.846h-4.3316v-4.3341m-5.8426 4.3341h4.3316v-4.3341"
            />
        </g>
    );
};
