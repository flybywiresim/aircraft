import './Bleed.scss';

import React from 'react';
import ReactDOM from 'react-dom';

import { SimVarProvider, useSimVar } from '@instruments/common/simVars';
import { getRenderTarget, setIsEcamPage } from '@instruments/common/defaults';

import { EcamPage } from '../../Common/EcamPage';
import { PageTitle } from '../../Common/PageTitle';
import { ComponentPositionProps } from '../../Common/ComponentPositionProps';
import { SvgGroup } from '../../Common/SvgGroup';

setIsEcamPage('bleed_page');

export const BleedPage = () => {

    const feetToMeters = 0.3048;
    const seaLevelPressurePascal = 101325;
    const barometricPressureFactor = -0.00011857591;
    const pascalToPSI = 0.000145038;
    const inHgToPSI = 0.491154;

    const [apuN] = useSimVar('L:A32NX_APU_N', 'percent', 500);
    const [isApuBleedValueOpen] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'Bool', 500);
    const [isApuMasterSwitchPressed] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'Bool', 500);
    const [isApuBleedSwitchPressed] = useSimVar('L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON', 'Bool', 500);

    const [eng1N2] = useSimVar('L:A32NX_ENGINE_N2:1', 'Number', 500);
    const [eng2N2] = useSimVar('L:A32NX_ENGINE_N2:2', 'Number', 500);
    const [isEng1Running] = useSimVar('L:A32NX_ENGINE_STATE:1', 'Number', 500);
    const [isEng2Running] = useSimVar('L:A32NX_ENGINE_STATE:2', 'Number', 500);
    const [eng1TLA] = useSimVar('L:A32NX_AUTOTHRUST_TLA:1', 'Number', 500);
    const [eng2TLA] = useSimVar('L:A32NX_AUTOTHRUST_TLA:2', 'Number', 500);
    const [fadecStatusEng1] = useSimVar('L:A32NX_FADEC_POWERED_ENG1', 'Bool', 500);
    const [fadecStatusEng2] = useSimVar('L:A32NX_FADEC_POWERED_ENG2', 'Bool', 500);
    const [isEng1ProvideBleed] = useSimVar('BLEED AIR ENGINE:1', 'Bool', 500);
    const [isEng2ProvideBleed] = useSimVar('BLEED AIR ENGINE:2', 'Bool', 500);

    const [isxBleedValueOpen] = useSimVar('L:A32NX_XBLEED_VALVE', 'Bool');
    const [xBleedState] = useSimVar('L:A32NX_KNOB_OVHD_AIRCOND_XBLEED_Position', 'Number', 500);

    const [radioHeight] = useSimVar('RADIO HEIGHT', 'Feet');
    const [groundSpeed] = useSimVar('GPS GROUND SPEED', 'Meters per second');
    const [outsidePressure] = useSimVar('AMBIENT PRESSURE', 'inHg');
    const [cabinAltFeet] = useSimVar('PRESSURIZATION CABIN ALTITUDE', 'feet');

    const [cockpitSelectedAirTemp1] = useSimVar('L:A320_Neo_AIRCOND_LVL_1', 'Number', 500);
    const [cockpitSelectedAirTemp2] = useSimVar('L:A320_Neo_AIRCOND_LVL_2', 'Number', 500);
    const [cockpitSelectedAirTemp3] = useSimVar('L:A320_Neo_AIRCOND_LVL_3', 'Number', 500);
    const requestedPackLvl = Math.min(cockpitSelectedAirTemp1, cockpitSelectedAirTemp2, cockpitSelectedAirTemp3);

    const [packflowPosition] = useSimVar('L:A32NX_KNOB_OVHD_AIRCOND_PACKFLOW_Position', 'Number', 500);
    const [isLeftPackOn] = useSimVar('L:A32NX_AIRCOND_PACK1_TOGGLE', 'Bool', 500);
    const [isRightPackOn] = useSimVar('L:A32NX_AIRCOND_PACK2_TOGGLE', 'Bool', 500);
    const [isRamAirOn] = useSimVar('L:A32NX_AIRCOND_RAMAIR_TOGGLE', 'Bool', 500);

    const cabinAltMeter = cabinAltFeet * feetToMeters;
    const cabinPressurePascal = seaLevelPressurePascal * Math.exp(barometricPressureFactor * cabinAltMeter);
    const cabinPressurePsi = cabinPressurePascal * pascalToPSI;
    const outsidePressurePsi = outsidePressure * inHgToPSI;
    const pressureDifferent = outsidePressurePsi - cabinPressurePsi;

    return (
        <EcamPage name="main-bleed">
            <PageTitle x={8} y={22} text="BLEED" />
            <BleedFiexdElement />
            <Ground />
            <AntiIce />
            <Apu />
            <IpAndHpValves />
            <Xbleed />
            <PackFlow />
            <RamAir />
            <Valves />
            <IsEngineRunning />
            <TempBox x={100} y={317}/>
        </EcamPage>
    );
};

