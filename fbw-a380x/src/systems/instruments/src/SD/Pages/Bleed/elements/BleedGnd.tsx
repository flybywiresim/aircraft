import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Triangle } from '@instruments/common/Shapes';
import { useArinc429Var } from '@instruments/common/arinc429';

const BleedGnd: FC = () => {
  const [onGround] = useSimVar('L:A32NX_LGCIU_1_LEFT_GEAR_COMPRESSED', 'bool', 1000);
  const airspeed = useArinc429Var('L:A32NX_ADIRS_ADR_1_COMPUTED_AIRSPEED', 1000);

  const showGndIndication = onGround && !airspeed.isFailureWarning() && airspeed.value < 50;

  return (
    <g id={`Gnd`} className={showGndIndication ? 'Show' : 'Hide'}>
      <Triangle x={334} y={323} colour={'White'} fill={0} orientation={180} scale={1.2} />
      <text x={334} y={295} className="White F23 MiddleAlign">
        GND
      </text>
    </g>
  );
};

export default BleedGnd;
