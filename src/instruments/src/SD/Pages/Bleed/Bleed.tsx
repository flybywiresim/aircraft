import './Bleed.scss';
import React from 'react';
import ReactDOM from 'react-dom';
import { SimVarProvider, useSimVar } from '@instruments/common/simVars';
import { getRenderTarget, setIsEcamPage } from '@instruments/common/defaults';
import { EcamPage } from '../../Common/EcamPage';
import { PageTitle } from '../../Common/PageTitle';
import { SvgGroup } from '../../Common/SvgGroup';

setIsEcamPage('bleed_page');

export const BleedPage = () => (
    <EcamPage name="main-bleed">
        <PageTitle x={8} y={22} text="BLEED" />

        <BleedFiexdElement />
        <Valves />
        <IpAndHpValves x={100} y={367} eng={1} mirrored={false} />
        <IpAndHpValves x={499.6} y={367} eng={2} mirrored />
        <Xbleed x={121} y={260} />
        <Apu x={121} y={276} />
        <Ground />
        <Pack />
        <RamAir />
        <WingAntiIce />
        <PackFlowIndicator x={87} y={134} />
        <PackFlowIndicator x={445} y={134} />
        <IsEngineRunning />
        <TempBox x={100} y={317} />
    </EcamPage>
);

const BleedFiexdElement = () => (
    <g>
        {/* triangles above and line under them */}
        <polyline className="st5" points="121,68 121,49 479,49 479,68" />
        <polygon className="st5" points="163,43 177,43 170,30 163,43" />
        <polygon className="st5" points="293,43 307,43 300,30 293,43" />
        <polygon className="st5" points="423,43 437,43 430,30 423,43" />

        {/* indicator arcs */}
        <path className="st12" d="M 76 135 L 88 135 M 154 135 L 166 135" />
        <path className="st9" d="M 88 135 c 15 -25 51 -25 66 0" />
        <path className="st9" d="M 121 113 L 121 116" />

        <path className="st12" d="M 434 135 L 446 135 M 512 135 L 524 135" />
        <path className="st9" d="M 446 135 c 15 -25 51 -25 66 0" />
        <path className="st9" d="M 479 113 L 479 116" />

        <path className="st12" d="M 76 207 L 88 207 M 154 207 L 166 207" />
        <path className="st9" d="M 88 207 c 15 -25 51 -25 66 0" />
        <path className="st9" d="M 121 186 L 121 187" />

        <path className="st12" d="M 434 207 L 446 207 M 512 207 L 524 207" />
        <path className="st9" d="M 446 207 c 15 -25 51 -25 66 0" />
        <path className="st9" d="M 479 186 L 479 187" />

        {/* unused */}
        <line id="center-line-1" className="st5" x1="121" y1="317" x2="121" y2="243" />
        <line id="center-line-5" className="st5" x1="479" y1="317" x2="479" y2="243" />
        <line id="center-line-6" className="st5" x1="300" y1="126" x2="300" y2="103" />
    </g>
);

const Valves = () => (
    <g>
        <circle className="st5" cx="358" cy="276" r="16" />
        <circle className="st5" cx="479" cy="227" r="16" />
        <circle className="st5" cx="121" cy="227" r="16" />
        <circle className="st5" cx="300" cy="87" r="16" />
    </g>
);

const IpAndHpValves = ({ x, y, eng, mirrored }) => {
    const [isEngProvideBleed] = useSimVar(`BLEED AIR ENGINE:${eng}`, 'Bool', 500);
    const [engN2] = useSimVar(`L:A32NX_ENGINE_N2:${eng}`, 'Number', 500);
    const [isEngRunning] = useSimVar(`L:A32NX_ENGINE_STATE:${eng}`, 'Number', 500);
    const [isAircraftOnGround] = useSimVar('SIM ON GROUND', 'Bool', 500);

    // closes HP valves if engine slightly above idle
    const engHpValveOpen = isEngProvideBleed && isEngRunning && engN2 < 60 && isAircraftOnGround;

    return (
        <SvgGroup x={x} y={y}>
            <text x={mirrored ? -33 : 10} y={120} className="st1 st2 st6">IP</text>
            <text x={mirrored ? -120 : 99} y={120} className="st1 st2 st6">HP</text>
            <g className={mirrored ? 'mirrored' : ''}>
                <circle className="st5" cx={65} cy={85} r="16" />
                <circle className="st5" cx={21} cy={40} r="16" />

                {/* eng ip valve */}
                <g className={isEngProvideBleed ? 'show' : 'hide'}>
                    <line className="st5" x1={21} y1={24} x2={21} y2={56} />
                    <line id="under-left" className="st5" x1={21} y1={24} x2={21} y2={0} />
                </g>
                <g className={isEngProvideBleed ? 'hide' : 'show'}>
                    <line className="st5" x1={4} y1={40} x2="136" y2={40} />
                </g>

                {/* eng hp valve */}
                <g className={engHpValveOpen ? 'show' : 'hide'}>
                    <line className="st5" x1={49} y1={85} x2={81} y2={85} />
                    <line id="left-engine-connection-obj4" className="st5" x1={22} y1={85} x2={50} y2={85} />
                </g>
                <g className={engHpValveOpen ? 'hide' : 'show'}>
                    <line className="st5" x1={65} y1={69} x2={65} y2={101} />
                </g>
            </g>
        </SvgGroup>
    );
};

