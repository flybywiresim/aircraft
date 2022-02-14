import React, { memo, useEffect, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { getSmallestAngle } from '@instruments/common/utils';
import { MathUtils } from '@shared/MathUtils';
import { useFlightPlanManager } from '@instruments/common/flightplan';
import { LatLongData } from '@typings/fs-base-ui/html_ui/JS/Types';
import { RangeSetting, Mode, EfisSide, NdSymbol } from '@shared/NavigationDisplay';
import { LateralMode } from '@shared/autopilot';
import { FlightPlan, FlightPlanType } from '../elements/FlightPlan';
import { MapParameters } from '../utils/MapParameters';
import { RadioNeedle } from '../elements/RadioNeedles';
import { ToWaypointIndicator } from '../elements/ToWaypointIndicator';
import { ApproachMessage } from '../elements/ApproachMessage';
import { CrossTrack } from '../elements/CrossTrack';
import { TrackLine } from '../elements/TrackLine';
import { Traffic } from '../elements/Traffic';

export interface ArcModeProps {
    symbols: NdSymbol[],
    adirsAlign: boolean,
    rangeSetting: RangeSetting,
    side: EfisSide,
    ppos: LatLongData,
    mapHidden: boolean,
}

export const ArcMode: React.FC<ArcModeProps> = ({ symbols, adirsAlign, rangeSetting, side, ppos, mapHidden }) => {
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

    const heading = Number(MathUtils.fastToFixed(magHeading, 2));
    let track = Number(MathUtils.fastToFixed(magTrack, 2));

    // Workaround for bug with gps ground track simvar
    if (groundSpeed < 40) {
        track = (0.025 * groundSpeed + 0.00005) * track + (1 - (0.025 * groundSpeed + 0.00005)) * heading;
        track = Number(MathUtils.fastToFixed(track, 2));
    }

    const [mapParams] = useState(() => {
        const params = new MapParameters();
        params.compute(ppos, rangeSetting, 492, trueHeading);

        return params;
    });

    useEffect(() => {
        mapParams.compute(ppos, rangeSetting, 492, trueHeading);
    }, [ppos.lat, ppos.long, magHeading, rangeSetting].map((n) => MathUtils.fastToFixed(n, 6)));

    if (adirsAlign) {
        let tmpFplan;
        if (showTmpFplan) {
            tmpFplan = (
                <FlightPlan
                    x={384}
                    y={620}
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
                <g id="map" clipPath="url(#arc-mode-map-clip)">
                    <g visibility={mapHidden ? 'hidden' : 'visible'}>
                        <FlightPlan
                            x={384}
                            y={620}
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
                            <TrackLine x={384} y={620} heading={heading} track={track} />
                        )}
                    </g>
                    <RadioNeedle index={1} side={side} displayMode={Mode.ARC} centreHeight={620} />
                    <RadioNeedle index={2} side={side} displayMode={Mode.ARC} centreHeight={620} />
                </g>
                <ToWaypointIndicator info={flightPlanManager.getCurrentFlightPlan().computeActiveWaypointStatistics(ppos)} />
                <ApproachMessage info={flightPlanManager.getAirportApproach()} flightPhase={fmgcFlightPhase} />
                <TrackBug heading={heading} track={track} />
                { lsDisplayed && <LsCourseBug heading={heading} lsCourse={lsCourse} /> }
                <SelectedHeadingBug heading={heading} selected={selectedHeading} />
                <Plane />
                <CrossTrack x={390} y={646} />
                <g clipPath="url(#arc-mode-tcas-clip)">
                    <Traffic mode={Mode.ARC} mapParams={mapParams} />
                </g>
            </>
        );
    }
    return (
        <>
            <MapFailOverlay
                rangeSetting={rangeSetting}
            />
            <text x={681} y={28} fontSize={25} className="White" textAnchor="end">PPOS</text>
        </>
    );
};

interface OverlayProps {
    heading: number,
    rangeSetting: number,
    tcasMode: number,
}