const BleedFiexdElement = () => {
    return (
        <g>
            {/* triangles above and line under them */}
            <polyline className="st5" points="121,68 121,49 479,49 479,68"/>
            <polygon className="st5" points="163,43 177,43 170,30 163,43"/>
            <polygon className="st5" points="293,43 307,43 300,30 293,43"/>
            <polygon className="st5" points="423,43 437,43 430,30 423,43"/>

            {/* pack outlines */}
            <polyline className="st12" points="76,207 76,146 76,77 121,68 166,76 166,207"/>
            <polyline className="st12" points="434,207 434,146 434,77 479,68 524,76 524,207"/>

            {/* indicator arcs */}
            <path className="st12" d="M 76 135 L 88 135 M 154 135 L 166 135"/>
            <path className="st9" d="M 88 135 c 15 -25 51 -25 66 0"/>
            <path className="st9" d="M 121 113 L 121 116"/>

            <path className="st12" d="M 434 135 L 446 135 M 512 135 L 524 135"/>
            <path className="st9" d="M 446 135 c 15 -25 51 -25 66 0"/>
            <path className="st9" d="M 479 113 L 479 116"/>

            <path className="st12" d="M 76 207 L 88 207 M 154 207 L 166 207"/>
            <path className="st9" d="M 88 207 c 15 -25 51 -25 66 0"/>
            <path className="st9" d="M 121 186 L 121 187"/>

            <path className="st12" d="M 434 207 L 446 207 M 512 207 L 524 207"/>
            <path className="st9" d="M 446 207 c 15 -25 51 -25 66 0"/>
            <path className="st9" d="M 479 186 L 479 187"/>

            {/* LO/HI next to packs */}
            <text x={46} y={200} className="st1 st2 st6">LO</text>
            <text x={176} y={200} className="st1 st2 st6">HI</text>

            <text x={404} y={200} className="st1 st2 st6">LO</text>
            <text x={534} y={200} className="st1 st2 st6">HI</text>

            {/* C/H next to packs */}
            <text x={56} y={128} className="st1 st2 st6">C</text>
            <text x={176} y={128} className="st1 st2 st6">H</text>

            <text x={414} y={128} className="st1 st2 st6">C</text>
            <text x={534} y={128} className="st1 st2 st6">H</text>

            {/* pack temps Cs */}
            <text transform="matrix(1 0 0 1 156 102)" className="st8 st2 st13">C</text>
            <text transform="matrix(1 0 0 1 156 171)" className="st8 st2 st13">C</text>
            <text transform="matrix(1 0 0 1 515 102)" className="st8 st2 st13">C</text>
            <text transform="matrix(1 0 0 1 515 171)" className="st8 st2 st13">C</text>
            <text transform="matrix(1 0 0 1 148 102)" className="st8 st2 st13">°</text>
            <text transform="matrix(1 0 0 1 148 171)" className="st8 st2 st13">°</text>
            <text transform="matrix(1 0 0 1 507 102)" className="st8 st2 st13">°</text>
            <text transform="matrix(1 0 0 1 507 171)" className="st8 st2 st13">°</text>

            {/* unused */}
            <line id="center-line-1" className="st5" x1="121" y1="317" x2="121" y2="243"/>
            <line id="center-line-5" className="st5" x1="479" y1="317" x2="479" y2="243"/>
            <line id="center-line-6" className="st5" x1="300" y1="126" x2="300" y2="103"/>
        </g>
    );
};