const Xbleed = ({ x, y }) => {
    const [xBleedState] = useSimVar('L:A32NX_XBLEED_VALVE', 'Bool');
    if (xBleedState) {
        return (
            <SvgGroup x={x} y={y}>
                {/* X Bleed valve open */}
                <line id="center-line-2" className="st5" x1={0} y1={16} x2={222} y2={16} />
                <line id="center-line-3" className="st5" x1={253} y1={16} x2={219} y2={16} />
                <line className="st5" x1={221} y1={16} x2={253} y2={16} />
            </SvgGroup>
        );
    }
    return (
        <SvgGroup x={x} y={y}>
            {/* X Bleed valve open */}
            <line className="st5" x1={237} y1={0} x2={237} y2={32} />
        </SvgGroup>
    );
};

const Apu = ({ x, y }) => {
    const [isApuMasterSwitchPressed] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'Bool', 500);
    const [isApuBleedSwitchPressed] = useSimVar('L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON', 'Bool', 500);
    const [isApuBleedValueOpen] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'Bool', 500);
    const apuStatus = isApuMasterSwitchPressed || isApuBleedSwitchPressed;

    if (apuStatus) {
        return (
            <SvgGroup x={x} y={y}>
                <text id="APUtext" x={161} y={127} className="st1 st2 st6">APU</text>
                <circle id="apu-valve" className="st5" cx={179} cy={69} r="16" />
                <line id="apu-connecting-line" className="st5" stroke="#db7200" x1={179} y1={84} x2={179} y2={110} />
                { isApuBleedValueOpen
                    ? (
                        <g>
                            <line className="st5" x1={179} y1={53} x2={179} y2={85} />
                            <line id="center-line-2" className="st5" x1={0} y1={0} x2={222} y2={0} />
                            { apuStatus
                                ? (
                                    <line id="center-line-4" className="st5" x1={179} y1={0} x2={179} y2={54} />
                                ) : (
                                    null
                                )}
                        </g>
                    ) : (
                        <g>
                            <line className="st5" x1={163} y1={69} x2={195} y2={69} />
                        </g>
                    )}
            </SvgGroup>
        );
    }
    return null;
};

const Ground = () => {
    const [isAircraftOnGround] = useSimVar('SIM ON GROUND', 'Bool', 500);
    const [groundSpeed] = useSimVar('GPS GROUND SPEED', 'Meters per second', 500);
    const [isEng1Running] = useSimVar('L:A32NX_ENGINE_STATE:1', 'Number', 500);
    const [isEng2Running] = useSimVar('L:A32NX_ENGINE_STATE:2', 'Number', 500);

    // hide GND during flight/when moving/at least one engine is running
    if (!isAircraftOnGround && groundSpeed < 1 && (isEng1Running === 0 && isEng2Running === 0)) {
        return (
            <g>
                <polygon className="st9" points="234,300 250,300 242,286 234,300" />
                <text x={224.5} y={318} className="st1 st2 st6">GND</text>
            </g>
        );
    }
    return null;
};

