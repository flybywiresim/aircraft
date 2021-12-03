import React, { Component } from 'react';
import { createDeltaTimeCalculator, getSimVar, renderTarget } from '../util.js';

export const FMA = ({ isAttExcessive }) => {
    const activeLateralMode = getSimVar('L:A32NX_FMA_LATERAL_MODE', 'number');
    const activeVerticalMode = getSimVar('L:A32NX_FMA_VERTICAL_MODE', 'enum');
    const sharedModeActive = activeLateralMode === 32 || activeLateralMode === 33 || activeLateralMode === 34 || (activeLateralMode === 20 && activeVerticalMode === 24);
    const engineMessage = getSimVar('L:A32NX_AUTOTHRUST_MODE_MESSAGE', 'enum');
    const BC3Message = getSimVar('L:A32NX_BC3Message', 'enum');
    const AB3Message = (getSimVar('L:A32NX_MachPreselVal', 'mach') !== -1
        || getSimVar('L:A32NX_SpeedPreselVal', 'knots') !== -1) && BC3Message === 0 && engineMessage === 0;

    let secondBorder: string;
    if (sharedModeActive && !isAttExcessive) {
        secondBorder = '';
    } else if (BC3Message !== 0) {
        secondBorder = 'm66.241 0.33732v15.766';
    } else {
        secondBorder = 'm66.241 0.33732v20.864';
    }

    let firstBorder: string;
    if (AB3Message && !isAttExcessive) {
        firstBorder = 'm33.117 0.33732v15.766';
    } else {
        firstBorder = 'm33.117 0.33732v20.864';
    }

    return (
        <g id="FMA" className="NormalStroke Grey">
            <path d={firstBorder} />
            <path d={secondBorder} />
            <path d="m102.52 0.33732v20.864" />
            <path d="m133.72 0.33732v20.864" />
            <Row1 isAttExcessive={isAttExcessive} />
            <Row2 isAttExcessive={isAttExcessive} />
            <Row3 isAttExcessive={isAttExcessive} />
        </g>
    );
};

const Row1 = ({ isAttExcessive }) => (
    <g>
        <A1A2Cell />
        {!isAttExcessive && (
            <>
                <B1Cell />
                <C1Cell />
                <D1D2Cell />
                <BC1Cell />
            </>
        )}
        <E1Cell />
    </g>
);

const Row2 = ({ isAttExcessive }) => (
    <g>
        {!isAttExcessive && (
            <>
                <B2Cell />
                <C2Cell />
            </>
        )}
        <E2Cell />
    </g>
);

const Row3 = ({ isAttExcessive }) => (
    <g>
        <A3Cell />
        {!isAttExcessive && (
            <>
                <AB3Cell />
                <D3Cell />
            </>
        )}
        <E3Cell />
    </g>
);

