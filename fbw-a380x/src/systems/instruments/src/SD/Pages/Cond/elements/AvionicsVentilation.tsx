import React from 'react';
import { Position } from '@instruments/common/types';
import { useSimVar } from '@instruments/common/simVars';

const AvionicsVentilation: React.FC<Position> = ({ x, y }) => {
  // TODO: There are more visual elements in failure conditions, not implemented yet for the A380
  return (
    <g id="AvionicsVentilation">
      <text x={x} y={y} className="F23 Green">
        VENT
      </text>

      <VentilationController x={x + 31} y={y + 257} vcm="FWD" />
      <VentilationController x={x + 641} y={y + 257} vcm="AFT" />
    </g>
  );
};

interface VentilationControllerProps {
  x: number;
  y: number;
  vcm: string;
}

const VentilationController: React.FC<VentilationControllerProps> = ({ x, y, vcm }) => {
  const [vcmChannel1Failure] = useSimVar(`L:A32NX_VENT_${vcm}_VCM_CHANNEL_1_FAILURE`, 'bool', 1000);
  const [vcmChannel2Failure] = useSimVar(`L:A32NX_VENT_${vcm}_VCM_CHANNEL_2_FAILURE`, 'bool', 1000);

  const noFailure = !vcmChannel1Failure && !vcmChannel2Failure;

  return (
    <g id={`VentilationControl-${vcm}`} className={noFailure ? 'Hide' : 'Show'}>
      <text x={x} y={y - 25} className="White F23 MiddleAlign">
        {vcm}
      </text>
      <text x={x} y={y} className="White F23 MiddleAlign">
        VENT CTL
      </text>
      <text x={x - 20} y={y + 25} className={`${vcmChannel1Failure ? 'Amber' : 'Green'} F23 MiddleAlign`}>
        1
      </text>
      <text x={x + 20} y={y + 25} className={`${vcmChannel2Failure ? 'Amber' : 'Green'} F23 MiddleAlign`}>
        2
      </text>

      <path className={'White Line'} d={`M${x - 10},${y + 15} l 0,22 l -25,0`} fill={'none'} />
      <path className={'White Line'} d={`M${x + 30},${y + 15} l 0,22 l -25,0`} fill={'none'} />
    </g>
  );
};

export default AvionicsVentilation;