const IpAndHpValves = () => {
    const [isEng1ProvideBleed] = useSimVar('BLEED AIR ENGINE:1', 'Bool', 500);
    const [isEng2ProvideBleed] = useSimVar('BLEED AIR ENGINE:2', 'Bool', 500);
    const [eng1N2] = useSimVar('L:A32NX_ENGINE_N2:1', 'Number', 500);
    const [eng2N2] = useSimVar('L:A32NX_ENGINE_N2:2', 'Number', 500);
    const [isEng1Running] = useSimVar('L:A32NX_ENGINE_STATE:1', 'Number', 500);
    const [isEng2Running] = useSimVar('L:A32NX_ENGINE_STATE:2', 'Number', 500);
    const [radioHeight] = useSimVar('RADIO HEIGHT', 'Feet', 500);

    const eng1HpValveOpen = isEng1ProvideBleed && isEng1Running && eng1N2 < 60 && radioHeight > 10;
    const eng2HpValveOpen = isEng2ProvideBleed && isEng2Running && eng2N2 < 60 && radioHeight > 10;

    return (
        <>
            <text x={110} y={487} className="st1 st2 st6">IP</text>
            <text x={467} y={487} className="st1 st2 st6">IP</text>
            <text x={199} y={487} className="st1 st2 st6">HP</text>
            <text x={380} y={487} className="st1 st2 st6">HP</text>

            {/* eng1 ip valve */}
            <g className={isEng1ProvideBleed ? "show" : "hide"}>
                <line className="st5" x1="121" y1="391" x2="121" y2="423"/>
                <line id="under-left" className="st5" x1="121" y1="391" x2="121" y2="367"/>
            </g>
            <g className={isEng1ProvideBleed ? "hide" : "show"}>
                <line className="st5" x1="104" y1="407" x2="136" y2="407"/>
            </g>

            {/* eng1 hp valve */}
            <g className={eng1HpValveOpen ? "show" : "hide"}>
                <line className="st5" x1="149" y1="452" x2="181" y2="452"/>
                <line id="left-engine-connection-obj4" className="st5" x1="122" y1="452" x2="150" y2="452"/>
            </g>
            <g className={eng1HpValveOpen ? "hide" : "show"}>
                <line className="st5" x1="165" y1="436" x2="165" y2="468"/>
            </g>

            {/* eng2 ip valve */}
            <g className={isEng2ProvideBleed ? "show" : "hide"}>
                <line className="st5" x1="479" y1="391" x2="479" y2="423"/>
                <line id="under-right" className="st5" x1="479" y1="392" x2="479" y2="367"/>
            </g>
            <g className={isEng2ProvideBleed ? "hide" : "show"}>
                <line className="st5" x1="464" y1="407" x2="496" y2="407"/>
            </g>

            {/* eng2 hp valve */}
            <g className={eng2HpValveOpen ? "show" : "hide"}>
                <line className="st5" x1="418" y1="452" x2="450" y2="452"/>
                <line id="right-engine-connection-obj4" className="st5" x1="451" y1="452" x2="480" y2="452"/>
            </g>
            <g className={eng2HpValveOpen ? "hide" : "show"}>
                <line className="st5" x1="434" y1="437" x2="434.49" y2="469"/>
            </g>
        </>
    );
};

const Valves = () => {
    return (
        <g>
            <circle className="st5" cx="121" cy="407" r="16"/>
            <circle className="st5" cx="479" cy="407" r="16"/>
            <circle className="st5" cx="434" cy="452" r="16"/>
            <circle className="st5" cx="165" cy="452" r="16"/>
            <circle className="st5" cx="358" cy="276" r="16"/>
            <circle className="st5" cx="479" cy="227" r="16"/>
            <circle className="st5" cx="121" cy="227" r="16"/>
            <circle className="st5" cx="300" cy="87" r="16"/>
        </g>
    );
};

const Xbleed = () => {
    const [xBleedState] = useSimVar('L:A32NX_XBLEED_VALVE', 'Bool');

    if (xBleedState) {
        return (
            <>
                <line id="center-line-2" className="st5" x1="121" y1="276" x2="343" y2="276"/>
                <line id="center-line-3" className="st5" x1="374" y1="276" x2="479" y2="276"/>
                <line className="st5" x1="342" y1="276" x2="374" y2="276"/>
            </>
        );
    }
    return (
        <line className="st5" x1="358" y1="260" x2="358" y2="292"/>
    );
};

const Apu = () => {
    const [isApuBleedValueOpen] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'Bool', 500);
    const [isApuMasterSwitchPressed] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'Bool', 500);
    const [isApuBleedSwitchPressed] = useSimVar('L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON', 'Bool', 500);
    const apuStatus = isApuMasterSwitchPressed || isApuBleedSwitchPressed

    return (
        <>
            { apuStatus &&
                <>
                    <text id="APUtext" x={282} y={403} className="st1 st2 st6">APU</text>
                    <circle id="apu-valve" className="st5" cx="300" cy="345" r="16"/>
                    <line id="apu-connecting-line" className="st5" stroke="#db7200" x1="300" y1="360" x2="300" y2="386"/>
                    { isApuBleedValueOpen
                        ? (
                            <g>
                                <line className="st5" x1="300" y1="329" x2="300" y2="361"/>
                                <line id="center-line-2" className="st5" x1="121" y1="276" x2="343" y2="276"/>
                                { apuStatus
                                    ? (
                                        <line id="center-line-4" className="st5" x1="300" y1="276" x2="300" y2="330"/>
                                    ) : (
                                        null
                                    )
                                }
                            </g>
                        ) : (
                            <g>
                                <line className="st5" x1="284" y1="345" x2="316" y2="345"/>
                            </g>
                        )
                    }
                </>
            }
        </>
    );
};

