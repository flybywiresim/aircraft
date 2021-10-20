import { Arinc429Word } from '@instruments/common/arinc429.js';
import React, { memo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { getSimVar } from '../util.js';

export const AttitudeIndicatorFixedUpper = memo(() => (
    <g id="AttitudeUpperInfoGroup">
        <g id="RollProtGroup" className="NormalStroke Green">
            <path id="RollProtRight" d="m105.64 62.887 1.5716-0.8008m-1.5716-0.78293 1.5716-0.8008" />
            <path id="RollProtLeft" d="m32.064 61.303-1.5716-0.8008m1.5716 2.3845-1.5716-0.8008" />
        </g>
        <g id="RollProtLost" style={{ display: 'none' }} className="NormalStroke Amber">
            <path id="RollProtLostRight" d="m107.77 60.696-1.7808 1.7818m1.7808 0-1.7808-1.7818" />
            <path id="RollProtLostLeft" d="m30.043 62.478 1.7808-1.7818m-1.7808 0 1.7808 1.7818" />
        </g>
        <g className="NormalStroke White">
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
));

interface AttitudeIndicatorFixedCenterProps {
    isOnGround: boolean;
    FDActive: boolean;
    isAttExcessive: boolean;
}

export const AttitudeIndicatorFixedCenter = memo(({ isOnGround, FDActive, isAttExcessive }: AttitudeIndicatorFixedCenterProps) => (
    <g id="AttitudeSymbolsGroup">
        <path className="Yellow Fill" d="m115.52 80.067v1.5119h-8.9706v-1.5119z" />
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
    </g>
));

export const AttitudeIndicatorFixedCenterFail = memo(() => (
    <text id="AttFailText" className="Blink9Seconds FontLargest Red EndAlign" x="75.893127" y="83.136955">ATT</text>
));

const FDYawBar = ({ FDActive }) => {
    const [lateralMode] = useSimVar('L:A32NX_FMA_LATERAL_MODE', 'number');
    const [FDYawCommand] = useSimVar('L:A32NX_FLIGHT_DIRECTOR_YAW', 'number');

    if (!FDActive || !(lateralMode === 40 || lateralMode === 33 || lateralMode === 34)) {
        return null;
    }

    const offset = Math.round(-Math.max(Math.min(FDYawCommand, 45), -45) * 0.44);

    return (
        <path id="GroundYawSymbol" className="NormalStroke Green" transform={`translate(${offset} 0)`} d="m67.899 82.536v13.406h2.0147v-13.406l-1.0074-1.7135z" />
    );
};

const FlightDirector = ({ FDActive }) => {
    const [lateralAPMode] = useSimVar('L:A32NX_FMA_LATERAL_MODE', 'number');
    const [verticalAPMode] = useSimVar('L:A32NX_FMA_VERTICAL_MODE', 'enum');
    const [fdRollOrder] = useSimVar('L:A32NX_FLIGHT_DIRECTOR_BANK', 'number');
    const [fdPitchOrder] = useSimVar('L:A32NX_FLIGHT_DIRECTOR_PITCH', 'number');
    const [trkFpaModeActive] = useSimVar('L:A32NX_TRK_FPA_MODE_ACTIVE', 'bool');

    if (!FDActive || trkFpaModeActive) {
        return null;
    }

    const showLateralFD = lateralAPMode !== 0 && lateralAPMode !== 34 && lateralAPMode !== 40;
    const showVerticalFD = verticalAPMode !== 0 && verticalAPMode !== 34;

    let FDRollOffset = 0;
    let FDPitchOffset = 0;

    if (showLateralFD) {
        FDRollOffset = Number((Math.min(Math.max(fdRollOrder, -45), 45) * 0.44).toFixed(1));
    }

    if (showVerticalFD) {
        FDPitchOffset = Number((Math.min(Math.max(fdPitchOrder, -22.5), 22.5) * 0.89).toFixed(1));
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

const SidestickIndicator = ({ isOnGround }) => {
    const [eng1Running] = useSimVar('GENERAL ENG COMBUSTION:1', 'bool', 500);
    const [eng2Running] = useSimVar('GENERAL ENG COMBUSTION:2', 'bool', 500);
    const [stickPosX] = useSimVar('L:A32NX_SIDESTICK_POSITION_X', 'number');
    const [stickPosY] = useSimVar('L:A32NX_SIDESTICK_POSITION_Y', 'number');

    const oneEngineRunning = eng1Running || eng2Running;

    if (!isOnGround || !oneEngineRunning) {
        return null;
    }

    const stickOffsetX = stickPosX * 29.56;
    const stickOffsetY = -stickPosY * 23.02;

    return (
        <g id="GroundCursorGroup" className="NormalStroke White">
            <path id="GroundCursorBorders" d="m92.327 103.75h6.0441v-6.0476m-58.93 0v6.0476h6.0441m46.842-45.861h6.0441v6.0476m-58.93 0v-6.0476h6.0441" />
            {/* eslint-disable-next-line max-len */}
            <path id="GroundCursorCrosshair" transform={`translate(${stickOffsetX} ${stickOffsetY})`} d="m73.994 81.579h-4.3316v4.3341m-5.8426-4.3341h4.3316v4.3341m5.8426-5.846h-4.3316v-4.3341m-5.8426 4.3341h4.3316v-4.3341" />
        </g>
    );
};