const Pack = () => {
    const [isLeftPackOpen] = useSimVar('L:A32NX_AIRCOND_PACK1_OPEN', 'Bool', 500);
    const [isRightPackOpen] = useSimVar('L:A32NX_AIRCOND_PACK2_OPEN', 'Bool', 500);
    const [isxBleedValueOpen] = useSimVar('L:A32NX_XBLEED_VALVE', 'Bool');
    const [isApuBleedValueOpen] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'Bool', 500);

    const [isEng1Running] = useSimVar('L:A32NX_ENGINE_STATE:1', 'Number', 500);
    const [isEng2Running] = useSimVar('L:A32NX_ENGINE_STATE:2', 'Number', 500);
    const [isEng1ProvideBleed] = useSimVar('BLEED AIR ENGINE:1', 'Bool', 500);
    const [isEng2ProvideBleed] = useSimVar('BLEED AIR ENGINE:1', 'Bool', 500);

    const [eng1PackInTmp] = useSimVar('L:A32NX_AIRCOND_PACK1_IN_TEMP', 'Celsius', 500);
    const [eng1PackOutTmp] = useSimVar('L:A32NX_AIRCOND_PACK1_OUT_TEMP', 'Celsius', 500);
    const [eng2PackInTmp] = useSimVar('L:A32NX_AIRCOND_PACK2_IN_TEMP', 'Celsius', 500);
    const [eng2PackOutTmp] = useSimVar('L:A32NX_AIRCOND_PACK2_OUT_TEMP', 'Celsius', 500);
    const [apuPackInTmp] = useSimVar('A32NX_AIRCOND_PACK_APU_IN_TEMP', 'Celsius', 500);
    const [apuPackOutTmp] = useSimVar('L:A32NX_AIRCOND_PACK_APU_OUT_TEMP', 'Celsius', 500);

    const [pack1Fault] = useSimVar('L:A32NX_AIRCOND_PACK1_FAULT', 'Bool', 500);
    const [pack2Fault] = useSimVar('L:A32NX_AIRCOND_PACK1_FAULT', 'Bool', 500);

    let leftPackInTmp = 'xx';
    let leftPackOutTmp = 'xx';
    let rightPackInTmp = 'xx';
    let rightPackOutTmp = 'xx';

    if (isLeftPackOpen && isEng1Running !== 0 && isEng1ProvideBleed) {
        leftPackInTmp = eng1PackInTmp;
        leftPackOutTmp = eng1PackOutTmp;
    } else if (isLeftPackOpen && isxBleedValueOpen && isEng2Running !== 0 && isEng2ProvideBleed) {
        leftPackInTmp = eng2PackInTmp;
        leftPackOutTmp = eng2PackOutTmp;
    } else if (isLeftPackOpen && isApuBleedValueOpen) {
        leftPackInTmp = apuPackInTmp;
        leftPackOutTmp = apuPackOutTmp;
    }

    if (isRightPackOpen && isEng2Running !== 0 && isEng2ProvideBleed) {
        rightPackInTmp = eng2PackInTmp;
        rightPackOutTmp = eng2PackOutTmp;
    } else if (isRightPackOpen && isxBleedValueOpen && isEng1Running !== 0 && isEng1ProvideBleed) {
        rightPackInTmp = eng1PackInTmp;
        rightPackOutTmp = eng1PackOutTmp;
    } else if (isRightPackOpen && isApuBleedValueOpen) {
        rightPackInTmp = apuPackInTmp;
        rightPackOutTmp = apuPackOutTmp;
    }

    return (
        <g>
            {/* pack outlines */}
            <polyline className="st12" points="76,207 76,146 76,77 121,68 166,76 166,207" />
            <polyline className="st12" points="434,207 434,146 434,77 479,68 524,76 524,207" />

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
            <text x={149} y={102} className="st8 st2 st13">C</text>
            <text x={141} y={102} className="st8 st2 st13">°</text>

            <text x={149} y={171} className="st8 st2 st13">C</text>
            <text x={141} y={171} className="st8 st2 st13">°</text>

            <text x={508} y={102} className="st8 st2 st13">C</text>
            <text x={500} y={102} className="st8 st2 st13">°</text>

            <text x={508} y={171} className="st8 st2 st13">C</text>
            <text x={500} y={171} className="st8 st2 st13">°</text>

            <g className={isLeftPackOpen ? '' : 'hide'}>
                <line className="st5" x1="121" y1="212" x2="121" y2="244" />
            </g>
            <g className={isLeftPackOpen ? 'hide' : ''}>
                <line className="st5" x1="104" y1="227" x2="136" y2="227" />
            </g>
            <g className={isRightPackOpen ? '' : 'hide'}>
                <line className="st5" x1="479" y1="211" x2="479" y2="243" />
            </g>
            <g className={isRightPackOpen ? 'hide' : ''}>
                <line className="st5" x1="464" y1="227" x2="496" y2="227" />
            </g>

            <text
                id="left-pack-in"
                fontSize="22px"
                x={111}
                y={170}
                className={pack1Fault ? 'warning st2 st6' : 'st7 st2 st6'}
            >
                {leftPackInTmp}
            </text>
            <text
                id="left-pack-out"
                fontSize="22px"
                x={111}
                y={100}
                className={pack1Fault ? 'warning st2 st6' : 'st7 st2 st6'}
            >
                {leftPackOutTmp}
            </text>
            <text
                id="right-pack-in"
                fontSize="22px"
                x={475}
                y={170}
                className={pack2Fault ? 'warning st2 st6' : 'st7 st2 st6'}
            >
                {rightPackInTmp}
            </text>
            <text
                id="right-pack-out"
                fontSize="22px"
                x={475}
                y={100}
                className={pack2Fault ? 'warning st2 st6' : 'st7 st2 st6'}
            >
                {rightPackOutTmp}
            </text>
        </g>
    );
};