const Ground = () => {
    const [isOnGround] = useSimVar('SIM ON GROUND', 'Bool', 500);
    const [groundSpeed] = useSimVar('GPS GROUND SPEED', 'Meters per second', 500);
    const [isEng1Running] = useSimVar('L:A32NX_ENGINE_STATE:1', 'Number', 500);
    const [isEng2Running] = useSimVar('L:A32NX_ENGINE_STATE:2', 'Number', 500);

    //hide GND during flight/when moving/at least one engine is running
    if (!isOnGround || groundSpeed > 1 || isEng1Running !== 0 || isEng2Running !== 0) {
        return (
            <g>
                <polygon className="st9" points="234,300 250,300 242,286 234,300"/>
                <text x={224.5} y={318} className="st1 st2 st6">GND</text>
            </g>
        )
    };
    return null;
};


const PackFlow = () => {
    const [isLeftPackOn] = useSimVar('L:A32NX_AIRCOND_PACK1_TOGGLE', 'Bool', 500);
    const [isRightPackOn] = useSimVar('L:A32NX_AIRCOND_PACK2_TOGGLE', 'Bool', 500);
    const [isXBleedOpen] = useSimVar('L:A32NX_XBLEED_VALVE', 'Bool');

    const [eng1N2] = useSimVar('L:A32NX_ENGINE_N2:1', 'Number', 500);
    const [eng2N2] = useSimVar('L:A32NX_ENGINE_N2:2', 'Number', 500);
    const isEng1Ignition = eng1N2 > 1 && eng1N2 < 58;
    const isEng2Ignition = eng2N2 > 1 && eng2N2 < 58

    let isLeftPackOpen = isLeftPackOn;
    let isRightPackOpen = isRightPackOn;

    if (isEng1Ignition || isEng2Ignition || isXBleedOpen) {
        isLeftPackOpen = false;
        isRightPackOpen = false;
    } else if (isEng1Ignition && !isXBleedOpen) {
        isLeftPackOpen = false;
    } else if (isEng2Ignition && !isXBleedOpen) {
        isRightPackOpen = false;
    }

    const [cockpitSelectedAirTemp1] = useSimVar('L:A320_Neo_AIRCOND_LVL_1', 'Number', 500);
    const [cockpitSelectedAirTemp2] = useSimVar('L:A320_Neo_AIRCOND_LVL_2', 'Number', 500);
    const [cockpitSelectedAirTemp3] = useSimVar('L:A320_Neo_AIRCOND_LVL_3', 'Number', 500);
    const requestedPackLvl = Math.min(cockpitSelectedAirTemp1, cockpitSelectedAirTemp2, cockpitSelectedAirTemp3);
    const requestedPackLvlRotate = requestedPackLvl * 1.23;

    const [packflowPosition] = useSimVar('L:A32NX_KNOB_OVHD_AIRCOND_PACKFLOW_Position', 'Number', 500);
    const packflowRotate = packflowPosition * 57.5;

    //pack flow indicators, ready for continous knob
    //this.packFlowIndicator[0].setAttribute("style", "transform-origin: 121px 227px; transform: rotate(" + packflowPosition * 57.5 + "deg); stroke-width: 4.5px; stroke-linecap: round;");
    //this.packFlowIndicator[1].setAttribute("style", "transform-origin: 479px 227px; transform: rotate(" + packflowPosition * 57.5 + "deg); stroke-width: 4.5px; stroke-linecap: round;");

    //pack outflow indicators
    //this.packIndicator[0].setAttribute("style", "transform-origin: 479px 152px; transform: rotate(" + packRequestedlvl * 1.23 + "deg); ");
    //this.packIndicator[1].setAttribute("style", "transform-origin: 121px 152px; transform: rotate(" + packRequestedlvl * 1.23 + "deg); ");

    return (
        <>
            <g className={isLeftPackOpen ? "show" : "hide"}>
                <line className="st5" x1="121" y1="212" x2="121" y2="244"/>
            </g>
            <g className={isLeftPackOpen ? "hide" : "show"}>
                <line className="st5" x1="104" y1="227" x2="136" y2="227"/>
            </g>
            <g className={isRightPackOpen ? "show" : "hide"}>
                <line className="st5" x1="479" y1="211" x2="479" y2="243"/>
            </g>
            <g className={isRightPackOpen ? "hide" : "show"}>
                <line className="st5" x1="464" y1="227" x2="496" y2="227"/>
            </g>

            <line id="pack-flow-indicator1" className="st5" strokeWidth="4.5px" strokeLinecap="round" rotate={packflowRotate}
                    x1="106" y1="218" x2="87" y2="206"/>
            <line id="pack-flow-indicator2" className="st5" strokeWidth="4.5px" strokeLinecap="round" rotate={packflowRotate}
                    x1="464" y1="218" x2="445" y2="206"/>

            <line id="pack-out-temp-indicator1" className="st5" strokeWidth="4.5px" strokeLinecap="round" rotate={requestedPackLvlRotate}
                    x1="445" y1="134" x2="479" y2="152"/>
            <line id="pack-out-temp-indicator2" className="st5" strokeWidth="4.5px" strokeLinecap="round" rotate={requestedPackLvlRotate}
                    x1="121" y1="152" x2="87" y2="134"/>
        </>
    );
};

