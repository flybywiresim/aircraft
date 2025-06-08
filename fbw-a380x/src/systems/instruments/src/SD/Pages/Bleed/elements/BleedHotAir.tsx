import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Triangle } from '@instruments/common/Shapes';
import Valve from './Valve';
import { useArinc429Var } from '@flybywiresim/fbw-sdk';

interface BleedHotAirProps {
  x: number;
  y: number;
  hotAir: number;
  _sdacDatum: boolean;
}

const BleedHotAir: FC<BleedHotAirProps> = ({ x, y, hotAir, _sdacDatum }) => {
  const [packValveOpen1] = useSimVar(`L:A32NX_COND_PACK_${hotAir}_FLOW_VALVE_1_IS_OPEN`, 'bool', 500);
  const [packValveOpen2] = useSimVar(`L:A32NX_COND_PACK_${hotAir}_FLOW_VALVE_1_IS_OPEN`, 'bool', 500);
  const anyPackValveOpen = packValveOpen1 || packValveOpen2;

  const tcsB1DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B1_TCS_DISCRETE_WORD');
  const tcsB2DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B2_TCS_DISCRETE_WORD');
  const tcsB3DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B3_TCS_DISCRETE_WORD');
  const tcsB4DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B4_TCS_DISCRETE_WORD');

  const bitNumber = 14 + hotAir;
  const hotAirValveOpen = tcsB1DiscreteWord.bitValueOr(
    bitNumber,
    tcsB2DiscreteWord.bitValueOr(
      bitNumber,
      tcsB3DiscreteWord.bitValueOr(bitNumber, tcsB4DiscreteWord.bitValueOr(bitNumber, false)),
    ),
  );

  const xoffset = 68;

  return (
    <g id={`HotAir-${hotAir}`} style={{ transform: `translate3d(${x}px, ${y}px, 0px)` }}>
      <path
        className={`${anyPackValveOpen ? 'Green' : 'Amber'} Line NoFill`}
        d={`M0,0 l ${hotAir === 2 ? '-' : ''}${xoffset},0 l 0,-26`}
      />
      <path
        className={`${hotAirValveOpen && anyPackValveOpen ? 'Green' : 'Amber'} Line`}
        d={`M${hotAir === 1 ? xoffset : -xoffset},${-66} l 0,-22`}
      />
      <Triangle
        x={hotAir === 1 ? xoffset : -xoffset}
        y={-108}
        colour={hotAirValveOpen && anyPackValveOpen ? 'Green' : 'Amber'}
        fill={0}
        orientation={0}
        scale={1.3}
      />
      <Valve
        x={hotAir === 1 ? xoffset : -xoffset}
        y={-46}
        radius={19.5}
        css={`SW2 ${hotAirValveOpen && anyPackValveOpen ? 'Green' : 'Amber'} NoFill`}
        position={hotAirValveOpen ? 'V' : 'H'}
        sdacDatum
      />
      <text x={hotAir === 1 ? xoffset + 37 : -xoffset - 33} y={-43} className="White F22 MiddleAlign">
        {hotAir}
      </text>
    </g>
  );
};

export default BleedHotAir;
