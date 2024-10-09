import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import Valve from './Valve';

const BleedApu: FC = () => {
  const [apuBleedAirValveOpen] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'bool', 500);
  const [apuMasterSwitchPbIsOn] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'bool', 500);

  // The bleed valve and isolation valve operate "simulatneously" according to the FCOM
  const apuIsolationValveOpen = apuBleedAirValveOpen;

  return (
    <g id="ApuBleed">
      <Valve x={352} y={446} radius={19} css="Green SW2" position={apuIsolationValveOpen ? 'V' : 'H'} sdacDatum />
      <g className={apuMasterSwitchPbIsOn ? 'Show' : 'Hide'}>
        <Valve x={352} y={546} radius={19} css="Green SW2" position={apuBleedAirValveOpen ? 'V' : 'H'} sdacDatum />
        <path className="Green SW2" d="M 352,565 l 0,30" />
        <text x={352} y={610} className="White F23 MiddleAlign">
          APU
        </text>
      </g>
    </g>
  );
};

export default BleedApu;
