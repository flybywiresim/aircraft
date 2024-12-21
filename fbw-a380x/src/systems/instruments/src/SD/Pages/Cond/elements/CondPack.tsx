import React, { FC } from 'react';
import { Triangle } from '@instruments/common/Shapes';
import { useArinc429Var } from '@flybywiresim/fbw-sdk';

interface CondPackProps {
  x: number;
  y: number;
  pack: number;
}

const CondPack: FC<CondPackProps> = ({ x, y, pack }) => {
  const agsB1DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B1_AGS_DISCRETE_WORD');
  const agsB2DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B2_AGS_DISCRETE_WORD');
  const agsB3DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B3_AGS_DISCRETE_WORD');
  const agsB4DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B4_AGS_DISCRETE_WORD');

  const bitNumber = 12 + pack;
  const isPackOperative = agsB1DiscreteWord.bitValueOr(
    bitNumber,
    agsB2DiscreteWord.bitValueOr(
      bitNumber,
      agsB3DiscreteWord.bitValueOr(bitNumber, agsB4DiscreteWord.bitValueOr(bitNumber, false)),
    ),
  );

  return (
    <g id={`CondPack-${pack}`}>
      <path className={`${isPackOperative ? 'Green' : 'Amber'} Line`} d={`M${x},${y} l 0,-70`} />
      <Triangle x={x} y={y - 88} colour={isPackOperative ? 'Green' : 'Amber'} fill={0} orientation={0} scale={1.1} />

      <text x={x - 35} y={y + 30} className={`F23 ${isPackOperative ? 'White' : 'Amber'}`}>
        PACK
      </text>
      <text x={x + 30} y={y + 30} className={`F26 ${isPackOperative ? 'Green' : 'Amber'}`}>
        {pack}
      </text>
    </g>
  );
};

export default CondPack;
