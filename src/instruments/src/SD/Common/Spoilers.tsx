import { useSimVar } from '@instruments/common/simVars';
import React from 'react';
import { ComponentPositionProps } from './ComponentPositionProps';
import { ComponentSidePositionProps } from './ComponentSidePositionProps';
import { useHydraulics } from './HydraulicsProvider';
import { HydraulicSystem } from './HydraulicSystem';
import { SvgGroup } from './SvgGroup';
import './Spoilers.scss';

export const Spoilers = ({ x, y }: ComponentPositionProps) => {
    const [aileronLeftDeflectionState] = useSimVar('L:A32NX_3D_AILERON_LEFT_DEFLECTION', 'number', 50);
    const [aileronRightDeflectionState] = useSimVar('L:A32NX_3D_AILERON_RIGHT_DEFLECTION', 'number', 50);

    const [leftSpoilerState] = useSimVar('SPOILERS LEFT POSITION', 'percent over 100', 50);
    const [rightSpoilerState] = useSimVar('SPOILERS RIGHT POSITION', 'percent over 100', 50);
    const [speedBrakeHandlePosition] = useSimVar('SPOILERS HANDLE POSITION', 'percent over 100', 100);

    const [spoilersArmed] = useSimVar('L:A32NX_SPOILERS_ARMED', 'Boolean', 500);

    const leftSpoilerUp = leftSpoilerState > 0.1;
    const leftAileronUp = aileronLeftDeflectionState < -0.5;
    const rightSpoilerUp = rightSpoilerState > 0.1;
    const rightAileronUp = aileronRightDeflectionState > 0.5;

    const speedBrakeUp = speedBrakeHandlePosition > 0.1;

    return (
        <SvgGroup x={x} y={y}>
            <Spoiler x={0} y={20} side="left" number={5} actuatedBy="G" upWhenActuated={(spoilersArmed && leftSpoilerUp) || leftAileronUp} />
            <Spoiler x={38} y={15} side="left" number={4} actuatedBy="Y" upWhenActuated={leftSpoilerUp || speedBrakeUp} />
            <Spoiler x={76} y={10} side="left" number={3} actuatedBy="B" upWhenActuated={leftSpoilerUp || speedBrakeUp} />
            <Spoiler x={114} y={5} side="left" number={2} actuatedBy="Y" upWhenActuated={leftSpoilerUp || speedBrakeUp} />
            <Spoiler x={152} y={0} side="left" number={1} actuatedBy="G" upWhenActuated={spoilersArmed && leftSpoilerUp} />

            <Spoiler x={242} y={0} side="right" number={1} actuatedBy="G" upWhenActuated={spoilersArmed && rightSpoilerUp} />
            <Spoiler x={280} y={5} side="right" number={2} actuatedBy="Y" upWhenActuated={rightSpoilerUp || speedBrakeUp} />
            <Spoiler x={318} y={10} side="right" number={3} actuatedBy="B" upWhenActuated={rightSpoilerUp || speedBrakeUp} />
            <Spoiler x={356} y={15} side="right" number={4} actuatedBy="Y" upWhenActuated={rightSpoilerUp || speedBrakeUp} />
            <Spoiler x={394} y={20} side="right" number={5} actuatedBy="G" upWhenActuated={(spoilersArmed && rightSpoilerUp) || rightAileronUp} />
        </SvgGroup>
    );
};

interface SpoilerProps extends ComponentPositionProps, ComponentSidePositionProps {
    number: number,
    actuatedBy: HydraulicSystem,
    upWhenActuated: boolean,
}
const Spoiler = ({ x, y, number, side, actuatedBy, upWhenActuated }: SpoilerProps) => {
    const hydraulics = useHydraulics();

    return (
        <SvgGroup x={x} y={y}>
            <path
                className={`Spoilers ${hydraulics[actuatedBy].available ? 'GreenShapeThick' : 'WarningShapeThick'}`}
                d={`M 0 0 l ${side === 'right' ? '-' : ''}15 0`}
            />
            <path
                visibility={upWhenActuated ? 'visible' : 'hidden'}
                className={`Spoilers ${hydraulics[actuatedBy].available ? 'GreenShape' : 'WarningShape'}`}
                d={`M ${side === 'left' ? 8 : -8} -22 l -6 0 l 6 -12 l 6 12 l -6 0`}
            />
            <path
                visibility={upWhenActuated && hydraulics[actuatedBy].available ? 'visible' : 'hidden'}
                className="Spoilers GreenShape"
                d={`M ${side === 'left' ? 8 : -8} 0 l 0 -22`}
            />
            <text
                x={side === 'left' ? 8 : -8}
                y={-11}
                visibility={hydraulics[actuatedBy].available ? 'hidden' : 'visible'}
                className="Spoilers Warning Standard"
                textAnchor="middle"
                alignmentBaseline="central"
            >
                {number}
            </text>
        </SvgGroup>
    );
};
