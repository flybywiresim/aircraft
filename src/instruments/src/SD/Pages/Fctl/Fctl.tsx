import React from 'react';
import { render } from '@instruments/common/index';
import { useArinc429Var } from '@instruments/common/arinc429';
import { Arinc429Word } from '@shared/arinc429';
import { setIsEcamPage } from '../../../Common/defaults';
import { useSimVar } from '../../../Common/simVars';
import { PageTitle } from '../../Common/PageTitle';
import { EcamPage } from '../../Common/EcamPage';
import { SvgGroup } from '../../Common/SvgGroup';
import { HydraulicsProvider, useHydraulics } from '../../Common/HydraulicsProvider';
import { ComponentPositionProps } from '../../Common/ComponentPositionProps';
import { HydraulicSystem } from '../../Common/HydraulicSystem';
import { HydraulicIndicator } from '../../Common/HydraulicIndicator';
import { ComponentSidePositionProps } from '../../Common/ComponentSidePositionProps';
import { Spoilers } from '../../Common/Spoilers';

import './Fctl.scss';

setIsEcamPage('fctl_page');

interface HydraulicSystemPairProps {
    leftHydraulicSystem: HydraulicSystem,
    rightHydraulicSystem: HydraulicSystem,
}

export const FctlPage = () => {
    const fcdc1DiscreteWord1 = useArinc429Var('L:A32NX_FCDC_1_DISCRETE_WORD_1');
    const fcdc2DiscreteWord1 = useArinc429Var('L:A32NX_FCDC_2_DISCRETE_WORD_1');
    const fcdc1DiscreteWord2 = useArinc429Var('L:A32NX_FCDC_1_DISCRETE_WORD_2');
    const fcdc2DiscreteWord2 = useArinc429Var('L:A32NX_FCDC_2_DISCRETE_WORD_2');
    const fcdc1DiscreteWord3 = useArinc429Var('L:A32NX_FCDC_1_DISCRETE_WORD_3');
    const fcdc2DiscreteWord3 = useArinc429Var('L:A32NX_FCDC_2_DISCRETE_WORD_3');

    const fcdcDiscreteWord1ToUse = !fcdc1DiscreteWord1.isFailureWarning() ? fcdc1DiscreteWord1 : fcdc2DiscreteWord1;
    const fcdcDiscreteWord2ToUse = !fcdc1DiscreteWord2.isFailureWarning() ? fcdc1DiscreteWord2 : fcdc2DiscreteWord2;
    const fcdcDiscreteWord3ToUse = !fcdc1DiscreteWord3.isFailureWarning() ? fcdc1DiscreteWord3 : fcdc2DiscreteWord3;

    return (
        <EcamPage name="ecam-fctl">
            <PageTitle x={6} y={18} text="F/CTL" />

            <HydraulicsProvider>
                <Wings x={98} y={14} />

                <Aileron x={72} y={153} side="left" leftHydraulicSystem="B" rightHydraulicSystem="G" fcdcDiscreteWord2={fcdcDiscreteWord2ToUse} fcdcDiscreteWord3={fcdcDiscreteWord3ToUse} />
                <Aileron x={528} y={153} side="right" leftHydraulicSystem="G" rightHydraulicSystem="B" fcdcDiscreteWord2={fcdcDiscreteWord2ToUse} fcdcDiscreteWord3={fcdcDiscreteWord3ToUse} />

                <Note x={195} y={178}>ELAC</Note>
                <Elac x={170} y={190} num={1} fcdcDiscreteWord1={fcdcDiscreteWord1ToUse} />
                <Elac x={194} y={206} num={2} fcdcDiscreteWord1={fcdcDiscreteWord1ToUse} />

                <Note x={350} y={178}>SEC</Note>
                <Sec x={324} y={190} num={1} fcdcDiscreteWord1={fcdcDiscreteWord1ToUse} />
                <Sec x={348} y={206} num={2} fcdcDiscreteWord1={fcdcDiscreteWord1ToUse} />
                <Sec x={372} y={222} num={3} fcdcDiscreteWord1={fcdcDiscreteWord1ToUse} />

                <Elevator x={168} y={328} side="left" leftHydraulicSystem="B" rightHydraulicSystem="G" fcdcDiscreteWord2={fcdcDiscreteWord2ToUse} fcdcDiscreteWord3={fcdcDiscreteWord3ToUse} />
                <Elevator x={432} y={328} side="right" leftHydraulicSystem="Y" rightHydraulicSystem="B" fcdcDiscreteWord2={fcdcDiscreteWord2ToUse} fcdcDiscreteWord3={fcdcDiscreteWord3ToUse} />

                <PitchTrim x={280} y={283} fcdcDiscreteWord2={fcdcDiscreteWord2ToUse} />

                <Stabilizer x={268} y={357} />

                <Rudder x={250} y={356} />
            </HydraulicsProvider>
        </EcamPage>
    );
};

