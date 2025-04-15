import { useSimVar } from '@instruments/common/simVars';
import React, { FC } from 'react';
import Valve from './Valve';

const BleedCrossbleed: FC = () => {
  const [lhCrossBleedValveOpen] = useSimVar('L:A32NX_PNEU_XBLEED_VALVE_L_OPEN', 'bool', 500);
  const [centreCrossBleedValveOpen] = useSimVar('L:A32NX_PNEU_XBLEED_VALVE_C_OPEN', 'bool', 500);
  const [rhCrossBleedValveOpen] = useSimVar('L:A32NX_PNEU_XBLEED_VALVE_R_OPEN', 'bool', 500);
  const [apuBleedValveOpen] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'bool', 500);
  const allApuValvesOpen = apuBleedValveOpen;

  const sdacDatum = true;
  const x = 0;
  const y = 330;

  return (
    <g id="CrossBleed" style={{ transform: `translate3d(${x}px, ${y}px, 0px)` }}>
      <Valve
        x={292}
        y={0}
        radius={19.5}
        css="Green SW2 NoFill"
        position={lhCrossBleedValveOpen ? 'H' : 'V'}
        sdacDatum={sdacDatum}
      />
      <Valve
        x={395}
        y={0}
        radius={19.5}
        css="Green SW2 NoFill"
        position={centreCrossBleedValveOpen ? 'H' : 'V'}
        sdacDatum={sdacDatum}
      />
      <Valve
        x={478}
        y={0}
        radius={19.5}
        css="Green SW2 NoFill"
        position={rhCrossBleedValveOpen ? 'H' : 'V'}
        sdacDatum={sdacDatum}
      />
      {/* Left Crossbleed valve to engine 2 */}
      <path className={`${!lhCrossBleedValveOpen ? 'Hide' : 'Show'} Line Green NoFill`} d="M248,0 l 24,0" />
      {/* Left Crossbleed valve to engine 1 junction */}
      <path className={`${!lhCrossBleedValveOpen ? 'Hide' : 'Show'} Line Green NoFill`} d="M312,0 l 14,0" />
      {/* Engine 1 Junction to APU Junction */}
      <path
        className={`${!allApuValvesOpen && !lhCrossBleedValveOpen && !centreCrossBleedValveOpen ? 'Hide' : 'Show'} Line Green NoFill`}
        d="M326,0 l 34,0"
      />
      {/* Engine 1 Junction to Engine 1 */}
      <path
        className={`${!allApuValvesOpen && !lhCrossBleedValveOpen && !centreCrossBleedValveOpen ? 'Hide' : 'Show'} Line Green NoFill`}
        d="M326,0 v 40 h -60,0 m-10,10 l 20,-20 m-10,10 m -35,0 m-10,10 l20,-20 m-10,10 h -119"
      />
      {/* APU Junction to Center Crossbleed valve */}
      <path
        className={`${!allApuValvesOpen && !lhCrossBleedValveOpen && !centreCrossBleedValveOpen ? 'Hide' : 'Show'} Line Green NoFill`}
        d="M360,0 l 15,0"
      />
      {/* Center Crossbleed valve to engine 4 junction */}
      <path className={`${!centreCrossBleedValveOpen ? 'Hide' : 'Show'} Line Green NoFill`} d={`M415,0 l 24,0`} />
      {/* Engine 4 junction to Right Crossbleed valve */}
      <path className={`${!rhCrossBleedValveOpen ? 'Hide' : 'Show'} Line Green NoFill`} d={`M439,0 l 19,0`} />
      {/* Engine 4 junction to Engine 4 */}
      <path
        className={`${!rhCrossBleedValveOpen && !centreCrossBleedValveOpen ? 'Hide' : 'Show'} Line Green NoFill`}
        d="M439,0 v 40 h 67,0 m-10,10 l 20,-20 m-10,10 m 35,0 m-10,10 l20,-20 m-10,10 h 118"
      />
      {/* Right Crossbleed valve to engine 3 */}
      <path className={`${!rhCrossBleedValveOpen ? 'Hide' : 'Show'} Line Green NoFill`} d="M498,0 l 24,0" />
    </g>
  );
};

export default BleedCrossbleed;
