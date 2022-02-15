import React, { FC, memo, useEffect, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Layer, getSmallestAngle } from '@instruments/common/utils';
import { useFlightPlanManager } from '@instruments/common/flightplan';
import { MathUtils } from '@shared/MathUtils';
import { TuningMode } from '@fmgc/radionav';
import { Mode, EfisSide, NdSymbol } from '@shared/NavigationDisplay';
import { LateralMode } from '@shared/autopilot';
import { ToWaypointIndicator } from '../elements/ToWaypointIndicator';
import { FlightPlan, FlightPlanType } from '../elements/FlightPlan';
import { MapParameters } from '../utils/MapParameters';
import { RadioNeedle } from '../elements/RadioNeedles';
import { ApproachMessage } from '../elements/ApproachMessage';
import { CrossTrack } from '../elements/CrossTrack';
import { TrackLine } from '../elements/TrackLine';
import { Traffic } from '../elements/Traffic';

export interface RoseModeProps {
    symbols: NdSymbol[],
    adirsAlign: boolean,
    rangeSetting: number,
    mode: Mode.ROSE_ILS | Mode.ROSE_VOR | Mode.ROSE_NAV,
    side: EfisSide,
    ppos: LatLongData,
    mapHidden: boolean,
}

export const RoseMode: FC<RoseModeProps> = ({ symbols, adirsAlign, rangeSetting, mode, side, ppos, mapHidden }) => {
    const flightPlanManager = useFlightPlanManager();

    const [magHeading] = useSimVar('PLANE HEADING DEGREES MAGNETIC', 'degrees');
    const [magTrack] = useSimVar('GPS GROUND MAGNETIC TRACK', 'degrees');
    const [trueHeading] = useSimVar('PLANE HEADING DEGREES TRUE', 'degrees');
    const [tcasMode] = useSimVar('L:A32NX_SWITCH_TCAS_Position', 'number');
    const [fmgcFlightPhase] = useSimVar('L:A32NX_FMGC_FLIGHT_PHASE', 'enum');
    const [selectedHeading] = useSimVar('L:A32NX_AUTOPILOT_HEADING_SELECTED', 'degrees');
    const [lsCourse] = useSimVar('L:A32NX_FM_LS_COURSE', 'number');
    const [lsDisplayed] = useSimVar(`L:BTN_LS_${side === 'L' ? 1 : 2}_FILTER_ACTIVE`, 'bool'); // TODO rename simvar
    const [showTmpFplan] = useSimVar('L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN', 'bool');
    const [fmaLatMode] = useSimVar('L:A32NX_FMA_LATERAL_MODE', 'enum', 200);
    const [fmaLatArmed] = useSimVar('L:A32NX_FMA_LATERAL_ARMED', 'enum', 200);
    const [groundSpeed] = useSimVar('GPS GROUND SPEED', 'Meters per second', 200);

    const heading = Math.round(Number(MathUtils.fastToFixed(magHeading, 1)) * 1000) / 1000;
    let track = Math.round(Number(MathUtils.fastToFixed(magTrack, 1)) * 1000) / 1000;

    // Workaround for bug with gps ground track simvar
    if (groundSpeed < 40) {
        track = (0.025 * groundSpeed + 0.00005) * track + (1 - (0.025 * groundSpeed + 0.00005)) * heading;
    }

    const [mapParams] = useState(() => {
        const params = new MapParameters();
        params.compute(ppos, rangeSetting / 2, 250, trueHeading);

        return params;
    });

    useEffect(() => {
        mapParams.compute(ppos, rangeSetting / 2, 250, trueHeading);
    }, [ppos.lat, ppos.long, trueHeading, rangeSetting].map((n) => MathUtils.fastToFixed(n, 6)));

    if (adirsAlign) {
        let tmpFplan;
        if (showTmpFplan) {
            tmpFplan = (
                <FlightPlan
                    x={384}
                    y={384}
                    flightPlanManager={flightPlanManager}
                    symbols={symbols}
                    mapParams={mapParams}
                    debug={false}
                    type={FlightPlanType.Temp}
                />
            );
        }
        return (
            <>
                <Overlay
                    heading={heading}
                    rangeSetting={rangeSetting}
                    tcasMode={tcasMode}
                />
                <g id="map" clipPath="url(#rose-mode-map-clip)">
                    { mode === Mode.ROSE_NAV && (
                        <g visibility={mapHidden ? 'hidden' : 'visible'}>
                            <FlightPlan
                                x={384}
                                y={384}
                                flightPlanManager={flightPlanManager}
                                symbols={symbols}
                                mapParams={mapParams}
                                debug={false}
                                type={
                                    /* TODO FIXME: Check if intercepts active leg */
                                    (fmaLatMode === LateralMode.NONE
                                        || fmaLatMode === LateralMode.HDG
                                        || fmaLatMode === LateralMode.TRACK)
                                        && !fmaLatArmed
                                        ? FlightPlanType.Dashed
                                        : FlightPlanType.Nav
                                }
                            />
                            {tmpFplan}
                            { (((fmaLatMode === LateralMode.NONE
                                || fmaLatMode === LateralMode.HDG
                                || fmaLatMode === LateralMode.TRACK) && !fmaLatArmed) || !flightPlanManager.getCurrentFlightPlan().length) && (
                                <TrackLine x={384} y={384} heading={heading} track={track} />
                            )}
                        </g>
                    )}
                    <RadioNeedle index={1} side={side} displayMode={mode} centreHeight={384} />
                    <RadioNeedle index={2} side={side} displayMode={mode} centreHeight={384} />
                </g>

                { mode === Mode.ROSE_VOR && <VorCaptureOverlay heading={magHeading} side={side} /> }

                { mode === Mode.ROSE_ILS && <IlsCaptureOverlay heading={magHeading} _side={side} /> }

                { mode === Mode.ROSE_NAV && <ToWaypointIndicator info={flightPlanManager.getCurrentFlightPlan().computeActiveWaypointStatistics(ppos)} /> }
                { mode === Mode.ROSE_VOR && <VorInfo side={side} /> }
                { mode === Mode.ROSE_ILS && <IlsInfo /> }

                <ApproachMessage info={flightPlanManager.getAirportApproach()} flightPhase={fmgcFlightPhase} />
                <TrackBug heading={heading} track={track} />
                { mode === Mode.ROSE_NAV && lsDisplayed && <LsCourseBug heading={heading} lsCourse={lsCourse} /> }
                <SelectedHeadingBug heading={heading} selected={selectedHeading} />
                { mode === Mode.ROSE_ILS && <GlideSlope /> }
                <Plane />
                {mode === Mode.ROSE_NAV && <CrossTrack x={390} y={407} />}
                <g clipPath="url(#rose-mode-tcas-clip)">
                    <Traffic mode={mode} mapParams={mapParams} />
                </g>
            </>
        );
    }
    return (
        <>
            <MapFailOverlay rangeSetting={rangeSetting} />

            <text x={681} y={28} fontSize={25} className="White" textAnchor="end">PPOS</text>
        </>
    );
};

