import React, { FC } from 'react';
import { render } from '@instruments/common/index';
import { setIsEcamPage } from '@instruments/common/defaults';
import { useSimVar } from '@instruments/common/simVars';
import { EcamPage } from '../../Common/EcamPage';
import { PageTitle } from '../../Common/PageTitle';
import { SvgGroup } from '../../Common/SvgGroup';
import { ComponentPositionProps } from '../../Common/ComponentPositionProps';

import './Bleed.scss';

setIsEcamPage('bleed_page');

export const BleedPage: FC = () => {
    const mir = false;
    // TODO : Align Pack BOX!!
    return (
        <EcamPage name="main-bleed">
            <PageTitle x={8} y={18} text="BLEED" />

            <EngineValves x={100} y={375} engNumber={1} mirrored={false} />
            <EngineValves x={499.6} y={375} engNumber={2} mirrored />

            <EngineBox x={100} y={317} engNumber={1} mirrored={false} />
            <EngineBox x={458} y={317} engNumber={2} mirrored />

            <EngineNumber x={66} y={420} engNumber={1} />
            <EngineNumber x={534} y={420} engNumber={2} />

            <EngineConnection x={121} y={431} engNumber={1} mirrored={false} />
            <EngineConnection x={480} y={431} engNumber={2} mirrored />

            <PackFlowIndicator x={87} y={134} />
            <PackFlowIndicator x={445} y={134} />

            <Apu x={121} y={276} />
            <XBleed x={121} y={260} />
            <RamAir x={282} y={48} />

            <ShouldMoveOut />
            <Ground />
            <TopTriangles />
            <WingAntiIce />
            <Pack />

        </EcamPage>
    );
};

interface EngMirroredProps extends ComponentPositionProps {
    engNumber: number,
    mirrored: boolean
}

const EngineValves = ({ x, y, engNumber, mirrored }: EngMirroredProps) => {
    const [engBleedValve] = useSimVar(`L:A32NX_PNEU_ENG_${engNumber}_PR_VALVE_OPEN`, 'Bool', 500);
    const [engHPValve] = useSimVar(`L:A32NX_PNEU_ENG_${engNumber}_HP_VALVE_OPEN`, 'Bool', 500);

    return (
        <SvgGroup x={x} y={y}>
            <text x={mirrored ? -33 : 10} y={120} className="st1 st2 st6">IP</text>
            <text x={mirrored ? -120 : 99} y={120} className="st1 st2 st6">HP</text>

            <g className={mirrored ? 'mirrored' : ''}>
                <circle className="st5" cx={65} cy={85} r="16" />
                <circle className="st5" cx={21} cy={40} r="16" />

                {/* Eng Bleed Valve */}
                <g className={engBleedValve ? '' : 'hide'}>
                    <line id="under-left" className="st5" x1={21} y1={24} x2={21} y2={0} />
                    <line className="st5" x1={21} y1={24} x2={21} y2={56} />
                </g>
                <g className={engBleedValve ? 'hide' : ''}>
                    <line className="st5" x1={4} y1={40} x2={36} y2={40} />
                </g>

                {/* Eng HP Valve */}
                <g className={engHPValve ? '' : 'hide'}>
                    <line className="st5" x1={49} y1={85} x2={81} y2={85} />
                    <line id="left-engine-connection-obj4" className="st5" x1={22} y1={85} x2={50} y2={85} />
                </g>
                <g className={engHPValve ? 'hide' : ''}>
                    <line className="st5" x1={65} y1={69} x2={65} y2={101} />
                </g>
            </g>
        </SvgGroup>
    );
};