const Wings = ({ x = 0, y = 0 }: ComponentPositionProps) => (
    <SvgGroup x={x} y={y}>
        <Note x={202} y={93}>SPD BRK</Note>

        <HydraulicIndicator x={171} y={0} type="G" />
        <HydraulicIndicator x={193} y={0} type="B" />
        <HydraulicIndicator x={215} y={0} type="Y" />

        <Spoilers x={5} y={70} />

        {/* Left spoiler wing shape */}
        <path className="MainShape" d="M0 47 l0 -5 l140 -23 l0 5" />
        <path className="MainShape" d="M37 96 l0 5 l105 -12 l0 -5" />

        {/* Right spoiler wing shape */}
        <path className="MainShape" d="M404 47 l0 -5 l-140 -23 l0 5" />
        <path className="MainShape" d="M367 96 l0 5 l-105 -12 l0 -5" />
    </SvgGroup>
);

interface PitchTrimProps extends ComponentPositionProps {
    fcdcDiscreteWord2: Arinc429Word,
}
const PitchTrim = ({ x, y, fcdcDiscreteWord2 }: PitchTrimProps) => {
    const fcdc1ThsPosition = useArinc429Var('L:A32NX_FCDC_1_ELEVATOR_TRIM_POS');
    const fcdc2ThsPosition = useArinc429Var('L:A32NX_FCDC_2_ELEVATOR_TRIM_POS');
    const thsPositionToUse = !fcdc1ThsPosition.isFailureWarning() ? fcdc1ThsPosition : fcdc2ThsPosition;

    let pitchIntegral: string;
    let pitchFractional: string;
    if (thsPositionToUse.isNormalOperation()) {
        [pitchIntegral, pitchFractional] = Math.abs(thsPositionToUse.value).toFixed(1).split('.');
    } else {
        pitchIntegral = 'XX';
        pitchFractional = 'X';
    }

    const hydraulics = useHydraulics();
    const hydraulicAvailableClass = (hydraulics.G.available || hydraulics.Y.available) && thsPositionToUse.isNormalOperation() ? 'Value' : 'Warning';

    const thsJam = fcdcDiscreteWord2.getBitValueOr(27, false);

    return (
        <SvgGroup x={x} y={y}>
            {/* Should be amber if there is a THS jam */}
            <text x={0} y={13} className={`Medium ${thsJam ? 'Warning' : 'ValueWhite'}`} textAnchor="middle" alignmentBaseline="central">PITCH TRIM</text>
            <text x={1} y={35} className={`${hydraulicAvailableClass} Standard`} textAnchor="end" alignmentBaseline="central">{pitchIntegral}</text>
            <text x={5} y={35} className={`${hydraulicAvailableClass} Standard`} textAnchor="middle" alignmentBaseline="central">.</text>
            <text x={14} y={37} className={`${hydraulicAvailableClass} Small`} textAnchor="middle" alignmentBaseline="central">{pitchFractional}</text>
            <text x={28} y={35} className="ValueCyan Standard" textAnchor="middle" alignmentBaseline="central">°</text>
            <text
                x={48}
                y={37}
                visibility={Math.abs(thsPositionToUse.valueOr(0)) > 0.05 ? 'visible' : 'hidden'}
                className={`${hydraulicAvailableClass} Small`}
                textAnchor="middle"
                alignmentBaseline="central"
            >
                {Math.sign(thsPositionToUse.valueOr(0)) === 1 ? 'DN' : 'UP'}
            </text>

            <HydraulicIndicator x={80} y={0} type="G" />
            <HydraulicIndicator x={102} y={0} type="Y" />
        </SvgGroup>
    );
};