const Overlay: React.FC<OverlayProps> = memo(({ heading, rangeSetting, tcasMode }) => (
    <>
        <ArcModeOverlayDefs />

        {/* C = 384,620 */}
        <g transform="rotateX(0deg)" stroke="white" strokeWidth={3} fill="none">
            <g clipPath="url(#arc-mode-overlay-clip-4)">
                <g transform={`rotate(${MathUtils.diffAngle(heading, 60)} 384 620)`}>
                    <ArcModeOverlayHeadingRing />
                </g>
            </g>

            {/* R = 369 */}
            <path
                d="M15,620a369,369 0 1,0 738,0a369,369 0 1,0 -738,0"
                strokeDasharray="15 10.5"
                strokeDashoffset="15"
                clipPath="url(#arc-mode-overlay-clip-3)"
            />
            <text x={58} y={482} fill="#00ffff" stroke="none" fontSize={22}>{(rangeSetting / 4) * 3}</text>
            <text x={709} y={482} textAnchor="end" fill="#00ffff" stroke="none" fontSize={22}>{(rangeSetting / 4) * 3}</text>

            {/* R = 246 */}
            <path
                d="M138,620a246,246 0 1,0 492,0a246,246 0 1,0 -492,00"
                strokeDasharray="15 10"
                strokeDashoffset="-6"
                clipPath="url(#arc-mode-overlay-clip-2)"
            />
            <text x={175} y={528} fill="#00ffff" stroke="none" fontSize={22}>{rangeSetting / 2}</text>
            <text x={592} y={528} textAnchor="end" fill="#00ffff" stroke="none" fontSize={22}>{rangeSetting / 2}</text>

            {/* R = 123 */}
            { (tcasMode === 0 || rangeSetting > 10) && (
                <path
                    d="M261,620a123,123 0 1,0 246,0a123,123 0 1,0 -246,00"
                    strokeDasharray="15 10"
                    strokeDashoffset="-4.2"
                    clipPath="url(#arc-mode-overlay-clip-1)"
                />
            )}
            { (tcasMode > 0 && rangeSetting === 10) && (
                <g>
                    <line x1={384} x2={384} y1={497 - 6} y2={497 + 6} className="White rounded" transform="rotate(-60 384 620)" />
                    <line x1={384} x2={384} y1={497 - 6} y2={497 + 6} className="White rounded" transform="rotate(-30 384 620)" />
                    <line x1={384} x2={384} y1={497 - 6} y2={497 + 6} className="White rounded" transform="rotate(0 384 620)" />
                    <line x1={384} x2={384} y1={497 - 6} y2={497 + 6} className="White rounded" transform="rotate(30 384 620)" />
                    <line x1={384} x2={384} y1={497 - 6} y2={497 + 6} className="White rounded" transform="rotate(60 384 620)" />
                </g>
            )}

            {/* R = 62 */}
            { (tcasMode > 0 && rangeSetting === 20) && (
                <g>
                    <line x1={384} x2={384} y1={558 - 6} y2={558 + 6} className="White rounded" transform="rotate(-60 384 620)" />
                    <line x1={384} x2={384} y1={558 - 6} y2={558 + 6} className="White rounded" transform="rotate(-30 384 620)" />
                    <line x1={384} x2={384} y1={558 - 6} y2={558 + 6} className="White rounded" transform="rotate(0 384 620)" />
                    <line x1={384} x2={384} y1={558 - 6} y2={558 + 6} className="White rounded" transform="rotate(30 384 620)" />
                    <line x1={384} x2={384} y1={558 - 6} y2={558 + 6} className="White rounded" transform="rotate(60 384 620)" />
                </g>
            )}
        </g>
    </>
));

const ArcModeOverlayDefs = memo(() => (
    <>
        <clipPath id="arc-mode-map-clip">
            <path d="M0,312 a492,492 0 0 1 768,0 L768,562 L648,562 L591,625 L591,768 L174,768 L174,683 L122,625 L0,625 L0,312" />
        </clipPath>
        <clipPath id="arc-mode-wx-terr-clip">
            <path d="M0,312 a492,492 0 0 1 768,0 L768,562 L648,562 L591,625 L0,625 L0,312" />
        </clipPath>
        <clipPath id="arc-mode-tcas-clip">
            <path d="M0,312 a492,492 0 0 1 768,0 L768,562 L648,562 L591,625 L591,768 L174,768 L174,683 L122,625 L0,625 L0,312" />
        </clipPath>
        <clipPath id="arc-mode-overlay-clip-4">
            <path d="m 6 0 h 756 v 768 h -756 z" />
        </clipPath>
        <clipPath id="arc-mode-overlay-clip-3">
            <path d="m 0 564 l 384 145 l 384 -145 v -564 h -768 z" />
        </clipPath>
        <clipPath id="arc-mode-overlay-clip-2">
            <path d="m 0 532 l 384 155 l 384 -146 v -512 h -768 z" />
        </clipPath>
        <clipPath id="arc-mode-overlay-clip-1">
            <path d="m 0 519 l 384 145 l 384 -86 v -580 h -768 z" />
        </clipPath>
    </>
));