const RamAir = () => {
    const [ramAirButton] = useSimVar('L:A32NX_AIRCOND_RAMAIR_TOGGLE', 'Bool', 500);
    const [pressureDifferent] = useSimVar('L:A32NX_DELTA_PSI', 'psi', 500);

    const [isAircraftOnGround] = useSimVar('SIM ON GROUND', 'Bool', 500);
    const [groundSpeed] = useSimVar('GPS GROUND SPEED', 'Meters per second', 500);
    const isAircraftOnTakeoff = isAircraftOnGround && groundSpeed > 70;

    const [eng1TLA] = useSimVar('L:A32NX_AUTOTHRUST_TLA:1', 'Number', 500);
    const [eng2TLA] = useSimVar('L:A32NX_AUTOTHRUST_TLA:2', 'Number', 500);
    const isAircraftOnToga = eng1TLA > 42 && eng2TLA > 42;

    // closes the ram on takeoff and landing
    let isRamAirValveOpen = ramAirButton;
    if (isAircraftOnToga || isAircraftOnTakeoff || pressureDifferent > 1) {
        isRamAirValveOpen = false;
    }

    return (
        <g>
            <text x={282} y={146} className="st1 st2 st6">RAM</text>
            <text x={282} y={165} className="st1 st2 st6">AIR</text>
            { isRamAirValveOpen
                ? (
                    <g>
                        <line className="st5" x1="284" y1="87" x2="316" y2="87" />
                        <line id="ram-air-connection-line" className="st5" x1="300" y1="48" x2="300" y2="71" />
                    </g>
                ) : (
                    <line className="st5" x1="300" y1="71" x2="300" y2="103" />
                )}
        </g>
    );
};

const WingAntiIce = () => {
    const [isAntiIceOn] = useSimVar('STRUCTURAL DEICE SWITCH', 'Bool', 500);
    const [pack1Fault] = useSimVar('L:A32NX_AIRCOND_PACK1_FAULT', 'Bool', 500);
    const [pack2Fault] = useSimVar('L:A32NX_AIRCOND_PACK1_FAULT', 'Bool', 500);

    return (
        <g>
            { isAntiIceOn
                && (
                    <g>
                        {/* anti ice indicator */}
                        <polygon className={pack1Fault ? 'warning_trg st5' : 'st5'} points="116,268 116,284 102,276 116,268" />
                        <polygon className={pack2Fault ? 'warning_trg st5' : 'st5'} points="484,268 484,284 498,276 484,268" />

                        {/* anti ice text */}
                        <text x={65} y={268} fontSize="18px" className="st1 st2">ANTI</text>
                        <text x={58} y={285} fontSize="18px" className="st1 st2">ICE</text>

                        <text x={535} y={268} fontSize="18px" className="st1 st2">ANTI</text>
                        <text x={540} y={285} fontSize="18px" className="st1 st2">ICE</text>
                    </g>
                )}
        </g>
    );
};

