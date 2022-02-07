import React from 'react';
import { useArinc429Var } from '@instruments/common/arinc429';
import { Arinc429Word } from '@shared/arinc429';
import { ComponentPositionProps } from './ComponentPositionProps';
import { ComponentSidePositionProps } from './ComponentSidePositionProps';
import { SvgGroup } from './SvgGroup';

import './Spoilers.scss';

export const Spoilers = ({ x, y }: ComponentPositionProps) => {
    const fcdc1DiscreteWord3 = useArinc429Var('L:A32NX_FCDC_1_DISCRETE_WORD_3');
    const fcdc2DiscreteWord3 = useArinc429Var('L:A32NX_FCDC_2_DISCRETE_WORD_3');
    const fcdc1DiscreteWord4 = useArinc429Var('L:A32NX_FCDC_1_DISCRETE_WORD_4');
    const fcdc2DiscreteWord4 = useArinc429Var('L:A32NX_FCDC_2_DISCRETE_WORD_4');

    const fcdcWord3ToUse = !fcdc1DiscreteWord3.isFailureWarning() ? fcdc1DiscreteWord3 : fcdc2DiscreteWord3;
    const fcdcWord4ToUse = !fcdc1DiscreteWord4.isFailureWarning() ? fcdc1DiscreteWord4 : fcdc2DiscreteWord4;

    return (
        <SvgGroup x={x} y={y}>
            <Spoiler x={0} y={20} side="left" number={5} fcdcWord3={fcdcWord3ToUse} fcdcWord4={fcdcWord4ToUse} />
            <Spoiler x={38} y={15} side="left" number={4} fcdcWord3={fcdcWord3ToUse} fcdcWord4={fcdcWord4ToUse} />
            <Spoiler x={76} y={10} side="left" number={3} fcdcWord3={fcdcWord3ToUse} fcdcWord4={fcdcWord4ToUse} />
            <Spoiler x={114} y={5} side="left" number={2} fcdcWord3={fcdcWord3ToUse} fcdcWord4={fcdcWord4ToUse} />
            <Spoiler x={152} y={0} side="left" number={1} fcdcWord3={fcdcWord3ToUse} fcdcWord4={fcdcWord4ToUse} />

            <Spoiler x={226} y={0} side="right" number={1} fcdcWord3={fcdcWord3ToUse} fcdcWord4={fcdcWord4ToUse} />
            <Spoiler x={264} y={5} side="right" number={2} fcdcWord3={fcdcWord3ToUse} fcdcWord4={fcdcWord4ToUse} />
            <Spoiler x={302} y={10} side="right" number={3} fcdcWord3={fcdcWord3ToUse} fcdcWord4={fcdcWord4ToUse} />
            <Spoiler x={340} y={15} side="right" number={4} fcdcWord3={fcdcWord3ToUse} fcdcWord4={fcdcWord4ToUse} />
            <Spoiler x={378} y={20} side="right" number={5} fcdcWord3={fcdcWord3ToUse} fcdcWord4={fcdcWord4ToUse} />
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
                className={`Spoilers ${isAvail ? 'GreenShapeThick' : 'WarningShapeThick'}`}
                visibility={isPosValid ? 'visible' : 'hidden'}
                d="M 0 0 l 15 0"
            />
            <path
                visibility={isSpoilerOut && isPosValid ? 'visible' : 'hidden'}
                className={`Spoilers ${isAvail ? 'GreenShape' : 'WarningShape'}`}
                d="M 8 -22 l -6 0 l 6 -12 l 6 12 l -6 0"
            />
            <path
                visibility={isSpoilerOut && isAvail && isPosValid ? 'visible' : 'hidden'}
                className="Spoilers GreenShape"
                d="M 8 0 l 0 -22"
            />
            <text
                x={9}
                y={isPosValid ? -11 : -18}
                visibility={isAvail && isPosValid ? 'hidden' : 'visible'}
                className="Spoilers Warning Standard"
                textAnchor="middle"
                alignmentBaseline="central"
            >
                {isPosValid ? number : 'X'}
            </text>
        </SvgGroup>
    );
};