interface OverlayProps {
    heading: number,
    rangeSetting: number,
    tcasMode: number,
}

const Overlay: FC<OverlayProps> = ({ heading, rangeSetting, tcasMode }) => (
    <>
        <RoseModeOverlayDefs />

        {/* C = 384,384 */}
        <g transform="rotateX(0deg)" stroke="white" strokeWidth={3} fill="none">
            <g clipPath="url(#arc-mode-overlay-clip-4)">
                <g transform={`rotate(${MathUtils.diffAngle(heading, 0)} 384 384)`}>
                    <RoseModeOverlayHeadingRing />
                </g>
            </g>
            {/* R = 125, middle range ring */}
            { (tcasMode === 0 || rangeSetting > 10)
                    && (
                        <path
                            d="M 509 384 A 125 125 0 0 1 259 384 M 259 384 A 125 125 180 0 1 509 384"
                            strokeDasharray="15 10"
                            strokeDashoffset="-4.2"
                        />
                    )}

            {/* middle range ring replaced with tcas range ticks */}
            { (tcasMode > 0 && rangeSetting === 10)
                    && (
                        <g>
                            <line x1={384} x2={384} y1={264} y2={254} className="White rounded" transform="rotate(0 384 384)" />
                            <line x1={384} x2={384} y1={264} y2={254} className="White rounded" transform="rotate(30 384 384)" />
                            <line x1={384} x2={384} y1={264} y2={254} className="White rounded" transform="rotate(60 384 384)" />
                            <line x1={384} x2={384} y1={264} y2={254} className="White rounded" transform="rotate(90 384 384)" />
                            <line x1={384} x2={384} y1={264} y2={254} className="White rounded" transform="rotate(120 384 384)" />
                            <line x1={384} x2={384} y1={264} y2={254} className="White rounded" transform="rotate(150 384 384)" />
                            <line x1={384} x2={384} y1={264} y2={254} className="White rounded" transform="rotate(180 384 384)" />
                            <line x1={384} x2={384} y1={264} y2={254} className="White rounded" transform="rotate(210 384 384)" />
                            <line x1={384} x2={384} y1={264} y2={254} className="White rounded" transform="rotate(240 384 384)" />
                            <line x1={384} x2={384} y1={264} y2={254} className="White rounded" transform="rotate(270 384 384)" />
                            <line x1={384} x2={384} y1={264} y2={254} className="White rounded" transform="rotate(300 384 384)" />
                            <line x1={384} x2={384} y1={264} y2={254} className="White rounded" transform="rotate(330 384 384)" />
                        </g>
                    )}

            {/* R = 62, tcas range ticks */}
            { (tcasMode > 0 && rangeSetting === 20)
                    && (
                        <g>
                            <line x1={384} x2={384} y1={327} y2={317} className="White rounded" transform="rotate(0 384 384)" />
                            <line x1={384} x2={384} y1={327} y2={317} className="White rounded" transform="rotate(30 384 384)" />
                            <line x1={384} x2={384} y1={327} y2={317} className="White rounded" transform="rotate(60 384 384)" />
                            <line x1={384} x2={384} y1={327} y2={317} className="White rounded" transform="rotate(90 384 384)" />
                            <line x1={384} x2={384} y1={327} y2={317} className="White rounded" transform="rotate(120 384 384)" />
                            <line x1={384} x2={384} y1={327} y2={317} className="White rounded" transform="rotate(150 384 384)" />
                            <line x1={384} x2={384} y1={327} y2={317} className="White rounded" transform="rotate(180 384 384)" />
                            <line x1={384} x2={384} y1={327} y2={317} className="White rounded" transform="rotate(210 384 384)" />
                            <line x1={384} x2={384} y1={327} y2={317} className="White rounded" transform="rotate(240 384 384)" />
                            <line x1={384} x2={384} y1={327} y2={317} className="White rounded" transform="rotate(270 384 384)" />
                            <line x1={384} x2={384} y1={327} y2={317} className="White rounded" transform="rotate(300 384 384)" />
                            <line x1={384} x2={384} y1={327} y2={317} className="White rounded" transform="rotate(330 384 384)" />
                        </g>
                    )}

            <text x={212} y={556} className="Cyan" fontSize={22}>{rangeSetting / 2}</text>
            <text x={310} y={474} className="Cyan" fontSize={22}>{rangeSetting / 4}</text>

            {/* fixed triangle markers every 45 deg except 12 o'clock */}
            <path d="M384,132 L379,123 L389,123 L384,132" transform="rotate(45 384 384)" fill="white" />
            <path d="M384,132 L379,123 L389,123 L384,132" transform="rotate(90 384 384)" fill="white" />
            <path d="M384,132 L379,123 L389,123 L384,132" transform="rotate(135 384 384)" fill="white" />
            <path d="M384,132 L379,123 L389,123 L384,132" transform="rotate(180 384 384)" fill="white" />
            <path d="M384,132 L379,123 L389,123 L384,132" transform="rotate(225 384 384)" fill="white" />
            <path d="M384,132 L379,123 L389,123 L384,132" transform="rotate(270 384 384)" fill="white" />
            <path d="M384,132 L379,123 L389,123 L384,132" transform="rotate(315 384 384)" fill="white" />
        </g>
    </>
);