const ArcModeOverlayHeadingRing = memo(() => (
    <>
        {/* R = 492 */}
        <path
            d="M-108,620a492,492 0 1,0 984,0a492,492 0 1,0 -984,0"
            strokeWidth={3.25}
        />

        <g transform="rotate(-60 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">0</text>
        </g>
        <g transform="rotate(-55 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(-50 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">1</text>
        </g>
        <g transform="rotate(-45 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(-40 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">2</text>
        </g>
        <g transform="rotate(-35 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(-30 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">3</text>
        </g>
        <g transform="rotate(-25 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(-20 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">4</text>
        </g>
        <g transform="rotate(-15 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(-10 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">5</text>
        </g>
        <g transform="rotate(-5 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(0 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">6</text>
        </g>
        <g transform="rotate(5 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(10 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={95} textAnchor="middle" fontSize={22} fill="white" stroke="none">7</text>
        </g>
        <g transform="rotate(15 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(20 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={95} textAnchor="middle" fontSize={22} fill="white" stroke="none">8</text>
        </g>
        <g transform="rotate(25 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(30 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">9</text>
        </g>
        <g transform="rotate(35 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(40 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">10</text>
        </g>
        <g transform="rotate(45 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(50 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">11</text>
        </g>
        <g transform="rotate(55 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(60 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">12</text>
        </g>
        <g transform="rotate(65 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(70 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">13</text>
        </g>
        <g transform="rotate(75 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(80 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">14</text>
        </g>
        <g transform="rotate(85 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(90 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">15</text>
        </g>
        <g transform="rotate(95 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(100 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">16</text>
        </g>
        <g transform="rotate(105 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(110 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">17</text>
        </g>
        <g transform="rotate(115 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(120 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">18</text>
        </g>
        <g transform="rotate(125 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(130 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">19</text>
        </g>
        <g transform="rotate(135 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(140 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">20</text>
        </g>
        <g transform="rotate(145 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(150 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">21</text>
        </g>
        <g transform="rotate(155 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(160 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">22</text>
        </g>
        <g transform="rotate(165 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(170 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">23</text>
        </g>
        <g transform="rotate(175 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(180 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">24</text>
        </g>
        <g transform="rotate(185 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(190 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">25</text>
        </g>
        <g transform="rotate(195 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(200 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">26</text>
        </g>
        <g transform="rotate(205 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(210 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">27</text>
        </g>
        <g transform="rotate(215 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(220 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">28</text>
        </g>
        <g transform="rotate(225 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(230 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">29</text>
        </g>
        <g transform="rotate(235 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(240 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">30</text>
        </g>
        <g transform="rotate(245 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(250 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">31</text>
        </g>
        <g transform="rotate(255 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(260 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">32</text>
        </g>
        <g transform="rotate(265 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(270 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">33</text>
        </g>
        <g transform="rotate(275 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(280 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">34</text>
        </g>
        <g transform="rotate(285 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
        <g transform="rotate(290 384 620)">
            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">35</text>
        </g>
        <g transform="rotate(295 384 620)">
            <line x1={384} y1={128} x2={384} y2={113} strokeWidth={2.5} />
        </g>
    </>
));

type MapFailOverlayProps = {
    rangeSetting: RangeSetting,
}

