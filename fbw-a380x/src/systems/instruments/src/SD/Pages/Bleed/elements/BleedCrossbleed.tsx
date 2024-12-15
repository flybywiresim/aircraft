import { useSimVar } from '@instruments/common/simVars';
import React, { FC } from 'react';
import Valve from './Valve';

const BleedCrossbleed: FC = () => {
  const [lhCrossBleedValveOpen] = useSimVar('L:A32NX_PNEU_XBLEED_VALVE_L_OPEN', 'bool', 500);
  const [centreCrossBleedValveOpen] = useSimVar('L:A32NX_PNEU_XBLEED_VALVE_C_OPEN', 'bool', 500);
  const [rhCrossBleedValveOpen] = useSimVar('L:A32NX_PNEU_XBLEED_VALVE_R_OPEN', 'bool', 500);
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
    </g>
  );
};

export default BleedCrossbleed;
