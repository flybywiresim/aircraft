import ReactDOM from 'react-dom';
import React from 'react';
import { SimVarProvider, useSimVar } from '@instruments/common/simVars';
import { getRenderTarget, setIsEcamPage } from '../../../Common/defaults';

import './Fctl.scss';
import { PageTitle } from '../../Common/PageTitle';
import { EcamPage } from '../../Common/EcamPage';
import { SvgGroup } from '../../Common/SvgGroup';
import { HydraulicsProvider, useHydraulics } from '../../Common/HydraulicsProvider';
import { ComponentPositionProps } from '../../Common/ComponentPositionProps';
import { HydraulicSystem } from '../../Common/HydraulicSystem';
import { HydraulicIndicator } from '../../Common/HydraulicIndicator';
import { ComponentSidePositionProps } from '../../Common/ComponentSidePositionProps';
import { Spoilers } from '../../Common/Spoilers';

setIsEcamPage('fctl_page');

interface HydraulicSystemPairProps {
    leftHydraulicSystem: HydraulicSystem,
    rightHydraulicSystem: HydraulicSystem,
}

export const FctlPage = () => (
    <EcamPage name="ecam-fctl">
        <PageTitle x={6} y={18} text="F/CTL" />

        <HydraulicsProvider>
            <Wings x={98} y={14} />

            <Aileron x={72} y={153} side="left" leftHydraulicSystem="B" rightHydraulicSystem="G" />
            <Aileron x={528} y={153} side="right" leftHydraulicSystem="G" rightHydraulicSystem="B" />

            <Note x={195} y={178}>ELAC</Note>
            <Elac x={170} y={190} number={1} />
            <Elac x={194} y={206} number={2} />

            <Note x={350} y={178}>SEC</Note>
            <Sec x={324} y={190} number={1} />
            <Sec x={348} y={206} number={2} />
            <Sec x={372} y={222} number={3} />

            <Elevator x={168} y={328} side="left" leftHydraulicSystem="B" rightHydraulicSystem="G" />
            <Elevator x={432} y={328} side="right" leftHydraulicSystem="Y" rightHydraulicSystem="B" />

            <PitchTrim x={280} y={283} />

            <Stabilizer x={268} y={357} />

            <Rudder x={250} y={356} />
        </HydraulicsProvider>
    </EcamPage>
);

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

const PitchTrim = ({ x, y }: ComponentPositionProps) => {
    const [rawPitchTrim] = useSimVar('ELEVATOR TRIM INDICATOR', 'position', 50);

    const adjustedPitchTrim = rawPitchTrim / 1213.6296;
    const [pitchIntegral, pitchFractional] = Math.abs(adjustedPitchTrim).toFixed(1).split('.');

    const hydraulics = useHydraulics();
    const hydraulicAvailableClass = hydraulics.G.available || hydraulics.Y.available ? 'Value' : 'Warning';

    return (
        <SvgGroup x={x} y={y}>
            <Note x={0} y={13}>PITCH TRIM</Note>
            <text x={1} y={35} className={`${hydraulicAvailableClass} Standard`} textAnchor="end" alignmentBaseline="central">{pitchIntegral}</text>
            <text x={5} y={35} className={`${hydraulicAvailableClass} Standard`} textAnchor="middle" alignmentBaseline="central">.</text>
            <text x={14} y={37} className={`${hydraulicAvailableClass} Small`} textAnchor="middle" alignmentBaseline="central">{pitchFractional}</text>
            <text x={28} y={35} className="ValueCyan Standard" textAnchor="middle" alignmentBaseline="central">°</text>
            <text
                x={48}
                y={37}
                visibility={Math.abs(adjustedPitchTrim) > 0.05 ? 'visible' : 'hidden'}
                className={`${hydraulicAvailableClass} Small`}
                textAnchor="middle"
                alignmentBaseline="central"
            >
                {Math.sign(adjustedPitchTrim) === -1 ? 'DN' : 'UP'}
            </text>

            <HydraulicIndicator x={80} y={0} type="G" />
            <HydraulicIndicator x={102} y={0} type="Y" />
        </SvgGroup>
    );
};

