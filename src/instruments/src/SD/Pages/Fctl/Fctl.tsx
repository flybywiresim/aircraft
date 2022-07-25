import React from 'react';
import { render } from '@instruments/common/index';
import { setIsEcamPage } from '../../../Common/defaults';
import { useSimVar } from '../../../Common/simVars';
import { SvgGroup } from '../../Common/SvgGroup';
import { HydraulicsProvider, useHydraulics } from '../../Common/HydraulicsProvider';
import { ComponentPositionProps } from '../../Common/ComponentPositionProps';
import { HydraulicSystem } from '../../Common/HydraulicSystem';
import { HydraulicIndicator } from '../../Common/HydraulicIndicator';
import { ComponentSidePositionProps } from '../../Common/ComponentSidePositionProps';
import { Spoilers } from '../../Common/Spoilers';

import '../../Common/CommonStyles.scss';

setIsEcamPage('fctl_page');

interface HydraulicSystemPairProps {
    leftHydraulicSystem: HydraulicSystem,
    rightHydraulicSystem: HydraulicSystem,
}

export const FctlPage = () => (
    <svg id="ecam-fctl" className="ecam-common-styles" viewBox="0 0 768 768" style={{ marginTop: '-60px' }} xmlns="http://www.w3.org/2000/svg">
        <text className="Title UnderlineWhite" x={8} y={33}>F/CTL</text>

        <HydraulicsProvider>
            <Wings x={124} y={11} />

            <Aileron x={88} y={197} side="left" leftHydraulicSystem="B" rightHydraulicSystem="G" />
            <Aileron x={678} y={197} side="right" leftHydraulicSystem="G" rightHydraulicSystem="B" />

            <text className="Center Standard" x={248} y={226}>ELAC</text>
            <Elac x={215} y={234} number={1} />
            <Elac x={245} y={252} number={2} />

            <text className="Center Standard" x={430} y={226}>SEC</text>
            <Sec x={395} y={234} number={1} />
            <Sec x={425} y={252} number={2} />
            <Sec x={455} y={270} number={3} />

            <Elevator x={212} y={424} side="left" leftHydraulicSystem="B" rightHydraulicSystem="G" />
            <Elevator x={555} y={424} side="right" leftHydraulicSystem="Y" rightHydraulicSystem="B" />

            <PitchTrim x={356} y={350} />

            <Stabilizer x={341} y={446} />

            <Rudder x={384} y={454} />
        </HydraulicsProvider>
    </svg>
);

const Wings = ({ x = 0, y = 0 }: ComponentPositionProps) => (
    <SvgGroup x={x} y={y}>
        <text className="Large Center" x={262} y={125}>SPD BRK</text>

        <HydraulicIndicator x={225} y={0} type="G" />
        <HydraulicIndicator x={250} y={0} type="B" />
        <HydraulicIndicator x={275} y={0} type="Y" />

        <Spoilers x={9} y={89} />

        {/* Left spoiler wing shape */}
        <path className="LightGreyLine" d="M0 60 l0 -6 l182 -30 l0 6" />
        <path className="LightGreyLine" d="M49 119 l0 6 l135 -14 l0 -6" />

        {/* Right spoiler wing shape */}
        <path className="LightGreyLine" d="M519 60 l0 -6 l-182 -30 l0 6" />
        <path className="LightGreyLine" d="M470 119 l0 6 l-135 -14 l0 -6" />
    </SvgGroup>
);

const PitchTrim = ({ x, y }: ComponentPositionProps) => {
    const [rawPitchTrim] = useSimVar('ELEVATOR TRIM INDICATOR', 'Position 16k', 50);

    const adjustedPitchTrim = rawPitchTrim / 1213.6296;
    const [pitchIntegral, pitchFractional] = Math.abs(adjustedPitchTrim).toFixed(1).split('.');

    const hydraulics = useHydraulics();
    const hydraulicAvailableClass = hydraulics.G.available || hydraulics.Y.available ? 'Green' : 'Amber';

    return (
        <SvgGroup x={x} y={y}>
            <text className="Large Center" x={0} y={22}>PITCH TRIM</text>
            <text x={-1} y={53} className={`${hydraulicAvailableClass} Huge End`}>{pitchIntegral}</text>
            <text x={4} y={53} className={`${hydraulicAvailableClass} Huge Center`}>.</text>
            <text x={21} y={53} className={`${hydraulicAvailableClass} Standard Center`}>{pitchFractional}</text>
            <text x={41} y={56} className="Cyan Title Center">°</text>
            <text
                x={74}
                y={52}
                visibility={Math.abs(adjustedPitchTrim) > 0.05 ? 'visible' : 'hidden'}
                className={`${hydraulicAvailableClass} Standard Center`}
            >
                {Math.sign(adjustedPitchTrim) === -1 ? 'DN' : 'UP'}
            </text>

            <HydraulicIndicator x={102} y={0} type="G" />
            <HydraulicIndicator x={128} y={0} type="Y" />
        </SvgGroup>
    );
};