const RoseModeOverlayDefs = memo(() => (
    <>
        <clipPath id="rose-mode-map-clip">
            <path d="M45,155 L282,155 a250,250 0 0 1 204,0 L723,155 L723,562 L648,562 L591,625 L591,768 L174,768 L174,683 L122,625 L45,625 L45,155" />
        </clipPath>
        <clipPath id="rose-mode-wx-terr-clip">
            <path d="M45,155 L282,155 a250,250 0 0 1 204,0 L723,155 L723,384 L45,384 L45,155" />
        </clipPath>
        <clipPath id="rose-mode-tcas-clip">
            <path d="M45,155 L282,155 a250,250 0 0 1 204,0 L723,155 L723,562 L648,562 L591,625 L591,768 L174,768 L174,683 L122,625 L45,625 L45,155" />
        </clipPath>
    </>
));

const RoseModeOverlayHeadingRing = memo(() => (
    <>
        {/* R = 250 */}
        <circle cx={384} cy={384} r={250} />

        <g transform="rotate(0 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
            <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">0</text>
        </g>

        <g transform="rotate(5 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(10 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(15 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(20 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(25 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(30 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
            <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">3</text>
        </g>

        <g transform="rotate(35 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(40 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(45 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(50 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(55 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(60 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
            <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">6</text>
        </g>

        <g transform="rotate(65 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(70 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(75 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(80 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(85 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(90 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
            <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">9</text>
        </g>

        <g transform="rotate(95 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(100 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(105 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(110 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(115 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(120 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
            <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">12</text>
        </g>

        <g transform="rotate(125 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(130 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(135 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(140 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(145 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(150 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
            <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">15</text>
        </g>

        <g transform="rotate(155 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(160 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(165 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(170 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(175 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(180 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
            <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">18</text>
        </g>

        <g transform="rotate(185 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(190 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(195 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(200 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(205 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(210 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
            <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">21</text>
        </g>

        <g transform="rotate(215 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(220 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(225 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(230 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(235 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(240 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
            <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">24</text>
        </g>

        <g transform="rotate(245 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(250 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(255 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(260 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(265 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(270 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
            <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">27</text>
        </g>

        <g transform="rotate(275 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(280 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(285 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(290 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(295 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(300 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
            <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">30</text>
        </g>

        <g transform="rotate(305 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(310 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(315 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(320 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(325 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(330 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
            <text x={384} y={112} textAnchor="middle" fontSize={22} fill="white" stroke="none">33</text>
        </g>

        <g transform="rotate(335 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(340 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(345 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>

        <g transform="rotate(350 384 384)">
            <line x1={384} y1={134} x2={384} y2={122} strokeWidth={2.5} />
        </g>

        <g transform="rotate(355 384 384)">
            <line x1={384} y1={134} x2={384} y2={128} strokeWidth={2.5} />
        </g>
    </>
));

