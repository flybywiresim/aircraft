import { Triangle } from '@instruments/common/Shapes';
import { useSimVar } from '@instruments/common/simVars';
import { PackNumber, Position } from '@instruments/common/types';
import React from 'react';

const Packs: React.FC<Position & PackNumber> = ({ pack, x, y }) => {
  const [packValve1Open] = useSimVar(`L:A32NX_COND_PACK_${pack}_FLOW_VALVE_1_IS_OPEN`, 'bool', 500);
  const [packValve2Open] = useSimVar(`L:A32NX_COND_PACK_${pack}_FLOW_VALVE_2_IS_OPEN`, 'bool', 500);
  const packOpen = packValve1Open || packValve2Open;
  const triangleColour = !packOpen ? 'Amber' : 'Green';
  const packWordColour = !packOpen ? 'AmberFill' : 'WhiteFill';

  return (
    <>
      <Triangle x={x + 45} y={y - 50} colour={triangleColour} fill={0} orientation={0} scale={1.2} />
      <text className={`F26 ${packWordColour}`} x={x} y={y}>
        PACK
      </text>
      <text className={`F26 ${packWordColour}`} x={x + 75} y={y}>
        {pack}
      </text>
    </>
  );
};

export default Packs;
