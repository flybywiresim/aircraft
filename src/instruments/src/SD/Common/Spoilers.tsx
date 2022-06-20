import React from 'react';
import { useArinc429Var } from '@instruments/common/arinc429';
import { Arinc429Word } from '@shared/arinc429';
import { ComponentPositionProps } from './ComponentPositionProps';
import { ComponentSidePositionProps } from './ComponentSidePositionProps';
import { SvgGroup } from './SvgGroup';

export const Spoilers = ({ x, y }: ComponentPositionProps) => {
    const fcdc1DiscreteWord3 = useArinc429Var('L:A32NX_FCDC_1_DISCRETE_WORD_3');
    const fcdc2DiscreteWord3 = useArinc429Var('L:A32NX_FCDC_2_DISCRETE_WORD_3');
    const fcdc1DiscreteWord4 = useArinc429Var('L:A32NX_FCDC_1_DISCRETE_WORD_4');
    const fcdc2DiscreteWord4 = useArinc429Var('L:A32NX_FCDC_2_DISCRETE_WORD_4');

    const fcdcWord3ToUse = !fcdc1DiscreteWord3.isFailureWarning() ? fcdc1DiscreteWord3 : fcdc2DiscreteWord3;
    const fcdcWord4ToUse = !fcdc1DiscreteWord4.isFailureWarning() ? fcdc1DiscreteWord4 : fcdc2DiscreteWord4;

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
    fcdcWord3: Arinc429Word,
    fcdcWord4: Arinc429Word
}
const Spoiler = ({ x, y, number, side, fcdcWord3, fcdcWord4 }: SpoilerProps) => {
    const availAndValidBit = 20 + number;
    const isAvail = fcdcWord3.getBitValueOr(availAndValidBit, false);
    const isPosValid = fcdcWord4.getBitValueOr(availAndValidBit, false);

    const spoilerOutIndex = 9 + number * 2 + (side === 'left' ? 0 : 1);
    const isSpoilerOut = fcdcWord4.getBitValueOr(spoilerOutIndex, false);

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
                {isPosValid ? number : 'X'}
            </text>
        </SvgGroup>
    );
};