const MapFailOverlay: FC<Pick<OverlayProps, 'rangeSetting'>> = memo(({ rangeSetting }) => (
    <>
        <text className="Red" fontSize={30} textAnchor="middle" x={384} y={241}>HDG</text>
        <text className="Red" fontSize={30} textAnchor="middle" x={384} y={320.6}>MAP NOT AVAIL</text>

        <clipPath id="rose-mode-map-clip">
            <path d="M-339,-229 L-102,-229 a250,250 0 0 1 204,0 L339,-229 L339,178 L264,178 L207,241 L207,384 L-210,384 L-210,299 L-262,241 L-339,241 L-339,-229" />
        </clipPath>

        {/* C = 384,384 */}
        <g stroke="white" strokeWidth={3} fill="none">
            <g clipPath="url(#arc-mode-overlay-clip-4)">
                <g>
                    {/* R = 250 */}
                    <circle cx={384} cy={384} r={250} stroke="red" />
                </g>
            </g>
            {/* R = 125, middle range ring */}
            <path
                d="M 509 384 A 125 125 0 0 1 259 384 M 259 384 A 125 125 180 0 1 509 384"
                stroke="red"
            />
        </g>
        <text x={212} y={556} className="Cyan" fontSize={22}>{rangeSetting / 2}</text>
        <text x={310} y={474} className="Cyan" fontSize={22}>{rangeSetting / 4}</text>
    </>
));