const RamAir = () => {
    const [isRamAirOn] = useSimVar('L:A32NX_AIRCOND_RAMAIR_TOGGLE', 'Bool', 500);

    return (
        <>
            <text x={282} y={146} className="st1 st2 st6">RAM</text>
            <text x={282} y={165} className="st1 st2 st6">AIR</text>
            { isRamAirOn
                ? (
                    <>
                        <line className="st5" x1="284" y1="87" x2="316" y2="87"/>
                        <line id="ram-air-connection-line" className="st5" x1="300" y1="48" x2="300" y2="71"/>
                    </>
                ) : (
                    <line className="st5" x1="300" y1="71" x2="300" y2="103"/>
                )
            }
        </>
    );
};

const AntiIce = () => {
    const [isAntiIceOn] = useSimVar('STRUCTURAL DEICE SWITCH', 'Bool');
    return (
        <g>
            { isAntiIceOn &&
                <g>
                    {/* anti ice indicator */}
                    <polygon className="st5" points="116,268 116,284 102,276 116,268"/>
                    <polygon className="st5" points="484,268 484,284 498,276 484,268"/>

                    {/* anti ice text */}
                    <text x={65} y={268} fontSize="18px" className="st1 st2">ANTI</text>
                    <text x={58} y={285} fontSize="18px" className="st1 st2">ICE</text>

                    <text x={535} y={268} fontSize="18px" className="st1 st2">ANTI</text>
                    <text x={540} y={285} fontSize="18px" className="st1 st2">ICE</text>
                </g>
            }
        </g>
    );
};