const EngineBox = ({ x, y, engNumber, mirrored }: EngMirroredProps) => {
    const [isEngProvideBleed] = useSimVar(`BLEED AIR ENGINE:${engNumber}`, 'Bool', 500);
    const [isOtherEngineProvideBleed] = engNumber === 1 ? useSimVar('BLEED AIR ENGINE:2', 'Bool', 500) : useSimVar('BLEED AIR ENGINE:1', 'Bool', 500);
    const [isEngRunning] = useSimVar(`L:A32NX_ENGINE_STATE:${engNumber}`, 'Number', 500);
    const [isOtherEngRunning] = engNumber === 1 ? useSimVar('L:A32NX_ENGINE_STATE:2', 'Number', 500) : useSimVar('L:A32NX_ENGINE_STATE:1', 'Number', 500);

    const [isxBleedValueOpen] = useSimVar('L:A32NX_PNEU_XBLEED_VALVE_OPEN', 'Bool');

    const [isApuBleedValueOpen] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'Bool', 500);
    const [isApuMasterSwitchPressed] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'Bool', 500);
    const [isApuBleedSwitchPressed] = useSimVar('L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON', 'Bool', 500);
    const apuStatus = isApuMasterSwitchPressed || isApuBleedSwitchPressed;

    const [engPsi] = useSimVar(`L:A32NX_PNEU_ENG_${engNumber}_PRECOOLER_INLET_PRESSURE`, 'PSI', 500);
    const [otherEngPsi] = engNumber === 1 ? useSimVar('L:A32NX_PNEU_ENG_2_PRECOOLER_INLET_PRESSURE', 'PSI', 500) : useSimVar('L:A32NX_PNEU_ENG_1_PRECOOLER_INLET_PRESSURE', 'PSI', 500);
    const [engTmp] = useSimVar(`ENG EXHAUST GAS TEMPERATURE:${engNumber}`, 'Celsius', 500);
    const [otherEngTmp] = engNumber === 1 ? useSimVar('ENG EXHAUST GAS TEMPERATURE:2', 'Celsius', 500) : useSimVar('ENG EXHAUST GAS TEMPERATURE:1', 'Celsius', 500);
    const [apuPSI] = useSimVar('L:APU_BLEED_PRESSURE', 'PSI', 500);
    const [apuTmp] = useSimVar('L:A32NX_APU_EGT', 'Celsius', 500);

    let engPsiValue;
    let engTmpValue;

    if (isOtherEngineProvideBleed && !isEngProvideBleed && !isApuBleedValueOpen && isOtherEngRunning === 2 && !isxBleedValueOpen) {
        engTmpValue = 'XXX';
        engPsiValue = 'xx';
    } else if (isOtherEngineProvideBleed && !isEngProvideBleed && isApuBleedValueOpen && isOtherEngRunning === 2 && !isxBleedValueOpen) {
        engTmpValue = Math.round(apuTmp);
        engPsiValue = Math.round(apuPSI);
    } else if (isOtherEngineProvideBleed && !isEngProvideBleed && isOtherEngRunning === 2 && isxBleedValueOpen) {
        engTmpValue = Math.round(otherEngTmp);
        engPsiValue = Math.round(otherEngPsi);
    } else if (isxBleedValueOpen && isApuBleedValueOpen && !isEngProvideBleed && !isOtherEngineProvideBleed && apuStatus) {
        engTmpValue = Math.round(apuTmp);
        engPsiValue = Math.round(apuPSI);
    } else if (isEngProvideBleed && isOtherEngineProvideBleed && isxBleedValueOpen && isEngRunning === 2 && isOtherEngRunning === 2) {
        engTmpValue = Math.round(engTmp);
        engPsiValue = Math.round(engPsi);
    } else if (isEngProvideBleed && isOtherEngineProvideBleed && isxBleedValueOpen && isOtherEngRunning === 2) {
        engTmpValue = Math.round(otherEngTmp);
        engPsiValue = Math.round(otherEngPsi);
    } else if (isEngProvideBleed && !isOtherEngineProvideBleed && isxBleedValueOpen && isEngRunning === 2) {
        engTmpValue = Math.round(engTmp);
        engPsiValue = Math.round(engPsi);
    } else if (isEngProvideBleed && isOtherEngineProvideBleed && !isxBleedValueOpen && isEngRunning === 2 && isOtherEngRunning === 2) {
        engTmpValue = Math.round(engTmp);
        engPsiValue = Math.round(engPsi);
    } else if (!isEngProvideBleed && !isOtherEngineProvideBleed && !isxBleedValueOpen && isApuBleedValueOpen) {
        engTmpValue = Math.round(apuTmp);
        engPsiValue = Math.round(apuPSI);
    } else if (isEngProvideBleed && isEngRunning === 2 && !isxBleedValueOpen) {
        engTmpValue = Math.round(engTmp);
        engPsiValue = Math.round(engPsi);
    } else if (isEngProvideBleed && isOtherEngineProvideBleed && isEngRunning !== 2 && isOtherEngRunning !== 2 && isxBleedValueOpen) {
        engTmpValue = Math.round(apuTmp);
        engPsiValue = Math.round(apuPSI);
    } else {
        engTmpValue = 'XXX';
        engPsiValue = 'xx';
    }

    return (
        <SvgGroup x={x} y={y}>
            <rect className="st10 st12" x={0} y={0} width="42" height="49" />
            <text x={3} y={42} className={engTmpValue > 270 || engTmpValue < 150 ? 'warning st2 st6' : 'st7 st2 st6'}>{engTmpValue}</text>
            <text x={9} y={19} className={engPsiValue > 57 || engPsiValue < 4 ? 'warning st2 st6' : 'st7 st2 st6'}>{engPsiValue}</text>
            <text x={mirrored ? -41 : 50} y={19} className="st8 st2 st13">PSI</text>
            <text x={mirrored ? -29 : 62} y={42} className="st8 st2 st13">C</text>
            <text x={mirrored ? -21 : 54} y={42} className="st8 st2 st13">°</text>
        </SvgGroup>
    );
};

