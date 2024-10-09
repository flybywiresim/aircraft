import React from 'react';
import { Position } from '@instruments/common/types';
import { useArinc429Var } from '@instruments/common/arinc429';
import { useSimVar } from '@instruments/common/simVars';

const LandingElevation: React.FC<Position> = ({ x, y }) => {
  // TODO: Handle landing elevation invalid SSM
  const landingElev = useArinc429Var('L:A32NX_FM1_LANDING_ELEVATION', 1000);
  const [autoMode] = useSimVar('L:A32NX_OVHD_PRESS_MAN_ALTITUDE_PB_IS_AUTO', 'Bool', 1000);

  const ldgElevValue = Math.round(landingElev.value / 50) * 50;

  return (
    <>
      <g id="LandingElevation" className={autoMode ? 'Show' : 'Hide'}>
        <text className="F25 White LS1" x={x} y={y}>
          LDG ELEVN
        </text>

        <text id="LandingElevation" className="F28 Green EndAlign" x={x + 260} y={y}>
          {ldgElevValue}
        </text>
        <text className="F24 Cyan" x={x + 268} y={y}>
          FT
        </text>
      </g>
    </>
  );
};

export default LandingElevation;