const A1A2Cell = () => {
    const AThrMode = getSimVar('L:A32NX_AUTOTHRUST_MODE', 'enum');

    let text: string | undefined;

    switch (AThrMode) {
    case 1:
        return (
            <g>
                <path className="NormalStroke White" d="m24.023 1.8143v13.506h-15.048v-13.506z" />
                <text className="FontMedium MiddleAlign White" x="16.558302" y="6.8888531">MAN</text>
                <text className="FontMedium MiddleAlign White" x="16.511532" y="14.232082">TOGA</text>
            </g>
        );
    case 2:
        return (
            <g>
                <path className="NormalStroke White" d="m29.776 1.8143v13.506h-26.414v-13.506z" />
                <text className="FontMedium MiddleAlign White" x="16.558302" y="6.8888531">MAN</text>
                <text className="FontMedium MiddleAlign White" x="16.511532" y="14.232082">GA SOFT</text>
            </g>
        );
    case 3: {
        const FlexTemp = Math.round(getSimVar('L:AIRLINER_TO_FLEX_TEMP', 'number'));
        const FlexText = FlexTemp >= 0 ? (`+${FlexTemp}`) : FlexTemp.toString();
        return (
            <g>
                <path className="NormalStroke White" d="m31.521 1.8143v13.506h-30.217v-13.506z" />
                <text className="FontMedium MiddleAlign White" x="16.558302" y="6.8888531">MAN</text>
                <text className="FontMedium MiddleAlign White" x="16.511532" y="14.232082">
                    <tspan xmlSpace="preserve">FLX  </tspan>
                    <tspan className="Cyan">{FlexText}</tspan>
                </text>
            </g>
        );
    }
    case 4:
        return (
            <g>
                <path className="NormalStroke White" d="m23.172 1.8143v13.506h-12.99v-13.506z" />
                <text className="FontMedium MiddleAlign White" x="16.558302" y="6.8888531">MAN</text>
                <text className="FontMedium MiddleAlign White" x="16.511532" y="14.232082">DTO</text>
            </g>
        );
    case 5:
        return (
            <g>
                <path className="NormalStroke White" d="m23.172 1.8143v13.506h-12.99v-13.506z" />
                <text className="FontMedium MiddleAlign White" x="16.558302" y="6.8888531">MAN</text>
                <text className="FontMedium MiddleAlign White" x="16.511532" y="14.232082">MCT</text>
            </g>
        );
    case 6:
        return (
            <g>
                <path className="NormalStroke Amber" d="m23.172 1.8143v13.506h-12.99v-13.506z" />
                <text className="FontMedium MiddleAlign White" x="16.558302" y="6.8888531">MAN</text>
                <text className="FontMedium MiddleAlign White" x="16.511532" y="14.232082">THR</text>
            </g>
        );
    case 7:
        text = 'SPEED';
        break;
    case 8:
        text = 'MACH';
        break;
    case 9:
        text = 'THR MCT';
        break;
    case 10:
        text = 'THR CLB';
        break;
    case 11:
        text = 'THR LVR';
        break;
    case 12:
        text = 'THR IDLE';
        break;
    case 13:
        return (
            <g>
                <path className="NormalStroke Amber BlinkInfinite" d="m0.70556 1.8143h30.927v6.0476h-30.927z" />
                <text className="FontMedium MiddleAlign Green" x="16.158028" y="6.8888531">A.FLOOR</text>
            </g>
        );
    case 14:
        return (
            <g>
                <path className="NormalStroke Amber BlinkInfinite" d="m0.70556 1.8143h30.927v6.0476h-30.927z" />
                <text className="FontMedium MiddleAlign Green" x="16.158028" y="6.8888531">TOGA LK</text>
            </g>
        );
    default:
        return null;
    }

    return (
        <g>
            <ShowForSeconds timer={9} id={AThrMode}>
                <path className="NormalStroke White" d="m0.70556 1.8143h30.927v6.0476h-30.927z" />
            </ShowForSeconds>
            <text className="FontMedium MiddleAlign Green" x="16.158028" y="6.8888531">{text}</text>
        </g>
    );
};

const A3Cell = () => {
    const engineMessage = getSimVar('L:A32NX_AUTOTHRUST_MODE_MESSAGE', 'enum');

    let text: string;
    let className: string;
    switch (engineMessage) {
    case 1:
        text = 'THR LK';
        className = 'Amber BlinkInfinite';
        break;
    case 2:
        text = 'LVR TOGA';
        className = 'White BlinkInfinite';
        break;
    case 3:
        text = 'LVR CLB';
        className = 'White BlinkInfinite';
        break;
    case 4:
        text = 'LVR MCT';
        className = 'White BlinkInfinite';
        break;
    case 5:
        text = 'LVR ASYM';
        className = 'Amber';
        break;
    default:
        return null;
    }

    return (
        <text className={`FontMedium MiddleAlign ${className}`} x="16.511532" y="21.481768">{text}</text>
    );
};

const AB3Cell = () => {
    if (getSimVar('L:A32NX_AUTOTHRUST_MODE_MESSAGE', 'enum') !== 0) {
        return null;
    }
    const machPresel = getSimVar('L:A32NX_MachPreselVal', 'mach');
    if (machPresel !== -1) {
        const text = machPresel.toFixed(2);
        return (
            <text className="FontMedium MiddleAlign Cyan" x="35.275196" y="21.616354">{`MACH SEL ${text}`}</text>
        );
    }
    const spdPresel = getSimVar('L:A32NX_SpeedPreselVal', 'knots');
    if (spdPresel !== -1) {
        const text = Math.round(spdPresel);
        return (
            <text className="FontMedium MiddleAlign Cyan" x="35.275196" y="21.616354">{`SPEED SEL ${text}`}</text>
        );
    }
    return null;
};