const TempBox = ({ x, y }) => {
    const [isEng1ProvideBleed] = useSimVar('BLEED AIR ENGINE:1', 'Bool', 500);
    const [isEng2ProvideBleed] = useSimVar('BLEED AIR ENGINE:2', 'Bool', 500);
    const [isEng1Running] = useSimVar('L:A32NX_ENGINE_STATE:1', 'Number', 500);
    const [isEng2Running] = useSimVar('L:A32NX_ENGINE_STATE:2', 'Number', 500);
    const [eng1TmpValue] = useSimVar('ENG EXHAUST GAS TEMPERATURE:1', 'Celsius', 500);
    const [eng2TmpValue] = useSimVar('ENG EXHAUST GAS TEMPERATURE:2', 'Celsius', 500);
    const [eng1PsiValue] = useSimVar('TURB ENG BLEED AIR:1', 'Ratio (0-16384)', 500);
    const [eng2PsiValue] = useSimVar('TURB ENG BLEED AIR:1', 'Ratio (0-16384)', 500);

    const [isxBleedValueOpen] = useSimVar('L:A32NX_XBLEED_VALVE', 'Bool');

    const [apuN] = useSimVar('L:A32NX_APU_N', 'percent', 500);
    const [isApuBleedValueOpen] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'Bool', 500);
    const [isApuMasterSwitchPressed] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'Bool', 500);
    const [isApuBleedSwitchPressed] = useSimVar('L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON', 'Bool', 500);
    const apuStatus = isApuMasterSwitchPressed || isApuBleedSwitchPressed

    //placeholder logic for packs
    const engTempMultiplier1 = 0.08;
    const engTempMultiplier2 = 0.0000009;
    const engTempMultiplier3 = 0.31;
    const engTempOffsetH = -510;
    const engTempOffsetV = 200;
    const engTempOffsetH2 = -860;
    const engTempOffsetV2 = 276.4;

    const eng1PsiValueCalculated = Math.round(eng1PsiValue / 2.9);
    const eng2PsiValueCalculated = Math.round(eng2PsiValue / 2.9);

    const apuTMPcomputed = Math.round(apuN ? 100 * 2.5 : 0);
    const apuPSI = Math.round(apuN ? 100 * 0.35 : 0);

    let eng1Tmp;
    let eng1Psi;
    let eng2Tmp;
    let eng2Psi;

    let eng1TmpComputed;
    let eng2TmpComputed;

    if (eng1TmpValue < 860) {
        eng1TmpComputed = Math.round((engTempMultiplier1 * (eng1TmpValue + engTempOffsetH)) + (engTempMultiplier2 * Math.pow((eng1TmpValue + engTempOffsetH), 3)) + engTempOffsetV);
    } else {
        eng1TmpComputed = Math.round(engTempMultiplier3 * (eng1TmpValue + engTempOffsetH2) + engTempOffsetV2);
    }

    if (eng2TmpValue < 860) {
        eng2TmpComputed = Math.round(((engTempMultiplier1 * (eng2TmpValue + engTempOffsetH)) + (engTempMultiplier2 * Math.pow((eng2TmpValue + engTempOffsetH), 3)) + engTempOffsetV));
    } else {
        eng2TmpComputed = Math.round(engTempMultiplier3 * (eng2TmpValue + engTempOffsetH2) + engTempOffsetV2);
    }

    if (isEng2ProvideBleed && !isEng1ProvideBleed && !isApuBleedValueOpen && isEng2Running === 1 && !isxBleedValueOpen) {
        eng1Tmp = "XXX";
        eng1Psi = "xx";
        eng2Tmp = eng2TmpComputed;
        eng2Psi = eng2PsiValueCalculated;
    } else if (isEng2ProvideBleed && !isEng1ProvideBleed && isApuBleedValueOpen && isEng2Running === 1 && !isxBleedValueOpen) {
        eng1Tmp = apuTMPcomputed;
        eng1Psi = apuPSI;
        eng2Tmp = eng2TmpComputed;
        eng2Psi = eng2PsiValueCalculated;
    } else if (isEng2ProvideBleed && !isEng1ProvideBleed && isEng2Running === 1 && isxBleedValueOpen) {
        eng1Tmp = eng2TmpComputed;
        eng1Psi = eng2PsiValueCalculated;
        eng2Tmp = eng2TmpComputed;
        eng2Psi = eng2PsiValueCalculated;
    } else if (isxBleedValueOpen && isApuBleedValueOpen && !isEng1ProvideBleed && !isEng2ProvideBleed && apuStatus) {
        eng1Tmp = apuTMPcomputed;
        eng1Psi = apuPSI;
        eng2Tmp = apuTMPcomputed;
        eng2Psi = apuPSI;
    } else if (isEng1ProvideBleed && isEng2ProvideBleed && isxBleedValueOpen && isEng1Running === 1 && isEng2Running === 1) {
        eng1Tmp = eng1TmpComputed;
        eng1Psi = eng1PsiValueCalculated;
        eng2Tmp = eng2TmpComputed;
        eng2Psi = eng2PsiValueCalculated;
    } else if (isEng1ProvideBleed && isEng2ProvideBleed && isxBleedValueOpen && isEng2Running === 1) {
        eng1Tmp = eng2TmpComputed;
        eng1Psi = eng2PsiValueCalculated;
        eng2Tmp = eng2TmpComputed;
        eng2Psi = eng2PsiValueCalculated;
    } else if (isEng1ProvideBleed && !isEng2ProvideBleed && isxBleedValueOpen && isEng1Running === 1) {
        eng1Tmp = eng1TmpComputed;
        eng1Psi = eng1PsiValueCalculated;
        eng2Tmp = eng1TmpComputed;
        eng2Psi = eng1PsiValueCalculated;
    } else if (isEng1ProvideBleed && isEng2ProvideBleed && !isxBleedValueOpen && isEng1Running === 1 && isEng2Running === 1) {
        eng1Tmp = eng1TmpComputed;
        eng1Psi = eng1PsiValueCalculated;
        eng2Tmp = eng2TmpComputed;
        eng2Psi = eng2PsiValueCalculated;
    } else if (!isEng1ProvideBleed && !isEng2ProvideBleed && !isxBleedValueOpen && isApuBleedValueOpen) {
        eng1Tmp = apuTMPcomputed;
        eng1Psi = apuPSI;
        eng2Tmp = "XXX";
        eng2Psi = "xx";
    } else if (isEng1ProvideBleed && isEng1Running === 1 && !isxBleedValueOpen) {
        eng1Tmp = eng1TmpComputed;
        eng1Psi = eng1PsiValueCalculated;
        eng2Tmp = "XXX";
        eng2Psi = "xx";
    } else if (isEng1ProvideBleed && isEng2ProvideBleed && isEng1Running !== 1 && isEng2Running !== 1 && isxBleedValueOpen) {
        eng1Tmp = apuTMPcomputed;
        eng1Psi = apuPSI;
        eng2Tmp = apuTMPcomputed;
        eng2Psi = apuPSI;
    } else {
        eng1Tmp = "XXX";
        eng1Psi = "xx";
        eng2Tmp = "XXX";
        eng2Psi = "xx";
    }

    return (
        <SvgGroup x={x} y={y}>
            {/* eng1 */}
            <rect className="st10 st12" x={0} y={0} width="42" height="49"/>
            <text x={3} y={42} className={eng1Tmp > 270 || eng1Tmp < 150 ? "warning st2 st6" : "st7 st2 st6"}>{eng1Tmp}</text>
            <text x={9} y={19} className={eng1Psi > 57 || eng1Psi < 4 ? "warning st2 st6" : "st7 st2 st6"}>{eng1Psi}</text>
            <text x={50} y={19} className="st8 st2 st6">PSI</text>
            <text x={62} y={42} className="st8 st2 st13">C</text>
            <text x={54} y={42} className="st8 st2 st13">°</text>

            {/* eng2 */}
            <rect className="st10 st12" x={358} y={0} width="42" height="49"/>
            <text x={361} y={42} className={eng2Tmp > 270 || eng2Tmp < 150 ? "warning st2 st6" : "st7 st2 st6"}>{eng2Tmp}</text>
            <text x={367} y={19} className={eng2Psi > 57 || eng2Psi < 4 ? "warning st2 st6" : "st7 st2 st6"}>{eng2Psi}</text>
            <text x={317} y={19} className="st8 st2 st6">PSI</text>
            <text x={329} y={42} className="st8 st2 st13">C</text>
            <text x={321} y={42} className="st8 st2 st13">°</text>
        </SvgGroup>
    );
};

