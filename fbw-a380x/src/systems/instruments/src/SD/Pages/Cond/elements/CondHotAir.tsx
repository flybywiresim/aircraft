import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';

import { Triangle } from '@instruments/common/Shapes';
import Valve from '@instruments/common/Valve';
import { useArinc429Var } from '@flybywiresim/fbw-sdk';

interface CondHotAirProps {
  x: number;
  y: number;
  hotAir: number;
}

const CondHotAir: FC<CondHotAirProps> = ({ x, y, hotAir }) => {
  const [packValveOpen1] = useSimVar(`L:A32NX_COND_PACK_${hotAir}_FLOW_VALVE_1_IS_OPEN`, 'bool', 500);
  const [packValveOpen2] = useSimVar(`L:A32NX_COND_PACK_${hotAir}_FLOW_VALVE_1_IS_OPEN`, 'bool', 500);
  const anyPackValveOpen = packValveOpen1 || packValveOpen2;

  const tcsB1DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B1_TCS_DISCRETE_WORD');
  const tcsB2DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B2_TCS_DISCRETE_WORD');
  const tcsB3DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B3_TCS_DISCRETE_WORD');
  const tcsB4DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B4_TCS_DISCRETE_WORD');

  let tcsDiscreteWordToUse;

  if (tcsB1DiscreteWord.isNormalOperation()) {
    tcsDiscreteWordToUse = tcsB1DiscreteWord;
  } else if (tcsB2DiscreteWord.isNormalOperation()) {
    tcsDiscreteWordToUse = tcsB2DiscreteWord;
  } else if (tcsB3DiscreteWord.isNormalOperation()) {
    tcsDiscreteWordToUse = tcsB3DiscreteWord;
  } else {
    tcsDiscreteWordToUse = tcsB4DiscreteWord;
  }

  const bitNumber = 14 + hotAir;
  const hotAirValveOpen = tcsDiscreteWordToUse.bitValueOr(bitNumber, false);
  const hotAirValveDisagrees = tcsDiscreteWordToUse.bitValueOr(bitNumber - 2, false);

  return (
    <g id={`CondHotAir-${hotAir}`}>
      <path className={`${anyPackValveOpen ? 'Green' : 'Amber'} Line`} d={`M${x},${y} l 0,-30`} />
      <path className={`${hotAirValveOpen ? 'Green' : 'Amber'} Line`} d={`M${x},${y - 58} l 0,-16`} />
      <Triangle x={x} y={y - 90} colour={hotAirValveOpen ? 'Green' : 'Amber'} fill={0} orientation={0} scale={1.1} />
      <Valve
        x={x}
        y={y - 39}
        radius={17}
        css={`SW2 ${hotAirValveOpen && !hotAirValveDisagrees ? 'Green' : 'Amber'}`}
        position={hotAirValveOpen ? 'V' : 'H'}
        sdacDatum
      />
    </g>
  );
};

export default CondHotAir;