const Rudder = ({ x, y }: ComponentPositionProps) => {
    const [rudderDeflectionState] = useSimVar('L:A32NX_HYD_RUDDER_DEFLECTION', 'Percent', 50);
    const rudderAngle = -rudderDeflectionState * 25 / 100;

    const hydraulics = useHydraulics();
    const hydraulicAvailableClass = hydraulics.G.available || hydraulics.B.available || hydraulics.Y.available ? 'GreenShape' : 'WarningShape';

    return (
        <SvgGroup x={x} y={y}>
            <Note x={50} y={0}>RUD</Note>

            <HydraulicIndicator x={19} y={17} type="G" />
            <HydraulicIndicator x={41} y={17} type="B" />
            <HydraulicIndicator x={63} y={17} type="Y" />

            <RudderTravelLimit />

            <path id="rudderPath" className="MainShape" d="M100 113 A 100 100 0 0 1 0 113" />
            <path id="rudderCenter" className="MainShape" d="m47 128 v 4 h 6 v-4" />
            <path id="rudderRightBorder" className="MainShape" d="m94 118 1 4 -7 3 -2 -4" />
            <path id="rudderLeftBorder" className="MainShape" d="m6 118 -1 4 7 3 2 -4" />

            <g id="rudderCursor" transform={`rotate(${rudderAngle} 50 24)`}>
                <path id="rudderCircle" className={hydraulicAvailableClass} d="M 42 78 A 8 8 0 0 1 58 78" />
                <path id="rudderTail" className={hydraulicAvailableClass} d="M42,78 l8,48 l8,-48" />
            </g>

            <RudderTrim />
        </SvgGroup>
    );
};

const RudderTrim = () => {
    // Should use data from FAC through FWC, but since that is not implemented yet it is read directly

    const fac1DiscreteWord2 = useArinc429Var('L:A32NX_FAC_1_DISCRETE_WORD_2');
    const fac2DiscreteWord2 = useArinc429Var('L:A32NX_FAC_2_DISCRETE_WORD_2');

    const anyTrimEngaged = fac1DiscreteWord2.getBitValueOr(13, false) || fac1DiscreteWord2.getBitValueOr(14, false)
    || fac2DiscreteWord2.getBitValueOr(13, false) || fac2DiscreteWord2.getBitValueOr(14, false);

    const facSourceForTrim = fac2DiscreteWord2.getBitValueOr(13, false) ? 2 : 1;
    const trimPosWord = useArinc429Var(`L:A32NX_FAC_${facSourceForTrim}_RUDDER_TRIM_POS`);

    return (
        <>
            <g id="rudderTrimCursor" transform={`rotate(${trimPosWord.value} 50 24)`} visibility={trimPosWord.isNormalOperation() ? 'visible' : 'hidden'}>
                <path className={anyTrimEngaged ? 'RudderTrim' : 'RudderTrimWarning'} d="m50 134 v 8" />
            </g>
            <text
                id="rudderTrimFailedFlag"
                className="Warning Medium"
                textAnchor="middle"
                visibility={trimPosWord.isNormalOperation() ? 'hidden' : 'visible'}
                x="50"
                y="150"
            >
                XX
            </text>
        </>
    );
};