interface EngProps extends ComponentPositionProps {
    engNumber: number
}

const EngineNumber = ({ x, y, engNumber }: EngProps) => {
    const [fadecStatus] = useSimVar(`L:A32NX_FADEC_POWERED_ENG${engNumber}`, 'Bool', 500);
    const [engN2] = useSimVar(`L:A32NX_ENGINE_N2:${engNumber}`, 'Number', 500);

    const engIdle = 58;
    let engN2BelowIdle = true;

    if (engN2 < engIdle) {
        engN2BelowIdle = true;
    } else {
        engN2BelowIdle = false;
    }

    return (
        <SvgGroup x={x} y={y}>
            <text x={0} y={0} className={engN2BelowIdle && fadecStatus ? 'warning st1 st2 st14' : 'st1 st2 st14'}>{engNumber}</text>
        </SvgGroup>
    );
};

const EngineConnection = ({ x, y, engNumber, mirrored }: EngMirroredProps) => {
    const [isEngRunning] = useSimVar(`L:A32NX_ENGINE_STATE:${engNumber}`, 'Number', 500);
    return (
        <SvgGroup x={x} y={y}>
            <g className={mirrored ? 'mirrored' : ''}>
                <line className={isEngRunning ? 'st5' : 'warning st5'} x1={0} y1={45} x2={0} y2={0} />
                <line className={isEngRunning ? 'st5' : 'warning st5'} x1={60} y1={29} x2={90} y2={29} />
                <line className={isEngRunning ? 'st5' : 'warning st5'} x1={89} y1={29} x2={89} y2={45} />
            </g>
        </SvgGroup>
    );
};