const Rudder = ({ x, y }: ComponentPositionProps) => {
    const [rudderDeflectionState] = useSimVar('RUDDER DEFLECTION PCT', 'percent over 100', 50);
    const rudderAngle = -rudderDeflectionState * 25;

    // Rudder limits
    const [indicatedAirspeedState] = useSimVar('AIRSPEED INDICATED', 'knots', 500);
    let maxAngleNorm = 1;
    if (indicatedAirspeedState > 380) {
        maxAngleNorm = 3.4 / 25;
    } else if (indicatedAirspeedState > 160) {
        maxAngleNorm = (69.2667 - 0.351818 * indicatedAirspeedState
            + 0.00047 * indicatedAirspeedState ** 2) / 25;
    }

    // Rudder trim
    const [rudderTrimState] = useSimVar('RUDDER TRIM PCT', 'percent over 100', 500);
    const rudderTrimAngle = -rudderTrimState * 25;

    const hydraulics = useHydraulics();
    const hydraulicAvailableClass = hydraulics.G.available || hydraulics.B.available || hydraulics.Y.available ? 'GreenShape' : 'WarningShape';

    return (
        <SvgGroup x={x} y={y}>
            <Note x={50} y={0}>RUD</Note>

            <HydraulicIndicator x={19} y={17} type="G" />
            <HydraulicIndicator x={41} y={17} type="B" />
            <HydraulicIndicator x={63} y={17} type="Y" />

            <path id="rudderPath" className="MainShape" d="M100 113 A 100 100 0 0 1 0 113" />
            <path id="rudderCenter" className="MainShape" d="m47 128 v 4 h 6 v-4" />
            <path id="rudderRightBorder" className="MainShape" d="m94 118 1 4 -7 3 -2 -4" />
            <path id="rudderLeftBorder" className="MainShape" d="m6 118 -1 4 7 3 2 -4" />

            <g id="rudderLeftMaxAngle" transform={`rotate(${-26.4 * (1 - maxAngleNorm)} 50 29)`}>
                <path className="GreenShape" d="m5 117 -6 13 4 2" />
            </g>

            <g id="rudderRightMaxAngle" transform={`rotate(${26.4 * (1 - maxAngleNorm)} 50 29)`}>
                <path className="GreenShape" d="m95 117 6 13 -4 2" />
            </g>

            <g id="rudderCursor" transform={`rotate(${rudderAngle} 50 24)`}>
                <path id="rudderCircle" className={hydraulicAvailableClass} d="M 42 78 A 8 8 0 0 1 58 78" />
                <path id="rudderTail" className={hydraulicAvailableClass} d="M42,78 l8,48 l8,-48" />
            </g>

            <g id="rudderTrimCursor" transform={`rotate(${rudderTrimAngle} 50 24)`}>
                <path className="RudderTrim" d="m50 134 v 8" />
            </g>
        </SvgGroup>
    );
};

const Stabilizer = ({ x, y }: ComponentPositionProps) => (
    <SvgGroup x={x} y={y}>
        <path id="stabLeft" className="MainShape" d="M0 0 l-55,4 l0,-18 l30,-15" />
        <path id="stabRight" className="MainShape" d="M64 0 l55,4 l0,-18 l-30,-15" />
    </SvgGroup>
);