const IsEngineRunning = () => {
    const [isEng1Running] = useSimVar('L:A32NX_ENGINE_STATE:1', 'Number', 500);
    const [isEng2Running] = useSimVar('L:A32NX_ENGINE_STATE:2', 'Number', 500);
    const [eng1N2] = useSimVar('L:A32NX_ENGINE_N2:1', 'Number', 500);
    const [eng2N2] = useSimVar('L:A32NX_ENGINE_N2:2', 'Number', 500);
    const [fadecStatusEng1] = useSimVar('L:A32NX_FADEC_POWERED_ENG1', 'Bool', 500);
    const [fadecStatusEng2] = useSimVar('L:A32NX_FADEC_POWERED_ENG2', 'Bool', 500);

    const engineIdle = 58;
    let eng1N2BelowIdle = true;
    let eng2N2BelowIdle = true;

    if (eng1N2 < engineIdle) {
        eng1N2BelowIdle = true;
    } else {
        eng1N2BelowIdle = false;
    }

    if (eng2N2 < engineIdle) {
        eng2N2BelowIdle = true;
    } else {
        eng2N2BelowIdle = false;
    }

    return (
        <>
            {/* eng1 */}
            <text id="eng-numb-1" x={66} y={400} className={eng1N2BelowIdle && fadecStatusEng1 ? "warning st1 st2 st6" : "st1 st2 st6"} fontSize="22px">1</text>
            <line id="left-engine-connection-obj1" className={isEng1Running ? "st5" : "warning st5"} x1="121" y1="468" x2="121" y2="423"/>
            <line id="left-engine-connection-obj2" className={isEng1Running ? "st5" : "warning st5"} x1="182" y1="452" x2="211" y2="452"/>
            <line id="left-engine-connection-obj3" className={isEng1Running ? "st5" : "warning st5"} x1="210" y1="452" x2="210" y2="468"/>

            {/* eng2 */}
            <text id="eng-numb-2" x={534} y={400} className={eng2N2BelowIdle && fadecStatusEng2 ? "warning st1 st2 st6" : "st1 st2 st6"} fontSize="22px">2</text>
            <line id="right-engine-connection-obj1" className={isEng2Running ? "st5" : "warning st5"} x1="390" y1="452" x2="418" y2="452"/>
            <line id="right-engine-connection-obj2" className={isEng2Running ? "st5" : "warning st5"} x1="391" y1="468" x2="391" y2="452"/>
            <line id="right-engine-connection-obj3" className={isEng2Running ? "st5" : "warning st5"} x1="479" y1="468" x2="479" y2="424"/>
        </>
    )
}