const Apu = ({ x, y }: ComponentPositionProps) => {
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

const XBleed = ({ x, y }: ComponentPositionProps) => {
    const [isxBleedValveOpen] = useSimVar('L:A32NX_PNEU_XBLEED_VALVE_OPEN', 'Bool', 500);

    return (
        <SvgGroup x={x} y={y}>
            {/* X Bleed valve */}
            <circle className="st5" cx={237} cy={16} r="16" />

            {/* X Bleed valve open */}
            <g className={isxBleedValveOpen ? '' : 'hide'}>
                <line id="center-line-2" className="st5" x1={0} y1={16} x2={222} y2={16} />
                <line id="center-line-3" className="st5" x1={253} y1={16} x2={358} y2={16} />
                <line className="st5" x1={221} y1={16} x2={253} y2={16} />
            </g>

            {/* X Bleed valve closed */}
            <g className={isxBleedValveOpen ? 'hide' : ''}>
                <line className="st5" x1={237} y1={0} x2={237} y2={32} />
            </g>
        </SvgGroup>
    );
};

const RamAir = ({ x, y }: ComponentPositionProps) => {
    const [isRamAirValveOpen] = useSimVar('L:A32NX_AIRCOND_RAMAIR_TOGGLE', 'Bool', 500);

    return (
        <SvgGroup x={x} y={y}>
            <circle className="st5" cx={18} cy={39} r={16} />
            <line className="st5" x1={18} y1={78} x2={18} y2={55} />
            <text x={0} y={98} className="st1 st2 st6">RAM</text>
            <text x={0} y={117} className="st1 st2 st6">AIR</text>

            <g className={isRamAirValveOpen ? '' : 'hide'}>
                <line className="st5" x1={18} y1={23} x2={18} y2={55} />
                <line id="ram-air-connection-line" className="st5" x1={18} y1={0} x2={18} y2={23} />
            </g>
            <g className={isRamAirValveOpen ? 'hide' : ''}>
                <line className="st5" x1={2} y1={39} x2={34} y2={39} />
            </g>
        </SvgGroup>
    );
};

const PackFlowIndicator = ({ x, y }: ComponentPositionProps) => {
    const [packFlowKnob] = useSimVar('L:A32NX_KNOB_OVHD_AIRCOND_PACKFLOW_Position', 'Number', 500);
    const packflowRotate = packFlowKnob * 57.5;

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
                <line className="st5" strokeWidth="5px" strokeLinecap="round" x1={19} y1={84} x2={0} y2={72} />
            </g>
            <g style={transformStyleOutFlow}>
                <line className="st5" strokeWidth="5px" strokeLinecap="round" x1={34} y1={18} x2={0} y2={0} />
            </g>
        </SvgGroup>
    );
};

// TODO: Cleanup Under this line

const ShouldMoveOut = () => (
    <g>
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
    </g>
);

const Ground = () => {
    const [isAircraftOnGround] = useSimVar('SIM ON GROUND', 'Bool', 500);
    const [groundSpeed] = useSimVar('GPS GROUND SPEED', 'Meters per second', 500);
    const [isEng1Running] = useSimVar('L:A32NX_ENGINE_STATE:1', 'Number', 500);
    const [isEng2Running] = useSimVar('L:A32NX_ENGINE_STATE:2', 'Number', 500);

    // hide GND during flight/when moving/at least one engine is running
    if (isAircraftOnGround && groundSpeed < 1 && (isEng1Running === 0 && isEng2Running === 0)) {
        return (
            <g>
                <polygon className="st9" points="234,300 250,300 242,286 234,300" />
                <text x={224.5} y={318} className="st1 st2 st6">GND</text>
            </g>
        );
    }
    return null;
};

const TopTriangles = () => {
    // triangles above and line under them

    // in amber when pack flow control valves 1 and 2 are fully closed
    // in amber when the emergency ram air valve is fully closed
    const leftPack = true;
    const rightPack = true;

    return (
        <g className={leftPack && rightPack ? 'st5' : 'warning_trg st5'}>
            <polyline points="121,68 121,49 479,49 479,68" />
            <polygon points="163,43 177,43 170,30 163,43" />
            <polygon points="293,43 307,43 300,30 293,43" />
            <polygon points="423,43 437,43 430,30 423,43" />
        </g>
    );
};

const WingAntiIce = () => {
    const [isAntiIceOn] = useSimVar('STRUCTURAL DEICE SWITCH', 'Bool', 500);
    const leftAntiIceFault = false;
    const rightAntIceFault = false;

    if (isAntiIceOn) {
        return (
            <g>
                {/* anti ice indicator */}
                <polygon className={leftAntiIceFault ? 'warning_trg st5' : 'st5'} points="116,268 116,284 102,276 116,268" />
                <polygon className={rightAntIceFault ? 'warning_trg st5' : 'st5'} points="484,268 484,284 498,276 484,268" />

                {/* anti ice text */}
                <text x={45} y={268} fontSize="18px" className="st1 st2">ANTI</text>
                <text x={43} y={285} fontSize="18px" className="st1 st2">ICE</text>

                <text x={513} y={268} fontSize="18px" className="st1 st2">ANTI</text>
                <text x={524} y={285} fontSize="18px" className="st1 st2">ICE</text>
            </g>
        );
    }
    return null;
};