const VorCaptureOverlay: React.FC<{
    heading: number,
    side: EfisSide,
}> = ({ heading, side }) => {
    const index = side === 'L' ? 1 : 2;
    const [course] = useSimVar(`NAV OBS:${index}`, 'degrees');
    const [courseDeviation] = useSimVar(`NAV RADIAL ERROR:${index}`, 'degrees', 20);
    const [available] = useSimVar(`NAV HAS NAV:${index}`, 'number');
    const [toward, setToward] = useState(true);
    const [cdiPx, setCdiPx] = useState(12);

    useEffect(() => {
        let cdiDegrees: number;
        if (Math.abs(courseDeviation) <= 90) {
            cdiDegrees = courseDeviation;
            setToward(true);
        } else {
            cdiDegrees = Math.sign(courseDeviation) * -Avionics.Utils.diffAngle(180, Math.abs(courseDeviation));
            setToward(false);
        }
        setCdiPx(Math.min(12, Math.max(-12, cdiDegrees)) * 74 / 5);
    }, [courseDeviation.toFixed(2)]);

    return (
        <g transform={`rotate(${course - heading} 384 384)`} stroke="white" strokeWidth={3} fill="none">
            <g id="vor-deviation-scale">
                <circle cx={236} cy={384} r={5} />
                <circle cx={310} cy={384} r={5} />
                <circle cx={458} cy={384} r={5} />
                <circle cx={532} cy={384} r={5} />
            </g>
            <path
                d="M352,256 L416,256 M384,134 L384,294 M384,474 L384,634"
                className="shadow rounded"
                id="vor-course-pointer-shadow"
                strokeWidth={4.5}
            />
            <path
                d="M352,256 L416,256 M384,134 L384,294 M384,474 L384,634"
                className="Cyan rounded"
                id="vor-course-pointer"
                strokeWidth={4}
            />
            { available
                && (
                    <>
                        <path
                            d="M372,322 L384,304 L396,322"
                            className="shadow rounded"
                            transform={`translate(${cdiPx}, ${toward ? 0 : 160}) rotate(${toward ? 0 : 180} 384 304)`}
                            id="vor-deviation-direction-shadow"
                            strokeWidth={4.5}
                        />
                        <path
                            d="M384,304 L384,464"
                            className="shadow rounded"
                            transform={`translate(${cdiPx}, 0)`}
                            id="vor-deviation-shadow"
                            strokeWidth={4.5}
                        />
                        <path
                            d="M372,322 L384,304 L396,322"
                            className="Cyan rounded"
                            transform={`translate(${cdiPx}, ${toward ? 0 : 160}) rotate(${toward ? 0 : 180} 384 304)`}
                            id="vor-deviation-direction"
                            strokeWidth={4}
                        />
                        <path
                            d="M384,304 L384,464"
                            className="Cyan rounded"
                            transform={`translate(${cdiPx}, 0)`}
                            id="vor-deviation"
                            strokeWidth={4}
                        />
                    </>
                )}
        </g>
    );
};

const IlsCaptureOverlay: React.FC<{
    heading: number,
    _side: EfisSide,
}> = memo(({ heading, _side }) => {
    const [course] = useSimVar('NAV LOCALIZER:3', 'degrees');
    const [courseDeviation] = useSimVar('NAV RADIAL ERROR:3', 'degrees', 20);
    const [available] = useSimVar('NAV HAS LOCALIZER:3', 'number');
    const [cdiPx, setCdiPx] = useState(12);

    useEffect(() => {
        // TODO back-course
        setCdiPx(Math.min(12, Math.max(-12, courseDeviation)) * 74 / 5);
    }, [courseDeviation.toFixed(2)]);

    return (
        <g transform={`rotate(${course - heading} 384 384)`} stroke="white" strokeWidth={3} fill="none">
            <g id="ils-deviation-scale">
                <circle cx={236} cy={384} r={5} />
                <circle cx={310} cy={384} r={5} />
                <circle cx={458} cy={384} r={5} />
                <circle cx={532} cy={384} r={5} />
            </g>
            <path
                d="M352,256 L416,256 M384,134 L384,294 M384,474 L384,634"
                className="shadow rounded"
                id="ils-course-pointer-shadow"
                strokeWidth={4.5}
            />
            <path
                d="M352,256 L416,256 M384,134 L384,294 M384,474 L384,634"
                className="Magenta rounded"
                id="ils-course-pointer"
                strokeWidth={4}
            />
            { available
                && (
                    <>
                        <path
                            d="M384,304 L384,464"
                            className="shadow rounded"
                            transform={`translate(${cdiPx}, 0)`}
                            id="ils-deviation-shadow"
                            strokeWidth={4.5}
                        />
                        <path
                            d="M384,304 L384,464"
                            className="Magenta rounded"
                            transform={`translate(${cdiPx}, 0)`}
                            id="ils-deviation"
                            strokeWidth={4}
                        />
                    </>
                )}
        </g>
    );
});