const PackFlowIndicator = ({ x, y }) => {
    const [packFlowKnob] = useSimVar('L:A32NX_KNOB_OVHD_AIRCOND_PACKFLOW_Position', 'Number', 500);
    const [isApuBleedValueOpen] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'Bool', 500);

    const [isLeftPackOpen] = useSimVar('L:A32NX_AIRCOND_PACK1_OPEN', 'Bool', 500);
    const [isRightPackOpen] = useSimVar('L:A32NX_AIRCOND_PACK2_OPEN', 'Bool', 500);
    const isAircraftOnSinglePack = !!(!(isLeftPackOpen && isRightPackOpen) && (isLeftPackOpen || isRightPackOpen));

    const [eng1TLA] = useSimVar('L:A32NX_AUTOTHRUST_TLA:1', 'Number', 500);
    const [eng2TLA] = useSimVar('L:A32NX_AUTOTHRUST_TLA:2', 'Number', 500);
    const isAircraftOnToga = eng1TLA > 42 && eng2TLA > 42;

    const [isEng1ProvideBleed] = useSimVar('BLEED AIR ENGINE:1', 'Bool', 500);
    const [isEng2ProvideBleed] = useSimVar('BLEED AIR ENGINE:2', 'Bool', 500);

    const packFlowPosition = (isAircraftOnToga || isAircraftOnSinglePack || (isApuBleedValueOpen && !isEng1ProvideBleed && !isEng2ProvideBleed)) ? 2 : packFlowKnob;

    const packflowRotate = packFlowPosition * 57.5;

    const [cockpitSelectedAirTemp1] = useSimVar('L:A320_Neo_AIRCOND_LVL_1', 'Number', 500);
    const [cockpitSelectedAirTemp2] = useSimVar('L:A320_Neo_AIRCOND_LVL_2', 'Number', 500);
    const [cockpitSelectedAirTemp3] = useSimVar('L:A320_Neo_AIRCOND_LVL_3', 'Number', 500);
    const requestedPackLvl = Math.min(cockpitSelectedAirTemp1, cockpitSelectedAirTemp2, cockpitSelectedAirTemp3);
    const requestedPackLvlRotate = requestedPackLvl * 1.23;

    const transformStyleInFlow = {
        transform: `rotate(${packflowRotate}deg)`,
        transformOrigin: `${34}px ${93}px`,
    };

    const transformStyleOutFlow = {
        transform: `rotate(${requestedPackLvlRotate}deg)`,
        transformOrigin: `${34}px ${18}px`,
    };

    return (
        <SvgGroup x={x} y={y}>
            <g style={transformStyleInFlow}>
                <line
                    id="pack-flow-indicator1"
                    className="st5"
                    strokeWidth="4.5px"
                    strokeLinecap="round"
                    x1={19}
                    y1={84}
                    x2={0}
                    y2={72}
                />
            </g>
            <g style={transformStyleOutFlow}>
                <line
                    className="st5"
                    strokeWidth="4.5px"
                    strokeLinecap="round"
                    x1={34}
                    y1={18}
                    x2={0}
                    y2={0}
                />
            </g>
        </SvgGroup>
    );
};