const RudderTravelLimit = () => {
    const fac1DiscreteWord2 = useArinc429Var('L:A32NX_FAC_1_DISCRETE_WORD_2');
    const fac2DiscreteWord2 = useArinc429Var('L:A32NX_FAC_2_DISCRETE_WORD_2');

    const anyTluEngaged = fac1DiscreteWord2.getBitValueOr(15, false) || fac1DiscreteWord2.getBitValueOr(16, false)
    || fac2DiscreteWord2.getBitValueOr(15, false) || fac2DiscreteWord2.getBitValueOr(16, false);

    const facSourceForTlu = fac2DiscreteWord2.getBitValueOr(15, false) ? 2 : 1;
    const rtluPosWord = useArinc429Var(`L:A32NX_FAC_${facSourceForTlu}_RUDDER_TRAVEL_LIMIT_COMMAND`);
    const rtluDisplayAngle = rtluPosWord.value + 2;

    return (
        <>
            <g visibility={rtluPosWord.isNormalOperation() ? 'visible' : 'hidden'}>
                <g id="rudderLeftMaxAngle" transform={`rotate(${rtluDisplayAngle} 50 29)`}>
                    <path className={anyTluEngaged ? 'GreenShape' : 'WarningShape'} d="m50 127 0 14 4.5 0" />
                </g>

                <g id="rudderRightMaxAngle" transform={`rotate(${-rtluDisplayAngle} 50 29)`}>
                    <path className={anyTluEngaged ? 'GreenShape' : 'WarningShape'} d="m50 127 0 14 -4.5 0" />
                </g>
            </g>
            <g visibility={rtluPosWord.isNormalOperation() ? 'hidden' : 'visible'} className="Warning Medium" textAnchor="middle">
                <text x="-10" y="150">TLU</text>
                <text x="110" y="150">TLU</text>
            </g>
        </>
    );
};

const Stabilizer = ({ x, y }: ComponentPositionProps) => (
    <SvgGroup x={x} y={y}>
        <path id="stabLeft" className="MainShape" d="M0 0 l-55,4 l0,-18 l30,-15" />
        <path id="stabRight" className="MainShape" d="M64 0 l55,4 l0,-18 l-30,-15" />
    </SvgGroup>
);

interface AileronElevatorProps {
    fcdcDiscreteWord2: Arinc429Word,
    fcdcDiscreteWord3: Arinc429Word,
}
const Aileron = ({
    x,
    y,
    side,
    leftHydraulicSystem,
    rightHydraulicSystem,
    fcdcDiscreteWord2,
    fcdcDiscreteWord3,
}: ComponentPositionProps & ComponentSidePositionProps & HydraulicSystemPairProps & AileronElevatorProps) => {
    const titleTextPositionX = side === 'left' ? -40 : 40;

    const fcdc1AileronDeflection = useArinc429Var(`L:A32NX_FCDC_1_AILERON_${side.toUpperCase()}_POS`);
    const fcdc2AileronDeflection = useArinc429Var(`L:A32NX_FCDC_2_AILERON_${side.toUpperCase()}_POS`);
    const aileronDeflection = !fcdc1AileronDeflection.isFailureWarning() ? fcdc1AileronDeflection : fcdc2AileronDeflection;

    const aileronDeflectPctNormalized = aileronDeflection.valueOr(0) * 54 / 25;
    const cursorPath = `M${side === 'left' ? 1 : -1} ${side === 'left' ? 51
        : 51} l${side === 'right' ? '-' : ''}15 -7 l0 14Z`;
    const servcontrol1Avail = fcdcDiscreteWord3.getBitValue(side === 'left' ? 11 : 13);
    const servcontrol2Avail = fcdcDiscreteWord3.getBitValue(side === 'left' ? 12 : 14);
    const cursorClassName = servcontrol1Avail || servcontrol2Avail ? 'GreenShape' : 'WarningShape';
    const aileronPositionValid = aileronDeflection.isNormalOperation();

    const servcontrol1Fault = fcdcDiscreteWord2.getBitValueOr(side === 'left' ? 11 : 13, false);
    const servcontrol2Fault = fcdcDiscreteWord2.getBitValueOr(side === 'left' ? 12 : 14, false);

    return (
        <SvgGroup x={x} y={y}>
            <Note x={titleTextPositionX} y={0}>{side === 'left' ? 'L' : 'R'}</Note>
            <Note x={titleTextPositionX} y={22}>AIL</Note>
            <SvgGroup x={0} y={aileronDeflectPctNormalized}>
                <path className={cursorClassName} visibility={aileronPositionValid ? 'visible' : 'hidden'} d={cursorPath} />
            </SvgGroup>
            <text
                x={side === 'left' ? 20 : -20}
                y={56}
                visibility={!aileronPositionValid ? 'visible' : 'hidden'}
                className="ValueWarning Standard"
                textAnchor="middle"
            >
                XX
            </text>

            <AileronAxis side={side} x={0} y={11} />

            <HydraulicIndicator x={side === 'left' ? 22 : -62} y={93} type={leftHydraulicSystem} />
            <ServoControlIndicator x={side === 'left' ? 22 : -62} y={93} servoFailed={servcontrol1Fault} />
            <HydraulicIndicator x={side === 'left' ? 44 : -40} y={93} type={rightHydraulicSystem} />
            <ServoControlIndicator x={side === 'left' ? 44 : -40} y={93} servoFailed={servcontrol2Fault} />
        </SvgGroup>
    );
};

