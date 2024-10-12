import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { ApuGenerator } from './ApuGenerator';

interface ApuGeneratorSetProps {
  x: number;
  y: number;
}

export const ApuGeneratorSet: FC<ApuGeneratorSetProps> = ({ x, y }) => {
  const [masterSwPbOn] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'Bool', 500);

  return (
    <g transform={`translate(${x} ${y})`}>
      <text x={0} y={0} className="F26 White LS1 MiddleAlign">
        APU
      </text>

      <g className={masterSwPbOn ? '' : 'Hide'}>
        <text x={0} y={62} className="F22 Cyan MiddleAlign">
          %
        </text>
        <text x={0} y={90} className="F22 Cyan MiddleAlign">
          V
        </text>
        <text x={0} y={117} className="F22 Cyan MiddleAlign">
          HZ
        </text>
      </g>

      <ApuGenerator x={-91} y={31} position={1} />
      <ApuGenerator x={5} y={31} position={2} />
    </g>
  );
};