const Plane: React.FC = () => (
    <g>
        <line id="lubber-shadow" x1={384} y1={116} x2={384} y2={152} className="shadow" strokeWidth={5.5} strokeLinejoin="round" strokeLinecap="round" />
        <line id="lubber" x1={384} y1={116} x2={384} y2={152} className="Yellow" strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
        <image x={342} y={357} width={84} height={71} xlinkHref="/Images/ND/AIRPLANE.svg" />
    </g>
);

const TrackBug: React.FC<{heading: number, track: number}> = memo(({ heading, track }) => {
    const diff = getSmallestAngle(track, heading);
    return (
        <>
            <path
                d="M384,134 L379,143 L384,152 L389,143 L384,134"
                transform={`rotate(${diff} 384 384)`}
                className="shadow rounded"
                strokeWidth={3.5}
            />
            <path
                d="M384,134 L379,143 L384,152 L389,143 L384,134"
                transform={`rotate(${diff} 384 384)`}
                className="Green rounded"
                strokeWidth={3}
            />
        </>
    );
});

const LsCourseBug: React.FC<{heading: number, lsCourse: number}> = ({ heading, lsCourse }) => {
    if (lsCourse < 0) {
        return null;
    }

    const diff = getSmallestAngle(lsCourse, heading);
    return (
        <>
            <path
                d="M384,128 L384,96 M376,120 L392,120"
                transform={`rotate(${diff} 384 384)`}
                className="shadow rounded"
                strokeWidth={2.5}
            />
            <path
                d="M384,128 L384,96 M376,120 L392,120"
                transform={`rotate(${diff} 384 384)`}
                className="Magenta rounded"
                strokeWidth={2}
            />
        </>
    );
};

const SelectedHeadingBug: React.FC<{heading: number, selected: number}> = ({ heading, selected }) => {
    if (selected < 0) {
        return null;
    }

    const diff = getSmallestAngle(selected, heading);
    return (
        <>
            <path
                d="M380,132 L372,114 L396,114 L388,132"
                transform={`rotate(${diff} 384 384)`}
                className="shadow rounded"
                strokeWidth={3.5}
            />
            <path
                d="M380,132 L372,114 L396,114 L388,132"
                transform={`rotate(${diff} 384 384)`}
                className="Cyan rounded"
                strokeWidth={3}
            />
        </>
    );
};

const formatTuningMode = (tuningMode: TuningMode): string => {
    switch (tuningMode) {
    case TuningMode.Manual:
        return 'M';
    case TuningMode.Remote:
        return 'R';
    default:
        return '';
    }
};

const VorInfo: FC<{side: EfisSide}> = memo(({ side }) => {
    const index = side === 'R' ? 2 : 1;

    const [vorIdent] = useSimVar(`NAV IDENT:${index}`, 'string');
    const [vorFrequency] = useSimVar(`NAV ACTIVE FREQUENCY:${index}`, 'megahertz');
    const [vorCourse] = useSimVar(`NAV OBS:${index}`, 'degrees');
    const [tuningMode] = useSimVar(`L:A32NX_FMGC_RADIONAV_${index}_TUNING_MODE`, 'enum');
    const [vorAvailable] = useSimVar(`NAV HAS NAV:${index}`, 'boolean');

    const [freqInt, freqDecimal] = vorFrequency.toFixed(2).split('.', 2);

    const [tuningModeLabel, setTuningModeLabel] = useState('');
    useEffect(() => {
        setTuningModeLabel(formatTuningMode(tuningMode));
    }, [tuningMode]);

    return (
        <Layer x={748} y={28}>
            <text x={-102} y={0} fontSize={25} className="White" textAnchor="end">
                VOR
                {index}
            </text>
            { vorAvailable && (
                <text x={0} y={0} fontSize={25} className="White" textAnchor="end">
                    {freqInt}
                    <tspan fontSize={20}>
                        .
                        {freqDecimal}
                    </tspan>
                </text>
            ) }
            <text x={-56} y={30} fontSize={25} className="White" textAnchor="end">CRS</text>
            <text x={20} y={30} fontSize={25} className="Cyan" textAnchor="end">
                {vorCourse >= 0 ? (`${Math.round(vorCourse)}`).padStart(3, '0') : '---'}
                &deg;
            </text>
            { vorFrequency > 0 && <text x={-80} y={58} fontSize={20} className="White" textAnchor="end" textDecoration="underline">{tuningModeLabel}</text> }
            <text x={0} y={60} fontSize={25} className="White" textAnchor="end">{vorIdent}</text>
        </Layer>
    );
});

