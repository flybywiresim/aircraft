import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { useArinc429Var } from '@flybywiresim/fbw-sdk';

interface BleedPackProps {
  x: number;
  y: number;
  pack: number;
}

const BleedPack: FC<BleedPackProps> = ({ x, y, pack }) => {
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

  const [packOutletTemperature] = useSimVar(`L:A32NX_COND_PACK_${pack}_OUTLET_TEMPERATURE`, 'celsius', 500);
  const packCtlOffset = pack == 1 ? -65 : 180;

  return (
    <g id={`BleedPack${pack}`}>
      <path className={`${isPackOperative ? 'Green' : 'Amber'} Line`} d={`M${x + 56},${y - 21} l 0,-22`} />
      <path className={`${isPackOperative ? 'Green' : 'Amber'} Line`} d={`M${x + 56},${y + 90} l 0,22`} />

      <path className="Grey SW2" d={`M ${x},${y} l -20,0 l 0,90 l 153,0 l 0,-90 l -20,0`} />
      <text x={x + 20} y={y} className={`F22 ${isPackOperative ? 'White' : 'Amber'}`}>
        PACK
      </text>
      <text x={x + 85} y={y} className={`F29 ${isPackOperative ? 'Green' : 'Amber'}`}>
        {pack}
      </text>

      <text x={x + 61} y={y + 57} className={`F29 EndAlign Green ${isPackOperative ? 'Show' : 'Hide'}`}>
        {Math.round(packOutletTemperature)}
      </text>
      <text x={x + 62} y={y + 57} className={`Cyan F23 ${isPackOperative ? 'Show' : 'Hide'}`}>
        °C
      </text>
      <PackController x={x + packCtlOffset} y={y + 25} pack={pack} />
    </g>
  );
};

const PackController: React.FC<BleedPackProps> = ({ x, y, pack }) => {
  const [fdacChannel1Failure] = useSimVar(`L:A32NX_COND_FDAC_${pack}_CHANNEL_1_FAILURE`, 'bool', 1000);
  const [fdacChannel2Failure] = useSimVar(`L:A32NX_COND_FDAC_${pack}_CHANNEL_2_FAILURE`, 'bool', 1000);

  const noFailure = !fdacChannel1Failure && !fdacChannel2Failure;

  return (
    <g id="PackControl" className={noFailure ? 'Hide' : 'Show'}>
      <text x={x} y={y} className="White F23 MiddleAlign">
        CTL
      </text>
      <text x={x - 20} y={y + 25} className={`${fdacChannel1Failure ? 'Amber' : 'Green'} F23 MiddleAlign`}>
        1
      </text>
      <text x={x + 20} y={y + 25} className={`${fdacChannel2Failure ? 'Amber' : 'Green'} F23 MiddleAlign`}>
        2
      </text>

      <path className={'White Line'} d={`M${x - 10},${y + 15} l 0,22 l -25,0`} fill={'none'} />
      <path className={'White Line'} d={`M${x + 30},${y + 15} l 0,22 l -25,0`} fill={'none'} />
    </g>
  );
};

export default BleedPack;