const B1Cell = () => {
    const activeVerticalMode = getSimVar('L:A32NX_FMA_VERTICAL_MODE', 'enum');

    let text: string | JSX.Element;
    let inProtection = false;

    switch (activeVerticalMode) {
    case 31:
        text = 'G/S';
        break;
    // case 2:
    //     text = 'F-G/S';
    //     break;
    case 30:
        text = 'G/S*';
        break;
    // case 4:
    //     text = 'F-G/S*';
    //     break;
    case 40:
    case 41:
        text = 'SRS';
        break;
    // case 8:
    //     text = 'TCAS';
    //     break;
    // case 9:
    //     text = 'FINAL';
    //     break;
    case 23:
        text = 'DES';
        break;
    case 13:
        if (getSimVar('L:A32NX_FMA_EXPEDITE_MODE', 'bool')) {
            text = 'EXP DES';
        } else {
            text = 'OP DES';
        }
        break;
    case 22:
        text = 'CLB';
        break;
    case 12:
        if (getSimVar('L:A32NX_FMA_EXPEDITE_MODE', 'bool')) {
            text = 'EXP CLB';
        } else {
            text = 'OP CLB';
        }
        break;
    case 10:
        if (getSimVar('L:A32NX_FMA_CRUISE_ALT_MODE', 'Bool')) {
            text = 'ALT CRZ';
        } else {
            text = 'ALT';
        }
        break;
    case 11:
        text = 'ALT*';
        break;
    case 21:
        text = 'ALT CST*';
        break;
    case 20:
        text = 'ALT CST';
        break;
    // case 18:
    //     text = 'ALT CRZ';
    //     break;
    case 15: {
        const FPA = getSimVar('L:A32NX_AUTOPILOT_FPA_SELECTED', 'Degree');
        inProtection = getSimVar('L:A32NX_FMA_SPEED_PROTECTION_MODE', 'bool');
        const FPAText = `${(FPA >= 0 ? '+' : '')}${(Math.round(FPA * 10) / 10).toFixed(1)}°`;

        text = (
            <>
                <tspan>FPA</tspan>
                <tspan className={`${inProtection ? 'PulseCyanFill' : 'Cyan'}`} xmlSpace="preserve">{FPAText}</tspan>
            </>
        );
        break;
    }
    case 14: {
        const VS = getSimVar('L:A32NX_AUTOPILOT_VS_SELECTED', 'feet per minute');
        inProtection = getSimVar('L:A32NX_FMA_SPEED_PROTECTION_MODE', 'bool');
        const VSText = `${(VS >= 0 ? '+' : '')}${Math.round(VS).toString()}`.padStart(5, ' ');

        text = (
            <>
                <tspan>V/S</tspan>
                <tspan className={`${inProtection ? 'PulseCyanFill' : 'Cyan'}`} xmlSpace="preserve">{VSText}</tspan>
            </>
        );
        break;
    }
    default:
        return null;
    }

    const inSpeedProtection = inProtection && (activeVerticalMode === 14 || activeVerticalMode === 15);
    const inModeReversion = getSimVar('L:A32NX_FMA_MODE_REVERSION', 'bool');

    return (
        <g>
            <ShowForSeconds timer={10} id={activeVerticalMode}>
                <path className={`${(inSpeedProtection || inModeReversion) ? 'NormalStroke None' : 'NormalStroke White'}`} d="m34.656 1.8143h29.918v6.0476h-29.918z" />
            </ShowForSeconds>
            {inSpeedProtection && <path className="NormalStroke Amber BlinkInfinite" d="m34.656 1.8143h29.918v6.0476h-29.918z" />}
            {inModeReversion && <path className="NormalStroke White BlinkInfinite" d="m34.656 1.8143h29.918v6.0476h-29.918z" />}
            <text className="FontMedium MiddleAlign Green" x="49.498924" y="6.8785663" xmlSpace="preserve">{text}</text>
        </g>
    );
};