const MapFailOverlay: React.FC<MapFailOverlayProps> = memo(({ rangeSetting }) => (
    <>
        <>
            <text className="Red" fontSize={30} textAnchor="middle" x={384} y={241}>HDG</text>
            <text className="Red" fontSize={30} textAnchor="middle" x={384} y={320.6}>MAP NOT AVAIL</text>
        </>

        <clipPath id="arc-mode-map-clip">
            <path d="M-384,-308 a492,492 0 0 1 768,0 L384,-58 L264,-58 L207,5 L207,148 L-210,148 L-210,63 L-262,5 L-384,5 L-384,-308" />
        </clipPath>
        <clipPath id="arc-mode-overlay-clip-4">
            <path d="m 6 0 h 756 v 768 h -756 z" />
        </clipPath>
        <clipPath id="arc-mode-overlay-clip-3">
            <path d="m 0 564 l 384 145 l 384 -145 v -564 h -768 z" />
        </clipPath>
        <clipPath id="arc-mode-overlay-clip-2">
            <path d="m 0 532 l 384 155 l 384 -146 v -512 h -768 z" />
        </clipPath>
        <clipPath id="arc-mode-overlay-clip-1">
            <path d="m 0 519 l 384 145 l 384 -86 v -580 h -768 z" />
        </clipPath>

        {/* C = 384,620 */}
        <g stroke="white" strokeWidth={3} fill="none">
            <g clipPath="url(#arc-mode-overlay-clip-4)">
                <g>
                    {/* R = 492 */}
                    <path
                        d="M-108,620a492,492 0 1,0 984,0a492,492 0 1,0 -984,0"
                        strokeWidth={3.25}
                        stroke="red"
                    />

                </g>
            </g>

            {/* R = 369 */}
            <path
                d="M15,620a369,369 0 1,0 738,0a369,369 0 1,0 -738,0"
                strokeDasharray="15 10.5"
                strokeDashoffset="15"
                clipPath="url(#arc-mode-overlay-clip-3)"
                stroke="red"
            />
            <text x={58} y={482} fill="#00ffff" stroke="none" fontSize={22}>{(rangeSetting / 4) * 3}</text>
            <text x={709} y={482} textAnchor="end" fill="#00ffff" stroke="none" fontSize={22}>{(rangeSetting / 4) * 3}</text>

            {/* R = 246 */}
            <path
                d="M138,620a246,246 0 1,0 492,0a246,246 0 1,0 -492,00"
                strokeDasharray="15 10"
                strokeDashoffset="-6"
                clipPath="url(#arc-mode-overlay-clip-2)"
                stroke="red"
            />
            <text x={168} y={528} fill="#00ffff" stroke="none" fontSize={22}>{rangeSetting / 2}</text>
            <text x={592} y={528} textAnchor="end" fill="#00ffff" stroke="none" fontSize={22}>{rangeSetting / 2}</text>

            {/* R = 123 */}
            <path
                d="M261,620a123,123 0 1,0 246,0a123,123 0 1,0 -246,00"
                strokeDasharray="15 10"
                strokeDashoffset="-4.2"
                clipPath="url(#arc-mode-overlay-clip-1)"
                stroke="red"
            />
        </g>
        <>
            <clipPath id="mask">
                <rect x={372} y={615} width={24} height={20} />
            </clipPath>
            <circle cx={384} cy={634} r={10} fill="none" stroke="red" strokeWidth={3.25} clipPath="url(#mask)" />
        </>
    </>
));

const Plane: React.FC = memo(() => (
    <g>
        <line id="lubber-shadow" x1={384} y1={108} x2={384} y2={148} className="shadow" strokeWidth={5.5} strokeLinejoin="round" strokeLinecap="round" />
        <line id="lubber" x1={384} y1={108} x2={384} y2={148} className="Yellow" strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
        <image x={342} y={596} width={84} height={71} xlinkHref="/Images/ND/AIRPLANE.svg" />
    </g>
));

const TrackBug: React.FC<{heading: number, track: number}> = memo(({ heading, track }) => {
    const diff = getSmallestAngle(track, heading);
    if (diff > 48) {
        return null;
    }
    return (
        <>
            <path
                d="M384,128 L378,138 L384,148 L390,138 L384,128"
                transform={`rotate(${diff} 384 620)`}
                className="shadow rounded"
                strokeWidth={3.5}
            />
            <path
                d="M384,128 L378,138 L384,148 L390,138 L384,128"
                transform={`rotate(${diff} 384 620)`}
                className="Green rounded"
                strokeWidth={3}
            />
        </>
    );
});

const LsCourseBug: React.FC<{heading: number, lsCourse: number}> = ({ heading, lsCourse }) => {
    const diff = getSmallestAngle(lsCourse, heading);
    if (lsCourse < 0 || Math.abs(diff) > 48) {
        return null;
    }

    return (
        <>
            <path
                d="M384,122 L384,74 M376,114 L392,114"
                transform={`rotate(${diff} 384 620)`}
                className="shadow rounded"
                strokeWidth={2.5}
            />
            <path
                d="M384,122 L384,74 M376,114 L392,114"
                transform={`rotate(${diff} 384 620)`}
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
    if (Math.abs(diff) <= 48) {
        return (
            <>
                <path
                    d="M382,126 L370,99 L398,99 L386,126"
                    transform={`rotate(${diff} 384 620)`}
                    className="shadow rounded"
                    strokeWidth={3.5}
                />
                <path
                    d="M382,126 L370,99 L398,99 L386,126"
                    transform={`rotate(${diff} 384 620)`}
                    className="Cyan rounded"
                    strokeWidth={3}
                />
            </>
        );
    }
    return (
        <text
            x={384}
            y={60}
            textAnchor="middle"
            transform={`rotate(${(diff) < 0 ? -38 : 38} 384 620)`}
            className="Cyan shadow"
            fontSize={22}
        >
            {`${Math.round(selected).toString().padStart(3, '0')}`}
        </text>
    );
};