const SimulateTmp = () => {
    const [isLeftPackOn] = useSimVar('L:A32NX_AIRCOND_PACK1_TOGGLE', 'Bool', 500);
    const [isRightPackOn] = useSimVar('L:A32NX_AIRCOND_PACK2_TOGGLE', 'Bool', 500);
    const [isXBleedOpen] = useSimVar('L:A32NX_XBLEED_VALVE', 'Bool');
    const [isApuBleedValueOpen] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'Bool', 500);
    const [apuN] = useSimVar('L:A32NX_APU_N', 'percent', 500);

    const [eng1N2] = useSimVar('L:A32NX_ENGINE_N2:1', 'Number', 500);
    const [eng2N2] = useSimVar('L:A32NX_ENGINE_N2:2', 'Number', 500);
    const [eng1TmpValue] = useSimVar('ENG EXHAUST GAS TEMPERATURE:1', 'Celsius', 500);
    const [eng2TmpValue] = useSimVar('ENG EXHAUST GAS TEMPERATURE:2', 'Celsius', 500);
    const [isEng1ProvideBleed] = useSimVar('BLEED AIR ENGINE:1', 'Bool', 500);
    const [isEng2ProvideBleed] = useSimVar('BLEED AIR ENGINE:2', 'Bool', 500);
    const [isEng1Running] = useSimVar('L:A32NX_ENGINE_STATE:1', 'Number', 500);
    const [isEng2Running] = useSimVar('L:A32NX_ENGINE_STATE:2', 'Number', 500);
    const isEng1Ignition = eng1N2 > 1 && eng1N2 < 58;
    const isEng2Ignition = eng2N2 > 1 && eng2N2 < 58

    //placeholder logic for packs
    const engTempMultiplier1 = 0.08;
    const engTempMultiplier2 = 0.0000009;
    const engTempMultiplier3 = 0.31;
    const engTempOffsetH = -510;
    const engTempOffsetV = 200;
    const engTempOffsetH2 = -860;
    const engTempOffsetV2 = 276.4;
    const packInMultiplier = 0.9;
    const packInMultiplierApu = 0.8;
    const apuTMPcomputed = Math.round(apuN ? 100 * 2.5 : 0);

    let eng1TmpComputed;
    let eng2TmpComputed;

    if (eng1TmpValue < 860) {
        eng1TmpComputed = Math.round((engTempMultiplier1 * (eng1TmpValue + engTempOffsetH)) + (engTempMultiplier2 * Math.pow((eng1TmpValue + engTempOffsetH), 3)) + engTempOffsetV);
    } else {
        eng1TmpComputed = Math.round(engTempMultiplier3 * (eng1TmpValue + engTempOffsetH2) + engTempOffsetV2);
    }

    if (eng2TmpValue < 860) {
        eng2TmpComputed = Math.round(((engTempMultiplier1 * (eng2TmpValue + engTempOffsetH)) + (engTempMultiplier2 * Math.pow((eng2TmpValue + engTempOffsetH), 3)) + engTempOffsetV));
    } else {
        eng2TmpComputed = Math.round(engTempMultiplier3 * (eng2TmpValue + engTempOffsetH2) + engTempOffsetV2);
    }


    let isLeftPackOpen = isLeftPackOn;
    let isRightPackOpen = isRightPackOn;

    if (isEng1Ignition || isEng2Ignition || isXBleedOpen) {
        isLeftPackOpen = false;
        isRightPackOpen = false;
    } else if (isEng1Ignition && !isXBleedOpen) {
        isLeftPackOpen = false;
    } else if (isEng2Ignition && !isXBleedOpen) {
        isRightPackOpen = false;
    }

    let leftEngPackInTmp = eng1TmpComputed * packInMultiplier;
    let leftEngPackOutTmp = eng1TmpComputed * Math.random() * Math.random();
    let rightEngPackInTmp = eng2TmpComputed * packInMultiplier;
    let rightEngPackOutTmp = eng2TmpComputed * Math.random() * Math.random();
    let apuInTmp = apuTMPcomputed * packInMultiplierApu;
    let apuOutTmp = apuTMPcomputed * Math.random() * Math.random();

    this.antiIceTriangles[0].setAttribute("class", "st5");
    if (isLeftPackOpen && isEng1ProvideBleed && isEng1Running) {
        this.htmlLeftPackIn.textContent = packTMPComputedIn[0];
        this.htmlLeftPackOut.textContent = packTMPComputedOut[0];
    } else if (isLeftPackOpen && isXBleedOpen && isEng2Running && isEng2ProvideBleed) {
        this.htmlLeftPackIn.textContent = packTMPComputedIn[1];
        this.htmlLeftPackOut.textContent = packTMPComputedOut[1];
    } else if (isLeftPackOpen && isApuBleedValueOpen && isXBleedOpen) {
        this.htmlLeftPackIn.textContent = packTMPComputedIn[2];
        this.htmlLeftPackOut.textContent = packTMPComputedOut[2];
    } else {
        this.antiIceTriangles[0].setAttribute("class", "warning_trg st5");
        this.htmlLeftPackIn.textContent = "xx";
        this.htmlLeftPackOut.textContent = "xx";
    }

    this.antiIceTriangles[1].setAttribute("class", "st5");
    if (isRightPackOpen && isEng2ProvideBleed && isEng2Running) {
        this.htmlRightPackIn.textContent = packTMPComputedIn[1];
        this.htmlRightPackOut.textContent = packTMPComputedOut[1];
    } else if (isRightPackOpen && isXBleedOpen && isEng1Running && isEng1ProvideBleed) {
        this.htmlRightPackIn.textContent = packTMPComputedIn[0];
        this.htmlRightPackOut.textContent = packTMPComputedOut[0];
    } else if (isRightPackOpen && isApuBleedValueOpen && isXBleedOpen) {
        this.htmlRightPackIn.textContent = packTMPComputedIn[2];
        this.htmlRightPackOut.textContent = packTMPComputedOut[2];
    } else {
        this.antiIceTriangles[1].setAttribute("class", "warning_trg st5");
        this.htmlRightPackIn.textContent = "xx";
        this.htmlRightPackOut.textContent = "xx";
    }
}

ReactDOM.render(<SimVarProvider><BleedPage /></SimVarProvider>, getRenderTarget());