const Pack = () => {
    const [isApuBleedValueOpen] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'Bool', 500);
    const [isxBleedValveOpen] = useSimVar('L:A32NX_PNEU_XBLEED_VALVE_OPEN', 'Bool', 500);

    const [isEng1Running] = useSimVar('L:A32NX_ENGINE_STATE:1', 'Number', 500);
    const [isEng2Running] = useSimVar('L:A32NX_ENGINE_STATE:2', 'Number', 500);
    const [isEng1ProvideBleed] = useSimVar('BLEED AIR ENGINE:1', 'Bool', 500);
    const [isEng2ProvideBleed] = useSimVar('BLEED AIR ENGINE:1', 'Bool', 500);

    const isLeftPackOpen = true;
    const isRightPackOpen = true;
    const pack1Fault = false;
    const pack2Fault = false;

    const eng1PackInTmp = 123;
    const eng1PackOutTmp = 45;
    const eng2PackInTmp = 123;
    const eng2PackOutTmp = 45;
    const apuPackInTmp = 123;
    const apuPackOutTmp = 45;

    let leftPackInTmp;
    let leftPackOutTmp;
    let rightPackInTmp;
    let rightPackOutTmp;
    if (isLeftPackOpen && isEng1Running !== 0 && isEng1ProvideBleed) {
        leftPackInTmp = eng1PackInTmp;
        leftPackOutTmp = eng1PackOutTmp;
    } else if (isLeftPackOpen && isxBleedValveOpen && isEng2Running !== 0 && isEng2ProvideBleed) {
        leftPackInTmp = eng2PackInTmp;
        leftPackOutTmp = eng2PackOutTmp;
    } else if (isLeftPackOpen && isApuBleedValueOpen) {
        leftPackInTmp = apuPackInTmp;
        leftPackOutTmp = apuPackOutTmp;
    } else {
        leftPackInTmp = 'xx';
        leftPackOutTmp = 'xx';
    }

    if (isRightPackOpen && isEng2Running !== 0 && isEng2ProvideBleed) {
        rightPackInTmp = eng2PackInTmp;
        rightPackOutTmp = eng2PackOutTmp;
    } else if (isRightPackOpen && isxBleedValveOpen && isEng1Running !== 0 && isEng1ProvideBleed) {
        rightPackInTmp = eng1PackInTmp;
        rightPackOutTmp = eng1PackOutTmp;
    } else if (isRightPackOpen && isApuBleedValueOpen) {
        rightPackInTmp = apuPackInTmp;
        rightPackOutTmp = apuPackOutTmp;
    } else {
        rightPackInTmp = 'xx';
        rightPackOutTmp = 'xx';
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

            {/* pack valve circles */}
            <circle className="st5" cx="479" cy="227" r="16" />
            <circle className="st5" cx="121" cy="227" r="16" />

            {/* pack valves */}
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

            <text id="left-pack-in" fontSize="22px" x={103} y={170} className={pack1Fault ? 'warning st2 st6' : 'st7 st2 st6'}>{leftPackInTmp}</text>
            <text id="left-pack-out" fontSize="22px" x={109} y={100} className={pack1Fault ? 'warning st2 st6' : 'st7 st2 st6'}>{leftPackOutTmp}</text>
            <text id="right-pack-in" fontSize="22px" x={461} y={170} className={pack2Fault ? 'warning st2 st6' : 'st7 st2 st6'}>{rightPackInTmp}</text>
            <text id="right-pack-out" fontSize="22px" x={467} y={100} className={pack2Fault ? 'warning st2 st6' : 'st7 st2 st6'}>{rightPackOutTmp}</text>
        </g>
    );
};

render(<BleedPage />);
