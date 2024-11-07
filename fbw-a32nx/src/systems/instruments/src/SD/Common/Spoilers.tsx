// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { useArinc429Var, Arinc429Word } from '@flybywiresim/fbw-sdk';
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
      <Spoiler x={0} y={26} side="left" number={5} fcdcWord3={fcdcWord3ToUse} fcdcWord4={fcdcWord4ToUse} />
      <Spoiler x={50} y={19} side="left" number={4} fcdcWord3={fcdcWord3ToUse} fcdcWord4={fcdcWord4ToUse} />
      <Spoiler x={99} y={12} side="left" number={3} fcdcWord3={fcdcWord3ToUse} fcdcWord4={fcdcWord4ToUse} />
      <Spoiler x={147} y={6} side="left" number={2} fcdcWord3={fcdcWord3ToUse} fcdcWord4={fcdcWord4ToUse} />
      <Spoiler x={197} y={0} side="left" number={1} fcdcWord3={fcdcWord3ToUse} fcdcWord4={fcdcWord4ToUse} />

      <Spoiler x={304} y={0} side="right" number={1} fcdcWord3={fcdcWord3ToUse} fcdcWord4={fcdcWord4ToUse} />
      <Spoiler x={354} y={6} side="right" number={2} fcdcWord3={fcdcWord3ToUse} fcdcWord4={fcdcWord4ToUse} />
      <Spoiler x={402} y={12} side="right" number={3} fcdcWord3={fcdcWord3ToUse} fcdcWord4={fcdcWord4ToUse} />
      <Spoiler x={452} y={19} side="right" number={4} fcdcWord3={fcdcWord3ToUse} fcdcWord4={fcdcWord4ToUse} />
      <Spoiler x={501} y={26} side="right" number={5} fcdcWord3={fcdcWord3ToUse} fcdcWord4={fcdcWord4ToUse} />
    </SvgGroup>
  );
};

interface SpoilerProps extends ComponentPositionProps, ComponentSidePositionProps {
  number: number;
  fcdcWord3: Arinc429Word;
  fcdcWord4: Arinc429Word;
}
const Spoiler = ({ x, y, number, side, fcdcWord3, fcdcWord4 }: SpoilerProps) => {
  const availAndValidBit = 20 + number;
  const isAvail = fcdcWord3.bitValueOr(availAndValidBit, false);
  const isPosValid = fcdcWord4.bitValueOr(availAndValidBit, false);

  const spoilerOutIndex = 9 + number * 2 + (side === 'left' ? 0 : 1);
  const isSpoilerOut = fcdcWord4.bitValueOr(spoilerOutIndex, false);

  return (
    <SvgGroup x={x} y={y}>
      <path
        visibility={isPosValid ? 'visible' : 'hidden'}
        className={`${isAvail ? 'GreenLine' : 'AmberLine'}`}
        d={`M 0 0 l ${side === 'right' ? '-' : ''}19 0`}
      />
      <path
        visibility={isSpoilerOut && isPosValid ? 'visible' : 'hidden'}
        className={`${isAvail ? 'GreenLine' : 'AmberLine'}`}
        d={`M 0 -31 l ${side === 'left' ? 19 : -19} 0 l ${side === 'left' ? -9.5 : 9.5} -16 z`}
      />
      <path
        visibility={isSpoilerOut && isAvail && isPosValid ? 'visible' : 'hidden'}
        className="GreenLine"
        d={`M ${side === 'left' ? 9.5 : -9.5} 0 l 0 -31`}
      />
      <text
        x={side === 'left' ? 12 : -7}
        y={isPosValid ? -4 : -12}
        visibility={isAvail && isPosValid ? 'hidden' : 'visible'}
        className={`Amber ${isPosValid ? 'Huge' : 'Large'} Center`}
      >
        {isPosValid ? number : 'X'}
      </text>
    </SvgGroup>
  );
};
