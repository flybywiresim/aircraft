import { useSimVar } from '@instruments/common/simVars';
import React from 'react';
import { PageTitle } from '../Generic/PageTitle';
import { HydraulicSystem } from 'instruments/src/SD/Pages/Hyd/elements/HydraulicSystem';

import '../../../index.scss';

export const HydPage = () => {
  const [engine1N3] = useSimVar('L:A32NX_ENGINE_N3:1', 'number', 500);
  const [engine2N3] = useSimVar('L:A32NX_ENGINE_N3:2', 'number', 500);
  const [engine3N3] = useSimVar('L:A32NX_ENGINE_N3:3', 'number', 500);
  const [engine4N3] = useSimVar('L:A32NX_ENGINE_N3:4', 'number', 500);
  const anyEngineIsRunning = engine1N3 > 50 || engine2N3 > 50 || engine3N3 > 50 || engine4N3 > 50;

  return (
    <g>
      <PageTitle x={6} y={29}>
        HYD
      </PageTitle>

      <HydraulicSystem label="GREEN" />

      <text x={352} y={110} className={anyEngineIsRunning ? 'Hide' : 'F26 White LS1'}>
        ELEC
      </text>
      <text x={352} y={135} className={anyEngineIsRunning ? 'Hide' : 'F26 White LS1'}>
        PMP
      </text>
      <text x={401} y={135} className={anyEngineIsRunning ? 'Hide' : 'F23 White'}>
        S
      </text>

      <HydraulicSystem label="YELLOW" />
    </g>
  );
};
