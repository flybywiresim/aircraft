import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Triangle } from '@instruments/common/Shapes';
import { useArinc429Var } from '@instruments/common/arinc429';

const BleedGnd: FC = () => {
  const [onGround] = useSimVar('L:A32NX_LGCIU_1_LEFT_GEAR_COMPRESSED', 'bool', 1000);
  const airspeed = useArinc429Var('L:A32NX_ADIRS_ADR_1_COMPUTED_AIRSPEED', 1000);

  const showGndIndication = onGround && !airspeed.isFailureWarning() && airspeed.value < 50;

  const x = 343;
  const y = 327;

  return (
    <g
      id={`Gnd`}
      className={showGndIndication ? 'Show' : 'Hide'}
      style={{ transform: `translate3d(${x}px, ${y}px, 0px)` }}
    >
      <Triangle x={0} y={0} colour={'White'} fill={0} orientation={180} scale={1.3} />
      <text x={1} y={-30} className="White F22 MiddleAlign">
        GND
      </text>
    </g>
  );
};

export default BleedGnd;