const Aileron = ({ x, y, side, leftHydraulicSystem, rightHydraulicSystem }: ComponentPositionProps & ComponentSidePositionProps & HydraulicSystemPairProps) => {
    const textPositionX = side === 'left' ? -40 : 40;

    const [aileronDeflection] = useSimVar(`L:A32NX_3D_AILERON_${side.toUpperCase()}_DEFLECTION`, 'number', 50);
    const aileronDeflectPctNormalized = aileronDeflection * 54;
    const cursorPath = `M${side === 'left' ? 1 : -1} ${side === 'left' ? 51 + aileronDeflectPctNormalized
        : 51 - aileronDeflectPctNormalized} l${side === 'right' ? '-' : ''}15 -7 l0 14Z`;

    const hydraulics = useHydraulics();

    return (
        <SvgGroup x={x} y={y}>
            <Note x={textPositionX} y={0}>{side === 'left' ? 'L' : 'R'}</Note>
            <Note x={textPositionX} y={22}>AIL</Note>

            <path className={hydraulics[leftHydraulicSystem].available || hydraulics[rightHydraulicSystem].available ? 'GreenShape' : 'WarningShape'} d={cursorPath} />

            <AileronAxis side={side} x={0} y={11} />

            <HydraulicIndicator x={side === 'left' ? 22 : -62} y={93} type={leftHydraulicSystem} />
            <HydraulicIndicator x={side === 'left' ? 44 : -40} y={93} type={rightHydraulicSystem} />
        </SvgGroup>
    );
};

interface ElacSecProps extends ComponentPositionProps {
    number: number,
}

const Elac = ({ x, y, number }: ElacSecProps) => (
    <ElacSecShape x={x} y={y} number={number} type="ELAC" />
);

const Sec = ({ x, y, number }: ElacSecProps) => (
    <ElacSecShape x={x} y={y} number={number} type="SEC" />
);

interface ElacSecShapeProps extends ElacSecProps {
    type: 'ELAC' | 'SEC',
}

const ElacSecShape = ({ x, y, number, type }: ElacSecShapeProps) => {
    const [on] = useSimVar(`L:A32NX_FBW_${type}_SWITCH:${number}`, 'Boolean', 1000);
    const [failed] = useSimVar(`L:A32NX_FBW_${type}_FAILED:${number}`, 'Boolean', 1000);

    return (
        <SvgGroup x={x} y={y}>
            <path className={on && !failed ? 'MainShape' : 'MainShapeWarning'} d="M0 0 l72,0 l0,-26 l-8,0" />
            <text x={61} y={-12} className={`Standard ${on && !failed ? 'Value' : 'Warning'}`} textAnchor="middle" alignmentBaseline="central">
                {number}
            </text>
        </SvgGroup>
    );
};

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

const Elevator = ({ x, y, side, leftHydraulicSystem, rightHydraulicSystem }: ComponentPositionProps & ComponentSidePositionProps & HydraulicSystemPairProps) => {
    const textPositionX = side === 'left' ? -42 : 42;
    const textLetter = side === 'left' ? 'L' : 'R';

    const [elevatorDeflection] = useSimVar('ELEVATOR DEFLECTION PCT', 'percent over 100', 50);
    const elevatorDeflectPctNormalized = elevatorDeflection * (elevatorDeflection > 0 ? 70 : 52);
    const cursorPath = `M${side === 'left' ? 1 : -1},${70 - elevatorDeflectPctNormalized} l${side === 'right' ? '-' : ''}15,-7 l0,14Z`;

    const hydraulics = useHydraulics();

    return (
        <SvgGroup x={x} y={y}>
            <Note x={textPositionX} y={0}>{textLetter}</Note>
            <Note x={textPositionX} y={22}>ELEV</Note>

            <path
                id={`${side}ElevatorCursor`}
                className={hydraulics[leftHydraulicSystem].available || hydraulics[rightHydraulicSystem].available ? 'GreenShape' : 'WarningShape'}
                d={cursorPath}
            />

            <ElevatorAxis side={side} x={0} y={5} />

            <HydraulicIndicator x={side === 'left' ? -60 : 18} y={79} type={leftHydraulicSystem} />
            <HydraulicIndicator x={side === 'left' ? -38 : 40} y={79} type={rightHydraulicSystem} />
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

const Note: React.FunctionComponent<ComponentPositionProps> = ({ x, y, children }) => (
    <text x={x} y={y} className="Note" textAnchor="middle" alignmentBaseline="central">{children}</text>
);

ReactDOM.render(<SimVarProvider><FctlPage /></SimVarProvider>, getRenderTarget());
