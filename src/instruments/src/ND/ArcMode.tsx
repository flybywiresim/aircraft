import React, { memo, useEffect, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { MathUtils } from '@shared/MathUtils';
import { FlightPlan } from './FlightPlan';
import { MapParameters } from './utils/MapParameters';
import { RadioNeedle } from './RadioNeedles';

const rangeSettings = [10, 20, 40, 80, 160, 320];

export type ArcModeProps = { side: 'L' | 'R' }

export const ArcMode: React.FC<ArcModeProps> = ({ side }) => {
    const [lat] = useSimVar('PLANE LATITUDE', 'degree latitude');
    const [long] = useSimVar('PLANE LONGITUDE', 'degree longitude');
    const [magHeading] = useSimVar('PLANE HEADING DEGREES MAGNETIC', 'degrees');
    const [trueHeading] = useSimVar('PLANE HEADING DEGREES TRUE', 'degrees');
    const [rangeIndex] = useSimVar(side === 'L' ? 'L:A32NX_EFIS_L_ND_RANGE' : 'L:A32NX_EFIS_R_ND_RANGE', 'number', 100);

    const [mapParams] = useState(() => {
        const params = new MapParameters();
        params.compute({ lat, long }, rangeSettings[rangeIndex] * 2, 768, trueHeading);

        return params;
    });

    useEffect(() => {
        mapParams.compute({ lat, long }, rangeSettings[rangeIndex] * 2, 768, trueHeading);
    }, [lat, long, magHeading, rangeIndex].map((n) => MathUtils.fastToFixed(n, 6)));

    return (
        <>
            <FlightPlan y={236} mapParams={mapParams} clipPath="url(#arc-mode-flight-plan-clip)" debug />

            <Overlay heading={Number(MathUtils.fastToFixed(magHeading, 1))} rangeIndex={rangeIndex} side={side} />
        </>
    );
};

type OverlayProps = { heading: number, rangeIndex: number, side: 'L' | 'R' }

const Overlay: React.FC<OverlayProps> = memo(({ heading, rangeIndex, side }) => {
    const range = rangeSettings[rangeIndex];

    return (
        <>
            <clipPath id="arc-mode-flight-plan-clip">
                <circle cx={384} cy={620} r={724} />
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
            <g transform="rotateX(0deg)" stroke="white" strokeWidth={3} fill="none">
                <g clipPath="url(#arc-mode-overlay-clip-4)">
                    <g transform={`rotate(${MathUtils.diffAngle(heading, 60)} 384 620)`}>
                        {/* R = 492 */}
                        <path
                            d="M-108,620a492,492 0 1,0 984,0a492,492 0 1,0 -984,0"
                            strokeWidth={3.25}
                        />

                        <g transform="rotate(-60 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">0</text>
                        </g>
                        <g transform="rotate(-50 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">1</text>
                        </g>
                        <g transform="rotate(-40 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">2</text>
                        </g>
                        <g transform="rotate(-30 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">3</text>
                        </g>
                        <g transform="rotate(-20 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">4</text>
                        </g>
                        <g transform="rotate(-10 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">5</text>
                        </g>
                        <g transform="rotate(0 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">6</text>
                        </g>
                        <g transform="rotate(10 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={95} textAnchor="middle" fontSize={22} fill="white" stroke="none">7</text>
                        </g>
                        <g transform="rotate(20 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={95} textAnchor="middle" fontSize={22} fill="white" stroke="none">8</text>
                        </g>
                        <g transform="rotate(30 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">9</text>
                        </g>
                        <g transform="rotate(40 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">10</text>
                        </g>
                        <g transform="rotate(50 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">11</text>
                        </g>
                        <g transform="rotate(60 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">12</text>
                        </g>
                        <g transform="rotate(70 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">13</text>
                        </g>
                        <g transform="rotate(80 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">14</text>
                        </g>
                        <g transform="rotate(90 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">15</text>
                        </g>
                        <g transform="rotate(100 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">16</text>
                        </g>
                        <g transform="rotate(110 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">17</text>
                        </g>
                        <g transform="rotate(120 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">18</text>
                        </g>
                        <g transform="rotate(130 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">19</text>
                        </g>
                        <g transform="rotate(140 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">20</text>
                        </g>
                        <g transform="rotate(150 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">21</text>
                        </g>
                        <g transform="rotate(160 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">22</text>
                        </g>
                        <g transform="rotate(170 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">23</text>
                        </g>
                        <g transform="rotate(180 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">24</text>
                        </g>
                        <g transform="rotate(190 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">25</text>
                        </g>
                        <g transform="rotate(200 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">26</text>
                        </g>
                        <g transform="rotate(210 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">27</text>
                        </g>
                        <g transform="rotate(220 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">28</text>
                        </g>
                        <g transform="rotate(230 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">29</text>
                        </g>
                        <g transform="rotate(240 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">30</text>
                        </g>
                        <g transform="rotate(250 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">31</text>
                        </g>
                        <g transform="rotate(260 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">32</text>
                        </g>
                        <g transform="rotate(270 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={34} fill="white" stroke="none">33</text>
                        </g>
                        <g transform="rotate(280 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">34</text>
                        </g>
                        <g transform="rotate(290 384 620)">
                            <line x1={384} y1={128} x2={384} y2={99} strokeWidth={2.5} />

                            <text x={384} y={91} textAnchor="middle" fontSize={22} fill="white" stroke="none">35</text>
                        </g>
                    </g>
                </g>

                {/* R = 369 */}
                <path
                    d="M15,620a369,369 0 1,0 738,0a369,369 0 1,0 -738,0"
                    strokeDasharray="15 10.5"
                    strokeDashoffset="15"
                    clipPath="url(#arc-mode-overlay-clip-3)"
                />
                <text x={58} y={482} fill="#00ffff" stroke="none" fontSize={22}>{(range / 4) * 3}</text>
                <text x={709} y={482} textAnchor="end" fill="#00ffff" stroke="none" fontSize={22}>{(range / 4) * 3}</text>

                {/* R = 246 */}
                <path
                    d="M138,620a246,246 0 1,0 492,0a246,246 0 1,0 -492,00"
                    strokeDasharray="15 10"
                    strokeDashoffset="-6"
                    clipPath="url(#arc-mode-overlay-clip-2)"
                />
                <text x={168} y={528} fill="#00ffff" stroke="none" fontSize={22}>{range / 2}</text>
                <text x={592} y={528} textAnchor="end" fill="#00ffff" stroke="none" fontSize={22}>{range / 2}</text>

                {/* R = 123 */}
                <path
                    d="M261,620a123,123 0 1,0 246,0a123,123 0 1,0 -246,00"
                    strokeDasharray="15 10"
                    strokeDashoffset="-4.2"
                    clipPath="url(#arc-mode-overlay-clip-1)"
                />
            </g>

            <RadioNeedle index={1} side={side} />
            <RadioNeedle index={2} side={side} />

            <image x={342} y={596} width={84} height={71} xlinkHref="/Images/ND/AIRPLANE.svg" />
        </>
    );
});