const B2Cell = () => {
    const armedVerticalBitmask = getSimVar('L:A32NX_FMA_VERTICAL_ARMED', 'number');

    const altArmed = (armedVerticalBitmask >> 0) & 1;
    const altCstArmed = (armedVerticalBitmask >> 1) & 1;
    const clbArmed = (armedVerticalBitmask >> 2) & 1;
    const desArmed = (armedVerticalBitmask >> 3) & 1;
    const gsArmed = (armedVerticalBitmask >> 4) & 1;
    const finalArmed = (armedVerticalBitmask >> 5) & 1;

    let text1: string | null;
    let color1 = 'Cyan';
    if (clbArmed) {
        text1 = 'CLB';
    } else if (desArmed) {
        text1 = 'DES';
    } else if (altCstArmed) {
        text1 = 'ALT';
        color1 = 'Magenta';
    } else if (altArmed) {
        text1 = 'ALT';
    } else {
        text1 = null;
    }

    let text2;
    // case 1:
    //     text2 = 'F-G/S';
    //     break;
    if (gsArmed) {
        text2 = 'G/S';
    } else if (finalArmed) {
        text2 = 'FINAL';
    } else {
        text2 = null;
    }

    return (
        <g>
            {text1
                && <text className={`FontMedium MiddleAlign ${color1}`} x="40.520622" y="14.130308">{text1}</text>}
            {text2
                && <text className="FontMedium MiddleAlign Cyan" x="55.275803" y="14.143736">{text2}</text>}
        </g>
    );
};

const C1Cell = () => {
    const activeLateralMode = getSimVar('L:A32NX_FMA_LATERAL_MODE', 'number');

    const armedVerticalBitmask = getSimVar('L:A32NX_FMA_VERTICAL_ARMED', 'number');
    const finalArmed = (armedVerticalBitmask >> 5) & 1;

    const activeVerticalMode = getSimVar('L:A32NX_FMA_VERTICAL_MODE', 'enum');

    let text: string;
    let id = 0;
    if (activeLateralMode === 50) {
        text = 'GA TRK';
        id = 1;
    } else if (activeLateralMode === 30) {
        text = 'LOC *';
        id = 3;
    } else if (activeLateralMode === 10) {
        text = 'HDG';
        id = 5;
    } else if (activeLateralMode === 40) {
        text = 'RWY';
        id = 6;
    } else if (activeLateralMode === 41) {
        text = 'RWY TRK';
        id = 7;
    } else if (activeLateralMode === 11) {
        text = 'TRACK';
        id = 8;
    } else if (activeLateralMode === 31) {
        text = 'LOC';
        id = 10;
    } else if (activeLateralMode === 20 && !finalArmed && activeVerticalMode !== 24) {
        text = 'NAV';
        id = 13;
    } else if (activeLateralMode === 20 && finalArmed && activeVerticalMode !== 24) {
        text = 'APP NAV';
        id = 12;
    } else {
        return null;
    }
    // case 2:
    //     text = 'LOC B/C*';
    //     id = 2;
    //     break;
    // case 4:
    //     text = 'F-LOC*';
    //     id = 4;
    //     break;
    // case 9:
    //     text = 'LOC B/C';
    //     id = 9;
    //     break;
    // case 11:
    //     text = 'F-LOC';
    //     id = 11;
    //     break;
    // case 12:
    //     text = 'APP NAV';
    //     id = 12;
    //     break;

    return (
        <g>
            <ShowForSeconds timer={10} id={id}>
                <path className="NormalStroke White" d="m100.87 1.8143v6.0476h-33.075l1e-6 -6.0476z" />
            </ShowForSeconds>
            <text className="FontMedium MiddleAlign Green" x="84.490074" y="6.9027362">{text}</text>
        </g>
    );
};