const Rudder = ({ x, y }: ComponentPositionProps) => {
    const [rudderDeflectionState] = useSimVar('L:A32NX_HYD_RUDDER_DEFLECTION', 'Percent', 50);
    const rudderAngle = -rudderDeflectionState * 25 / 100;

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
    const rudderTrimAngle = -rudderTrimState * 20;

    const hydraulics = useHydraulics();
    const hydraulicAvailableClass = hydraulics.G.available || hydraulics.B.available || hydraulics.Y.available ? 'GreenLine' : 'AmberLine';

    return (
        <SvgGroup x={x} y={y}>
            <text className="Large Center" x={-1} y={0}>RUD</text>

            <HydraulicIndicator x={-38} y={14} type="G" />
            <HydraulicIndicator x={-13} y={14} type="B" />
            <HydraulicIndicator x={12} y={14} type="Y" />

            <path id="rudderPath" className="WhiteLine" d="M66 131 A 122 122 0 0 1 -66 131" />
            <path id="rudderCenter" className="WhiteLine" d="m-3 151 v 6 h 5 v-6" />

            <path id="rudderLeftBorder" className="WhiteLine" transform="rotate(25 0 26)" d="m-4.5 151 v 6 h 9 v-6" />
            <path id="rudderRightBorder" className="WhiteLine" transform="rotate(-25 0 26)" d="m-4.5 151 v 6 h 9 v-6" />

            <g id="rudderLeftMaxAngle" transform={`rotate(${26.4 * maxAngleNorm} 0 26)`}>
                <path className="GreenLine" d="m0 151 l 0 21 l 7 0" />
            </g>

            <g id="rudderRightMaxAngle" transform={`rotate(${-26.4 * maxAngleNorm} 0 26)`}>
                <path className="GreenLine" d="m0 151 l 0 21 l -7 0" />
            </g>

            <g id="rudderCursor" transform={`rotate(${rudderAngle} 0 26)`}>
                <path id="rudderCircle" className={hydraulicAvailableClass} d="M -9 93 A 9 9 0 0 1 9 93" />
                <path id="rudderTail" className={hydraulicAvailableClass} d="M-9 93 l9 57 l9,-57" />
            </g>

            <g id="rudderTrimCursor" transform={`rotate(${rudderTrimAngle} 0 26)`}>
                <path className="ThickCyanLine" d="m0 159 v 11" />
            </g>
        </SvgGroup>
    );
};

const Stabilizer = ({ x, y }: ComponentPositionProps) => (
    <SvgGroup x={x} y={y}>
        <path id="stabLeft" className="LightGreyLine" d="M0 0 l-72,9 l0,-28 l38,-19" />
        <path id="stabRight" className="LightGreyLine" d="M85 0 l72,9 l0,-28 l-38,-19" />
    </SvgGroup>
);

