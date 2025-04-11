import { useSimVar } from '@instruments/common/simVars';
import React, { FC } from 'react';
import Valve from './Valve';

const BleedCrossbleed: FC = () => {
  const [lhCrossBleedValveOpen] = useSimVar('L:A32NX_PNEU_XBLEED_VALVE_L_OPEN', 'bool', 500);
  const [centreCrossBleedValveOpen] = useSimVar('L:A32NX_PNEU_XBLEED_VALVE_C_OPEN', 'bool', 500);
  const [rhCrossBleedValveOpen] = useSimVar('L:A32NX_PNEU_XBLEED_VALVE_R_OPEN', 'bool', 500);
  const allCrossBleedValveOpen = lhCrossBleedValveOpen && centreCrossBleedValveOpen && rhCrossBleedValveOpen;

  // FIXME cover more combinations of crossbleed and pack flow valve status (assuming all flow valves from one pack are operative atm)
  const [pack1FlowValve1Open] = useSimVar('L:A32NX_COND_PACK_1_FLOW_VALVE_1_IS_OPEN', 'bool', 500);
  const [pack1FlowValve2Open] = useSimVar('L:A32NX_COND_PACK_1_FLOW_VALVE_2_IS_OPEN', 'bool', 500);
  const [pack2FlowValve1Open] = useSimVar('L:A32NX_COND_PACK_2_FLOW_VALVE_1_IS_OPEN', 'bool', 500);
  const [pack2FlowValve2Open] = useSimVar('L:A32NX_COND_PACK_2_FLOW_VALVE_2_IS_OPEN', 'bool', 500);

  const sdacDatum = true;
  const y = 325;

  return (
    <g id="CrossBleed">
      <Valve
        x={283}
        y={y}
        radius={19}
        css="Green SW2"
        position={lhCrossBleedValveOpen ? 'H' : 'V'}
        sdacDatum={sdacDatum}
      />
      <Valve
        x={385}
        y={y}
        radius={19}
        css="Green SW2"
        position={centreCrossBleedValveOpen ? 'H' : 'V'}
        sdacDatum={sdacDatum}
      />
      <Valve
        x={470}
        y={y}
        radius={19}
        css="Green SW2"
        position={rhCrossBleedValveOpen ? 'H' : 'V'}
        sdacDatum={sdacDatum}
      />
      <path
        className={`${allCrossBleedValveOpen && pack1FlowValve1Open && pack1FlowValve2Open ? 'Show' : 'Hide'} Line Green NoFill`}
        d={`M${240},${y} l 112,0`}
      />
      <path
        className={`${allCrossBleedValveOpen && pack2FlowValve1Open && pack2FlowValve2Open ? 'Show' : 'Hide'} Line Green NoFill`}
        d={`M${352},${y} l 162,0`}
      />
      <path
        className={`${allCrossBleedValveOpen && pack1FlowValve1Open && pack1FlowValve2Open ? 'Show' : 'Hide'} Line Green NoFill`}
        d={`M${315},${y} l 0,40 l -60,0 M${105},${y + 40} l 115,0 M${217},${y + 47.5} l 8,-15 M${250},${y + 47.5} l 8,-15`}
      />
      <path
        className={`${allCrossBleedValveOpen && pack2FlowValve1Open && pack2FlowValve2Open ? 'Show' : 'Hide'} Line Green NoFill`}
        d={`M${435},${y} l 0,40 l 60,0 M${533},${y + 40} l 115,0 M${492},${y + 47.5} l 8,-15 M${530},${y + 47.5} l 8,-15`}
      />
    </g>
  );
};

export default BleedCrossbleed;