const C2Cell = () => {
    const armedLateralBitmask = getSimVar('L:A32NX_FMA_LATERAL_ARMED', 'number');

    const navArmed = (armedLateralBitmask >> 0) & 1;
    const locArmed = (armedLateralBitmask >> 1) & 1;

    const armedVerticalBitmask = getSimVar('L:A32NX_FMA_VERTICAL_ARMED', 'number');
    const finalArmed = (armedVerticalBitmask >> 5) & 1;

    const activeVerticalMode = getSimVar('L:A32NX_FMA_VERTICAL_MODE', 'enum');

    let text: string;
    if (locArmed) {
        // case 1:
        //     text = 'LOC B/C';
        //     break;
        text = 'LOC';
        // case 3:
        //     text = 'F-LOC';
        //     break;
    } else if (navArmed && (finalArmed || activeVerticalMode === 24)) {
        text = 'APP NAV';
    } else if (navArmed) {
        text = 'NAV';
    } else {
        return null;
    }

    return (
        <text className="FontMedium MiddleAlign Cyan" x="84.536842" y="14.130308">{text}</text>
    );
};

const BC1Cell = () => {
    const activeVerticalMode = getSimVar('L:A32NX_FMA_VERTICAL_MODE', 'enum');
    const activeLateralMode = getSimVar('L:A32NX_FMA_LATERAL_MODE', 'number');

    let text: string;
    let id = 0;
    if (activeVerticalMode === 34) {
        text = 'ROLL OUT';
        id = 1;
    } else if (activeVerticalMode === 33) {
        text = 'FLARE';
        id = 2;
    } else if (activeVerticalMode === 32) {
        text = 'LAND';
        id = 3;
    } else if (activeVerticalMode === 24 && activeLateralMode === 20) {
        text = 'FINAL APP';
        id = 4;
    } else {
        return null;
    }

    return (
        <g>
            <ShowForSeconds timer={9} id={id}>
                <path className="NormalStroke White" d="m50.178 1.8143h35.174v6.0476h-35.174z" />
            </ShowForSeconds>
            <text className="FontMedium MiddleAlign Green" x="67.9795" y="6.8893085">{text}</text>
        </g>
    );
};

const D1D2Cell = () => {
    const approachCapability = getSimVar('L:A32NX_ApproachCapability', 'enum');

    let text1: string;
    let text2: string | undefined;
    switch (approachCapability) {
    case 1:
        text1 = 'CAT1';
        break;
    case 2:
        text1 = 'CAT2';
        break;
    case 3:
        text1 = 'CAT3';
        text2 = 'SINGLE';
        break;
    case 4:
        text1 = 'CAT3';
        text2 = 'DUAL';
        break;
    case 5:
        text1 = 'AUTO';
        text2 = 'LAND';
        break;
    case 6:
        text1 = 'F-APP';
        break;
    case 7:
        text1 = 'F-APP';
        text2 = '+ RAW';
        break;
    case 8:
        text1 = 'RAW';
        text2 = 'ONLY';
        break;
    default:
        return null;
    }

    const box = text2 ? <path className="NormalStroke White" d="m104.1 1.8143h27.994v13.506h-27.994z" />
        : <path className="NormalStroke White" d="m104.1 1.8143h27.994v6.0476h-27.994z" />;

    return (
        <g>
            <text className="FontMedium MiddleAlign White" x="118.09216" y="7.0131598">{text1}</text>
            {text2
            && <text className="FontMedium MiddleAlign White" x="118.15831" y="14.130308">{text2}</text>}
            <ShowForSeconds id={approachCapability} timer={9}>
                {box}
            </ShowForSeconds>
        </g>
    );
};

const D3Cell = () => {
    const MDA = getSimVar('L:AIRLINER_MINIMUM_DESCENT_ALTITUDE', 'feet');
    let text: JSX.Element | string | null = null;
    let fontSize = 'FontSmallest';
    if (MDA !== 0) {
        const MDAText = Math.round(MDA).toString().padStart(6, ' ');
        text = (
            <>
                <tspan>BARO</tspan>
                <tspan className="Cyan" xmlSpace="preserve">{MDAText}</tspan>
            </>
        );
    } else {
        const DH = getSimVar('L:AIRLINER_DECISION_HEIGHT', 'feet');
        if (DH !== -1 && DH !== -2) {
            const DHText = Math.round(DH).toString().padStart(4, ' ');
            text = (
                <>
                    <tspan>RADIO</tspan>
                    <tspan className="Cyan" xmlSpace="preserve">{DHText}</tspan>
                </>
            );
        } else if (DH === -2) {
            text = 'NO DH';
            fontSize = 'FontMedium';
        }
    }

    return (
        <text className={`${fontSize} MiddleAlign White`} x="118.1583" y="21.188744">{text}</text>
    );
};

