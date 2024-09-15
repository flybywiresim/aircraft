import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Triangle } from '@instruments/common/Shapes';
import Valve from './Valve';

interface BleedHotAirProps {
  x: number;
  y: number;
  hotAir: number;
  sdacDatum: boolean;
}

const BleedHotAir: FC<BleedHotAirProps> = ({ x, y, hotAir }) => {
  const [packValveOpen1] = useSimVar(`L:A32NX_PNEU_ENG_${hotAir + (hotAir === 1 ? 0 : 1)}_HP_VALVE_OPEN`, 'bool', 500);
  const [packValveOpen2] = useSimVar(`L:A32NX_PNEU_ENG_${hotAir + (hotAir === 1 ? 1 : 2)}_HP_VALVE_OPEN`, 'bool', 500);
  const anyPackValveOpen = packValveOpen1 || packValveOpen2;
  const [hotAirValveOpen] = useSimVar(`L:A32NX_COND_HOT_AIR_VALVE_${hotAir}_IS_OPEN`, 'bool', 500);

  const xoffset = 66;

  return (
    <g id={`HotAir-${hotAir}`}>
      <path
        className={`${anyPackValveOpen ? 'Green' : 'Amber'} Line`}
        d={`M${x},${y} l ${hotAir === 2 ? '-' : ''}${xoffset},0 l 0,-30`}
      />
      <path
        className={`${hotAirValveOpen && anyPackValveOpen ? 'Green' : 'Amber'} Line`}
        d={`M${hotAir === 1 ? x + xoffset : x - xoffset},${y - 68} l 0,-24`}
      />
      <Triangle
        x={hotAir === 1 ? x + xoffset : x - xoffset}
        y={y - 108}
        colour={hotAirValveOpen && anyPackValveOpen ? 'Green' : 'Amber'}
        fill={0}
        orientation={0}
        scale={1.2}
      />
      <Valve
        x={hotAir === 1 ? x + xoffset : x - xoffset}
        y={y - 49}
        radius={19}
        css={`SW2 ${hotAirValveOpen && anyPackValveOpen ? 'Green' : 'Amber'}`}
        position={hotAirValveOpen ? 'V' : 'H'}
        sdacDatum
      />
      <text x={hotAir === 1 ? x + xoffset + 37 : x - xoffset - 37} y={y - 43} className="White F23 MiddleAlign">
        {hotAir}
      </text>
    </g>
  );
};

export default BleedHotAir;