const TempBox = ({ x, y }) => {
    const [isEng1ProvideBleed] = useSimVar('BLEED AIR ENGINE:1', 'Bool', 500);
    const [isEng2ProvideBleed] = useSimVar('BLEED AIR ENGINE:2', 'Bool', 500);
    const [isEng1Running] = useSimVar('L:A32NX_ENGINE_STATE:1', 'Number', 500);
    const [isEng2Running] = useSimVar('L:A32NX_ENGINE_STATE:2', 'Number', 500);
    const [eng1PsiValue] = useSimVar('TURB ENG BLEED AIR:1', 'Ratio (0-16384)', 500);
    const [eng2PsiValue] = useSimVar('TURB ENG BLEED AIR:1', 'Ratio (0-16384)', 500);

    const [isxBleedValueOpen] = useSimVar('L:A32NX_XBLEED_VALVE', 'Bool');

    const [apuN] = useSimVar('L:A32NX_APU_N', 'percent', 500);
    const [isApuBleedValueOpen] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'Bool', 500);
    const [isApuMasterSwitchPressed] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'Bool', 500);
    const [isApuBleedSwitchPressed] = useSimVar('L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON', 'Bool', 500);
    const apuStatus = isApuMasterSwitchPressed || isApuBleedSwitchPressed;

    const eng1PsiValueCalculated = Math.round(eng1PsiValue / 2.9);
    const eng2PsiValueCalculated = Math.round(eng2PsiValue / 2.9);
    const apuPSI = Math.round(apuN ? 100 * 0.35 : 0);

    const eng1TmpComputed = useSimVar('L:A32NX_ENG1_TEMP', 'Celsius', 500);
    const eng2TmpComputed = useSimVar('L:A32NX_ENG2_TEMP', 'Celsius', 500);
    const apuTMPcomputed = useSimVar('L:A32NX_APU_TEMP', 'Celsius', 500);

    let eng1Tmp;
    let eng1Psi;
    let eng2Tmp;
    let eng2Psi;

    if (isEng2ProvideBleed && !isEng1ProvideBleed && !isApuBleedValueOpen && isEng2Running === 1 && !isxBleedValueOpen) {
        eng1Tmp = 'XXX';
        eng1Psi = 'xx';
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
        eng2Tmp = 'XXX';
        eng2Psi = 'xx';
    } else if (isEng1ProvideBleed && isEng1Running === 1 && !isxBleedValueOpen) {
        eng1Tmp = eng1TmpComputed;
        eng1Psi = eng1PsiValueCalculated;
        eng2Tmp = 'XXX';
        eng2Psi = 'xx';
    } else if (isEng1ProvideBleed && isEng2ProvideBleed && isEng1Running !== 1 && isEng2Running !== 1 && isxBleedValueOpen) {
        eng1Tmp = apuTMPcomputed;
        eng1Psi = apuPSI;
        eng2Tmp = apuTMPcomputed;
        eng2Psi = apuPSI;
    } else {
        eng1Tmp = 'XXX';
        eng1Psi = 'xx';
        eng2Tmp = 'XXX';
        eng2Psi = 'xx';
    }

    return (
        <SvgGroup x={x} y={y}>
            {/* eng1 */}
            <rect className="st10 st12" x={0} y={0} width="42" height="49" />
            <text x={3} y={42} className={eng1Tmp > 270 || eng1Tmp < 150 ? 'warning st2 st6' : 'st7 st2 st6'}>{eng1Tmp}</text>
            <text x={9} y={19} className={eng1Psi > 57 || eng1Psi < 4 ? 'warning st2 st6' : 'st7 st2 st6'}>{eng1Psi}</text>
            <text x={50} y={19} className="st8 st2 st6">PSI</text>
            <text x={62} y={42} className="st8 st2 st13">C</text>
            <text x={54} y={42} className="st8 st2 st13">°</text>

            {/* eng2 */}
            <rect className="st10 st12" x={358} y={0} width="42" height="49" />
            <text x={361} y={42} className={eng2Tmp > 270 || eng2Tmp < 150 ? 'warning st2 st6' : 'st7 st2 st6'}>{eng2Tmp}</text>
            <text x={367} y={19} className={eng2Psi > 57 || eng2Psi < 4 ? 'warning st2 st6' : 'st7 st2 st6'}>{eng2Psi}</text>
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
            <text id="eng-numb-1" x={66} y={400} className={eng1N2BelowIdle && fadecStatusEng1 ? 'warning st1 st2 st6' : 'st1 st2 st6'} fontSize="22px">1</text>
            <line id="left-engine-connection-obj1" className={isEng1Running ? 'st5' : 'warning st5'} x1="121" y1="468" x2="121" y2="423" />
            <line id="left-engine-connection-obj2" className={isEng1Running ? 'st5' : 'warning st5'} x1="182" y1="452" x2="211" y2="452" />
            <line id="left-engine-connection-obj3" className={isEng1Running ? 'st5' : 'warning st5'} x1="210" y1="452" x2="210" y2="468" />

            {/* eng2 */}
            <text id="eng-numb-2" x={534} y={400} className={eng2N2BelowIdle && fadecStatusEng2 ? 'warning st1 st2 st6' : 'st1 st2 st6'} fontSize="22px">2</text>
            <line id="right-engine-connection-obj1" className={isEng2Running ? 'st5' : 'warning st5'} x1="390" y1="452" x2="418" y2="452" />
            <line id="right-engine-connection-obj2" className={isEng2Running ? 'st5' : 'warning st5'} x1="391" y1="468" x2="391" y2="452" />
            <line id="right-engine-connection-obj3" className={isEng2Running ? 'st5' : 'warning st5'} x1="479" y1="468" x2="479" y2="424" />
        </>
    );
};

ReactDOM.render(<SimVarProvider><BleedPage /></SimVarProvider>, getRenderTarget());