const E1Cell = () => {
    const AP1Engaged = getSimVar('L:A32NX_AUTOPILOT_1_ACTIVE', 'bool');
    const AP2Engaged = getSimVar('L:A32NX_AUTOPILOT_2_ACTIVE', 'bool');

    if (!AP1Engaged && !AP2Engaged) {
        return null;
    }

    let text: string;
    let id = 0;
    if (AP1Engaged && !AP2Engaged) {
        text = 'AP1';
        id = 1;
    } else if (AP2Engaged && !AP1Engaged) {
        text = 'AP2';
        id = 2;
    } else {
        text = 'AP1+2';
        id = 3;
    }

    return (
        <g>
            <ShowForSeconds timer={9} id={id}>
                <path className="NormalStroke White" d="m156.13 1.8143v6.0476h-20.81v-6.0476z" />
            </ShowForSeconds>
            <text className="FontMedium MiddleAlign White" x="145.61546" y="6.9559975">{text}</text>
        </g>
    );
};

const E2Cell = () => {
    const FD1Active = getSimVar('AUTOPILOT FLIGHT DIRECTOR ACTIVE:1', 'bool');
    const FD2Active = getSimVar('AUTOPILOT FLIGHT DIRECTOR ACTIVE:2', 'bool');

    if (!FD1Active && !FD2Active && !getSimVar('L:A32NX_AUTOPILOT_1_ACTIVE', 'bool') && !getSimVar('L:A32NX_AUTOPILOT_2_ACTIVE', 'bool')) {
        return null;
    }

    const text = `${FD1Active ? '1' : '-'} FD ${FD2Active ? '2' : '-'}`;
    return (
        <text className="FontMedium MiddleAlign White" x="145.8961" y="14.218581">{text}</text>
    );
};

const E3Cell = () => {
    const status = getSimVar('L:A32NX_AUTOTHRUST_STATUS', 'enum');

    let color: string;
    let id = 0;
    switch (status) {
    case 1:
        color = 'Cyan';
        id = 1;
        break;
    case 2:
        color = 'White';
        id = 2;
        break;
    default:
        return null;
    }

    return (
        <g>
            <ShowForSeconds timer={9} id={id}>
                <path className="NormalStroke White" d="m135.32 16.329h20.81v6.0476h-20.81z" />
            </ShowForSeconds>
            <text className={`FontMedium MiddleAlign ${color}`} x="145.75578" y="21.434536">A/THR</text>
        </g>
    );
};

interface ShowForSecondsProps {
    timer: number;
    id: number;
}

class ShowForSeconds extends Component<ShowForSecondsProps> {
    private Timer: number;

    private PrevID: number;

    private GetDeltaTime: () => number;

    private Update: () => void;

    constructor(props: ShowForSecondsProps) {
        super(props);

        this.Timer = this.props.timer || 10;
        this.PrevID = NaN;

        this.GetDeltaTime = createDeltaTimeCalculator();
        const updateFunction = () => {
            const deltaTime = this.GetDeltaTime();
            if (this.Timer > 0) {
                this.Timer -= deltaTime / 1000;
            }
            this.forceUpdate();
        };
        this.Update = updateFunction.bind(this);
    }

    componentDidMount() {
        renderTarget.parentElement.addEventListener('update', this.Update);
    }

    shouldComponentUpdate(nextProps: ShowForSecondsProps) {
        if (this.PrevID !== nextProps.id) {
            this.PrevID = nextProps.id;
            this.Timer = nextProps.timer || 10;
        }

        return false;
    }

    componentWillUnmount() {
        renderTarget.parentElement.removeEventListener('update', this.Update);
    }

    render() {
        if (this.Timer > 0) {
            return (
                this.props.children
            );
        }
        return null;
    }
}