const IlsInfo: FC = memo(() => {
    const [ilsIdent] = useSimVar('NAV IDENT:3', 'string');
    const [ilsFrequency] = useSimVar('NAV ACTIVE FREQUENCY:3', 'megahertz');
    const [ilsCourse] = useSimVar('NAV LOCALIZER:3', 'degrees');
    const [tuningMode] = useSimVar('L:A32NX_FMGC_RADIONAV_3_TUNING_MODE', 'enum');
    const [locAvailable] = useSimVar('NAV HAS LOCALIZER:3', 'boolean');

    const [freqInt, freqDecimal] = ilsFrequency.toFixed(2).split('.', 2);

    const [tuningModeLabel, setTuningModeLabel] = useState('');
    useEffect(() => {
        setTuningModeLabel(formatTuningMode(tuningMode));
    }, [tuningMode]);

    return (
        <Layer x={748} y={28}>
            <text x={-102} y={0} fontSize={25} className="White" textAnchor="end">ILS1</text>
            { locAvailable && (
                <text x={0} y={0} fontSize={25} className="Magenta" textAnchor="end">
                    {freqInt}
                    <tspan fontSize={20}>
                        .
                        {freqDecimal}
                    </tspan>
                </text>
            ) }
            <text x={-56} y={30} fontSize={25} className="White" textAnchor="end">CRS</text>
            <text x={20} y={30} fontSize={25} className="Magenta" textAnchor="end">
                {locAvailable ? (`${Math.round(ilsCourse)}`).padStart(3, '0') : '---'}
                &deg;
            </text>
            { ilsFrequency > 0 && <text x={-80} y={58} fontSize={20} className="White" textAnchor="end" textDecoration="underline">{tuningModeLabel}</text> }
            <text x={0} y={60} fontSize={25} className="Magenta" textAnchor="end">{ilsIdent}</text>
        </Layer>
    );
});

const GlideSlope: FC = () => {
    // TODO need some photo refs for this
    const [gsDeviation] = useSimVar('NAV GLIDE SLOPE ERROR:3', 'degrees');
    const [gsAvailable] = useSimVar('NAV HAS GLIDE SLOPE:3', 'number');

    const deviationPx = gsDeviation / 0.8 * 128;

    return (
        <>
            <Layer x={750} y={384}>
                <circle cx={0} cy={-128} r={4} strokeWidth={2.5} className="White" />
                <circle cx={0} cy={-64} r={4} strokeWidth={2.5} className="White" />
                <line x1={-12} x2={12} y1={0} y2={0} className="Yellow" strokeWidth={5} />
                <circle cx={0} cy={64} r={4} strokeWidth={2.5} className="White" />
                <circle cx={0} cy={128} r={4} strokeWidth={2.5} className="White" />
            </Layer>
            <Layer x={750} y={384}>
                <path
                    d="M10,0 L0,-16 L-10,0"
                    transform={`translate(0 ${Math.max(-128, deviationPx)})`}
                    className="Magenta rounded"
                    strokeWidth={2.5}
                    visibility={(gsAvailable && deviationPx < 128) ? 'visible' : 'hidden'}
                />
                <path
                    d="M-10,0 L0,16 L10,0"
                    transform={`translate(0 ${Math.min(128, deviationPx)})`}
                    className="Magenta rounded"
                    strokeWidth={2.5}
                    visibility={(gsAvailable && deviationPx > -128) ? 'visible' : 'hidden'}
                />
            </Layer>
        </>
    );
};