interface ElacSecProps extends ComponentPositionProps {
    num: number,
    fcdcDiscreteWord1: Arinc429Word,
}

const Elac = ({ x, y, num, fcdcDiscreteWord1 }: ElacSecProps) => {
    const infoAvailable = !fcdcDiscreteWord1.isFailureWarning();
    const computerFailed = fcdcDiscreteWord1.getBitValueOr(22 + num, false);
    return <ElacSecShape x={x} y={y} num={num} infoAvailable={infoAvailable} computerFailed={computerFailed} />;
};

const Sec = ({ x, y, num, fcdcDiscreteWord1 }: ElacSecProps) => {
    const infoAvailable = !fcdcDiscreteWord1.isFailureWarning();
    const computerFailed = fcdcDiscreteWord1.getBitValueOr(num === 3 ? 29 : 24 + num, false);

    return <ElacSecShape x={x} y={y} num={num} infoAvailable={infoAvailable} computerFailed={computerFailed} />;
};

interface ElacSecShapeProps {
    x: number,
    y: number,
    num: number,
    infoAvailable: boolean,
    computerFailed: boolean,
}

const ElacSecShape = ({ x, y, num, infoAvailable, computerFailed }: ElacSecShapeProps) => (
    <SvgGroup x={x} y={y}>
        <path className={!computerFailed || !infoAvailable ? 'MainShape' : 'MainShapeWarning'} d="M0 0 l72,0 l0,-26 l-8,0" />
        <text x={61} y={-12} className={`Standard ${!computerFailed && infoAvailable ? 'Value' : 'Warning'}`} textAnchor="middle" alignmentBaseline="central">
            {infoAvailable ? num : 'X'}
        </text>
    </SvgGroup>
);

const AileronAxis = ({ x, y, side }: ComponentPositionProps & ComponentSidePositionProps) => {
    const d1 = `M0 0 l${
        side === 'left' ? '-' : ''}8 0 l0 -20 l${
        side === 'right' ? '-' : ''}8 0 l0 120 l${side === 'left' ? '-' : ''}8 0 l0 -10 l${side === 'right' ? '-' : ''}8 0`;
    const d2 = `M0 36 l${side === 'left' ? '-' : ''}7 0`;
    const d3 = `M0 41 l${side === 'left' ? '-' : ''}7 0`;
    const d4 = `M0 46 l${side === 'left' ? '-' : ''}8 0 l0 6 l${side === 'right' ? '-' : ''}8 0`;

    return (
        <SvgGroup x={x} y={y}>
            <path className="MainShape" d={d1} />
            <path className="MainShape" d={d2} />
            <path className="MainShape" d={d3} />
            <path className="MainShape" d={d4} />
        </SvgGroup>
    );
};

