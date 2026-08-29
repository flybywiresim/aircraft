import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';

interface BleedPackProps {
  x: number;
  y: number;
  pack: number;
  isPackOperative: boolean;
}

const BleedPack: FC<BleedPackProps> = ({ x, y, pack, isPackOperative }) => {
  const [packOutletTemperature] = useSimVar(`L:A32NX_COND_PACK_${pack}_OUTLET_TEMPERATURE`, 'celsius', 500);
  const packCtlOffset = pack == 1 ? -50 : 210;

  return (
    <g id={`BleedPack${pack}`} style={{ transform: `translate3d(${x}px, ${y}px, 0px)` }}>
      <path className={`${isPackOperative ? 'Green' : 'Amber'} Line`} d="M79,-21 l 0,-23" />
      {/* Should this really be isPackOperative? Pack flow control valve status might make more sense */}
      <path className={`${isPackOperative ? 'Green' : 'Amber'} Line`} d="M78,115 l 0,-21" />

      <path className="Grey SW2 NoFill" d="M 21,0 h -21 v 93 h 158 v -93 h -21" />
      <text x={42} y={0} className={`F22 ${isPackOperative ? 'White' : 'Amber'}`}>
        PACK
      </text>
      <text x={108} y={0} className={`F24 ${isPackOperative ? 'Green' : 'Amber'}`}>
        {pack}
      </text>

      <text x={83} y={57} className={`F28 EndAlign Green ${isPackOperative ? 'Show' : 'Hide'}`}>
        {Math.round(packOutletTemperature)}
      </text>
      <text x={84} y={57} className={`Cyan F22 ${isPackOperative ? 'Show' : 'Hide'}`}>
        °C
      </text>
      <PackController x={packCtlOffset} y={25} pack={pack} isPackOperative={isPackOperative} />
    </g>
  );
};

const PackController: React.FC<BleedPackProps> = ({ x, y, pack }) => {
  const [fdacChannel1Failure] = useSimVar(`L:A32NX_COND_FDAC_${pack}_CHANNEL_1_FAILURE`, 'bool', 1000);
  const [fdacChannel2Failure] = useSimVar(`L:A32NX_COND_FDAC_${pack}_CHANNEL_2_FAILURE`, 'bool', 1000);

  const noFailure = !fdacChannel1Failure && !fdacChannel2Failure;

  return (
    <g
      id="PackControl"
      className={noFailure ? 'Hide' : 'Show'}
      style={{ transform: `translate3d(${x}px, ${y}px, 0px)` }}
    >
      <text x={0} y={0} className="White F23 MiddleAlign">
        CTL
      </text>
      <text x={-20} y={25} className={`${fdacChannel1Failure ? 'Amber' : 'Green'} F22 MiddleAlign`}>
        1
      </text>
      <text x={20} y={25} className={`${fdacChannel2Failure ? 'Amber' : 'Green'} F22 MiddleAlign`}>
        2
      </text>

      <path className="Grey SW2 NoFill" d="M-31,35 h 18 v -21" />
      <path className="Grey SW2 NoFill" d="M10,35 h 18 v -21" />
    </g>
  );
};

export default BleedPack;
