import { useSimVar } from '@instruments/common/simVars';
import React from 'react';
import { ComponentPositionProps } from './ComponentPositionProps';
import { ComponentSidePositionProps } from './ComponentSidePositionProps';
import { useHydraulics } from './HydraulicsProvider';
import { HydraulicSystem } from './HydraulicSystem';
import { SvgGroup } from './SvgGroup';

export const Spoilers = ({ x, y }: ComponentPositionProps) => {
    const [aileronLeftDeflectionState] = useSimVar('L:A32NX_HYD_AILERON_LEFT_DEFLECTION', 'number', 50);
    const [aileronRightDeflectionState] = useSimVar('L:A32NX_HYD_AILERON_RIGHT_DEFLECTION', 'number', 50);

    const [leftSpoilerState] = useSimVar('L:A32NX_HYD_SPOILERS_LEFT_DEFLECTION', 'number', 50);
    const [rightSpoilerState] = useSimVar('L:A32NX_HYD_SPOILERS_RIGHT_DEFLECTION', 'number', 50);
    const [speedBrakeHandlePosition] = useSimVar('SPOILERS HANDLE POSITION', 'percent over 100', 100);

    const [spoilersArmed] = useSimVar('L:A32NX_SPOILERS_ARMED', 'boolean', 500);

    const leftSpoilerUp = leftSpoilerState > 0.1;
    const leftAileronUp = aileronLeftDeflectionState < -0.5;
    const rightSpoilerUp = rightSpoilerState > 0.1;
    const rightAileronUp = aileronRightDeflectionState > 0.5;

    const speedBrakeUp = speedBrakeHandlePosition > 0.1;

    return (
        <SvgGroup x={x} y={y}>
            <Spoiler x={0} y={26} side="left" number={5} actuatedBy="G" upWhenActuated={(spoilersArmed && leftSpoilerUp) || leftAileronUp} />
            <Spoiler x={50} y={19} side="left" number={4} actuatedBy="Y" upWhenActuated={leftSpoilerUp || speedBrakeUp} />
            <Spoiler x={99} y={12} side="left" number={3} actuatedBy="B" upWhenActuated={leftSpoilerUp || speedBrakeUp} />
            <Spoiler x={147} y={6} side="left" number={2} actuatedBy="Y" upWhenActuated={leftSpoilerUp || speedBrakeUp} />
            <Spoiler x={197} y={0} side="left" number={1} actuatedBy="G" upWhenActuated={spoilersArmed && leftSpoilerUp} />

            <Spoiler x={304} y={0} side="right" number={1} actuatedBy="G" upWhenActuated={spoilersArmed && rightSpoilerUp} />
            <Spoiler x={354} y={6} side="right" number={2} actuatedBy="Y" upWhenActuated={rightSpoilerUp || speedBrakeUp} />
            <Spoiler x={402} y={12} side="right" number={3} actuatedBy="B" upWhenActuated={rightSpoilerUp || speedBrakeUp} />
            <Spoiler x={452} y={19} side="right" number={4} actuatedBy="Y" upWhenActuated={rightSpoilerUp || speedBrakeUp} />
            <Spoiler x={501} y={26} side="right" number={5} actuatedBy="G" upWhenActuated={(spoilersArmed && rightSpoilerUp) || rightAileronUp} />
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
                className={`${hydraulics[actuatedBy].available ? 'GreenLine' : 'AmberLine'}`}
                d={`M 0 0 l ${side === 'right' ? '-' : ''}19 0`}
            />
            <path
                visibility={upWhenActuated ? 'visible' : 'hidden'}
                className={`${hydraulics[actuatedBy].available ? 'GreenLine' : 'AmberLine'}`}
                d={`M 0 -31 l ${side === 'left' ? 19 : -19} 0 l ${side === 'left' ? -9.5 : 9.5} -16 z`}
            />
            <path
                visibility={upWhenActuated && hydraulics[actuatedBy].available ? 'visible' : 'hidden'}
                className="GreenLine"
                d={`M ${side === 'left' ? 9.5 : -9.5} 0 l 0 -31`}
            />
            <text
                x={side === 'left' ? 12 : -6}
                y={-4}
                visibility={hydraulics[actuatedBy].available ? 'hidden' : 'visible'}
                className="Amber Huge Center"
            >
                {number}
            </text>
        </SvgGroup>
    );
};