const Elevator = ({
    x,
    y,
    side,
    leftHydraulicSystem,
    rightHydraulicSystem,
    fcdcDiscreteWord2,
    fcdcDiscreteWord3,
}: ComponentPositionProps & ComponentSidePositionProps & HydraulicSystemPairProps & AileronElevatorProps) => {
    const textPositionX = side === 'left' ? -42 : 42;
    const textLetter = side === 'left' ? 'L' : 'R';

    const fcdc1ElevatorDeflection = useArinc429Var(`L:A32NX_FCDC_1_ELEVATOR_${side.toUpperCase()}_POS`);
    const fcdc2ElevatorDeflection = useArinc429Var(`L:A32NX_FCDC_2_ELEVATOR_${side.toUpperCase()}_POS`);
    const elevatorDeflection = !fcdc1ElevatorDeflection.isFailureWarning() ? fcdc1ElevatorDeflection : fcdc2ElevatorDeflection;
    const elevatorPositionValid = elevatorDeflection.isNormalOperation();

    const elevatorDeflectPctNormalized = elevatorDeflection.value * 70 / 30;
    const cursorPath = `M${side === 'left' ? 1 : -1},70 l${side === 'right' ? '-' : ''}15,-7 l0,14Z`;
    const servcontrolLeftAvail = fcdcDiscreteWord3.getBitValue(side === 'left' ? 15 : 18);
    const servcontrolRightAvail = fcdcDiscreteWord3.getBitValue(side === 'left' ? 16 : 17);
    const cursorClassName = servcontrolLeftAvail || servcontrolRightAvail ? 'GreenShape' : 'WarningShape';

    const servcontrolLeftFault = fcdcDiscreteWord2.getBitValueOr(side === 'left' ? 15 : 18, false);
    const servcontrolRightFault = fcdcDiscreteWord2.getBitValueOr(side === 'left' ? 16 : 17, false);

    return (
        <SvgGroup x={x} y={y}>
            <Note x={textPositionX} y={0}>{textLetter}</Note>
            <Note x={textPositionX} y={22}>ELEV</Note>

            <SvgGroup x={0} y={elevatorDeflectPctNormalized}>
                <path visibility={elevatorPositionValid ? 'visible' : 'hidden'} className={cursorClassName} d={cursorPath} />
            </SvgGroup>
            <text
                x={side === 'left' ? 20 : -20}
                y={76}
                visibility={!elevatorPositionValid ? 'visible' : 'hidden'}
                className="ValueWarning Standard"
                textAnchor="middle"
            >
                XX
            </text>

            <ElevatorAxis side={side} x={0} y={5} />

            <HydraulicIndicator x={side === 'left' ? -60 : 18} y={79} type={leftHydraulicSystem} />
            <ServoControlIndicator x={side === 'left' ? -60 : 18} y={79} servoFailed={servcontrolLeftFault} />
            <HydraulicIndicator x={side === 'left' ? -38 : 40} y={79} type={rightHydraulicSystem} />
            <ServoControlIndicator x={side === 'left' ? -38 : 40} y={79} servoFailed={servcontrolRightFault} />
        </SvgGroup>
    );
};

const ElevatorAxis = ({ x, y, side }: ComponentPositionProps & ComponentSidePositionProps) => {
    const d1 = `M0 0 l${
        side === 'left' ? '-' : ''}8 0 l0 -10 l${
        side === 'right' ? '-' : ''}8 0 l0 116 l${side === 'left' ? '-' : ''}8 0 l0 -10 l${side === 'right' ? '-' : ''}8 0`;
    const d2 = `M0 62 l${side === 'left' ? '-' : ''}7 0 l0 5 l${side === 'right' ? '-' : ''}7 0`;

    return (
        <SvgGroup x={x} y={y}>
            <path className="MainShape" d={d1} />
            <path className="MainShape" d={d2} />
        </SvgGroup>
    );
};

interface ServoControlIndicatorProps extends ComponentPositionProps {
    servoFailed: boolean,
}
const ServoControlIndicator = ({ x, y, servoFailed }: ServoControlIndicatorProps) => (
    <SvgGroup x={x} y={y}>
        <path visibility={servoFailed ? 'visible' : 'hidden'} className="WarningShape" d="m 0 27 l 17 0 l 0 -30 l -17 0" />
    </SvgGroup>
);

const Note: React.FunctionComponent<ComponentPositionProps> = ({ x, y, children }) => (
    <text x={x} y={y} className="Note" textAnchor="middle" alignmentBaseline="central">{children}</text>
);

render(<FctlPage />);
