import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import Valve from './Valve';

interface BleedApuProps {
  isPack1Operative: boolean;
  isPack2Operative: boolean;
}

const BleedApu: FC<BleedApuProps> = ({ isPack1Operative, isPack2Operative }) => {
  const [apuBleedAirValveOpen] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'bool', 500);
  const [apuMasterSwitchPbIsOn] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'bool', 500);

  // The bleed valve and isolation valve operate "simulatneously" according to the FCOM
  // Not fully correct, according to other sources, APU bleed valve is closed on ground without any bleed users,
  // while the isolation valve is then open
  const apuIsolationValveOpen = apuBleedAirValveOpen;

  const x = 360;
  const y = 602;

  return (
    <g id="ApuBleed" style={{ transform: `translate3d(${x}px, ${y}px, 0px)` }}>
      <Valve
        x={0}
        y={-150}
        radius={19.5}
        css="Green SW2 NoFill"
        position={apuIsolationValveOpen ? 'V' : 'H'}
        sdacDatum
      />

      {/* Why would this depend on the packs? */}
      <path
        className={`${apuIsolationValveOpen && (isPack1Operative || isPack2Operative) ? 'Show' : 'Hide'} Line Green NoFill`}
        d="M0,-69 l 0,-61"
      />

      <g className={apuMasterSwitchPbIsOn ? 'Show' : 'Hide'}>
        <Valve
          x={0}
          y={-49}
          radius={19.5}
          css="Green SW2 NoFill"
          position={apuBleedAirValveOpen ? 'V' : 'H'}
          sdacDatum
        />
        <path className="Green SW2" d="M 0,0 l 0,-30" />
        <text x={1} y={16} className="White F23 MiddleAlign">
          APU
        </text>
      </g>
    </g>
  );
};

export default BleedApu;