const Aileron = ({ x, y, side, leftHydraulicSystem, rightHydraulicSystem }: ComponentPositionProps & ComponentSidePositionProps & HydraulicSystemPairProps) => {
    const textPositionX = side === 'left' ? -53 : 54;

    const [aileronDeflection] = useSimVar(`L:A32NX_HYD_AILERON_${side.toUpperCase()}_DEFLECTION`, 'number', 50);
    const aileronDeflectPctNormalized = aileronDeflection * 68.5;
    const cursorPath = `M0 ${side === 'left' ? 57 + aileronDeflectPctNormalized
        : 57 - aileronDeflectPctNormalized} l${side === 'right' ? '-' : ''}15 -9 l0 18Z`;

    const hydraulics = useHydraulics();

    return (
        <SvgGroup x={x} y={y}>
            <text className="Huge Center" x={textPositionX} y={0}>{side === 'left' ? 'L' : 'R'}</text>
            <text className="Large Center" x={textPositionX} y={26}>AIL</text>

            <AileronAxis side={side} x={0} y={8} />

            <path className={hydraulics[leftHydraulicSystem].available || hydraulics[rightHydraulicSystem].available ? 'GreenLine' : 'AmberLine'} d={cursorPath} />

            <HydraulicIndicator x={side === 'left' ? 27 : -75} y={96} type={leftHydraulicSystem} />
            <HydraulicIndicator x={side === 'left' ? 52 : -50} y={96} type={rightHydraulicSystem} />
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
    const [on] = useSimVar(`L:A32NX_FBW_${type}_SWITCH:${number}`, 'boolean', 1000);
    const [failed] = useSimVar(`L:A32NX_FBW_${type}_FAILED:${number}`, 'boolean', 1000);

    return (
        <SvgGroup x={x} y={y}>
            <path className={on && !failed ? 'LightGreyLine' : 'AmberLine'} d="M0 0 l97,0 l0,-33 l-10,0" />
            <text x={84} y={-7} className={`Large Center ${on && !failed ? 'Green' : 'Amber'}`}>
                {number}
            </text>
        </SvgGroup>
    );
};

const AileronAxis = ({ x, y, side }: ComponentPositionProps & ComponentSidePositionProps) => {
    const d1 = `M0 0 l${
        side === 'left' ? '-' : ''}6 0 l0 -25 l${
        side === 'right' ? '-' : ''}6 0 l0 147 l${side === 'left' ? '-' : ''}6 0 l0 -10 l${side === 'right' ? '-' : ''}6 0`;
    const d2 = `M0 46 l${side === 'left' ? '-' : ''}6 0`;
    const d3 = `M0 52 l${side === 'left' ? '-' : ''}6 0`;
    const d4 = `M0 59 l${side === 'left' ? '-' : ''}6 0 l0 6 l${side === 'right' ? '-' : ''}6 0`;

    return (
        <SvgGroup x={x} y={y}>
            <path className="WhiteLine" d={d1} />
            <path className="WhiteLine" d={d2} />
            <path className="WhiteLine" d={d3} />
            <path className="WhiteLine" d={d4} />
        </SvgGroup>
    );
};

const Elevator = ({ x, y, side, leftHydraulicSystem, rightHydraulicSystem }: ComponentPositionProps & ComponentSidePositionProps & HydraulicSystemPairProps) => {
    const textPositionX = side === 'left' ? -59 : 62;
    const textLetter = side === 'left' ? 'L' : 'R';

    const [elevatorDeflection] = useSimVar(`L:A32NX_HYD_ELEVATOR_${side.toUpperCase()}_DEFLECTION`, 'percent over 100', 50);
    const elevatorDeflectPctNormalized = elevatorDeflection * (elevatorDeflection > 0 ? 1 * 91 : 16 / 11.5 * 45);
    const cursorPath = `M0,${77 - elevatorDeflectPctNormalized} l${side === 'right' ? '-' : ''}15,-9 l0,18Z`;

    const hydraulics = useHydraulics();

    return (
        <SvgGroup x={x} y={y}>
            <text className="Huge Center" x={textPositionX} y={0}>{textLetter}</text>
            <text className="Large Center" x={textPositionX} y={27}>ELEV</text>

            <ElevatorAxis side={side} x={0} y={5} />

            <path
                id={`${side}ElevatorCursor`}
                className={hydraulics[leftHydraulicSystem].available || hydraulics[rightHydraulicSystem].available ? 'GreenLine' : 'AmberLine'}
                d={cursorPath}
            />

            <HydraulicIndicator x={side === 'left' ? -78 : 28} y={91} type={leftHydraulicSystem} />
            <HydraulicIndicator x={side === 'left' ? -53 : 53} y={91} type={rightHydraulicSystem} />
        </SvgGroup>
    );
};

const ElevatorAxis = ({ x, y, side }: ComponentPositionProps & ComponentSidePositionProps) => {
    const d1 = `M0 -13 l${
        side === 'left' ? '-' : ''}6 0 l0 -12 l${
        side === 'right' ? '-' : ''}6 0 l0 148 l${side === 'left' ? '-' : ''}6 0 l0 -12 l${side === 'right' ? '-' : ''}6 0`;
    const d2 = `M0 69 l${side === 'left' ? '-' : ''}6 0 l0 6 l${side === 'right' ? '-' : ''}6 0`;

    return (
        <SvgGroup x={x} y={y}>
            <path className="WhiteLine" d={d1} />
            <path className="WhiteLine" d={d2} />
        </SvgGroup>
    );
};

render(<FctlPage />);
