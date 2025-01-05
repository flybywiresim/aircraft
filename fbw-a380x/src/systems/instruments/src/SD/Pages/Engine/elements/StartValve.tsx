import { useSimVar } from '@instruments/common/simVars';
import { Position, EngineNumber } from '@instruments/common/types';
import Valve from '@instruments/common/Valve';
import React from 'react';

const StartValve: React.FC<Position & EngineNumber> = ({ x, y, engine }) => {
  const [startValveOpen] = useSimVar(`L:A32NX_PNEU_ENG_${engine}_STARTER_VALVE_OPEN`, 'boolean', 500);
  const [starterInletPressure] = useSimVar(`L:A32NX_PNEU_ENG_${engine}_STARTER_CONTAINER_PRESSURE`, 'psi', 100);

  const [N2] = useSimVar(`L:A32NX_ENGINE_N2:${engine}`, 'number', 100);
  const showIgniter = !!(N2 > 9 && N2 < 25); // TODO Use SimVars for igniter once available

  return (
    <g id={`SD-start-valve-${engine}`}>
      <Valve x={x} y={y - 14} radius={24} css="Green SW2" position={startValveOpen ? 'V' : 'H'} sdacDatum />
      <text x={x - 10} y={y - 60} className={`Green F25 MiddleAlign ${!(showIgniter && startValveOpen) && 'Hide'}`}>
        A
      </text>
      <text
        x={x}
        y={y + 38}
        className={`F29 MiddleAlign ${starterInletPressure < 15 || starterInletPressure > 60 ? 'Amber' : 'Green'}`}
      >
        {Math.round(starterInletPressure)}
      </text>
      <path className="SW2 Green" d={`M${x},${y + 11} l 0,10`} />
      {startValveOpen && <path className="SW2 Green" d={`M${x},${y - 37} l 0,-10`} />}
      {engine === 2 && (
        <>
          <text x={x + 180} y={y - 50} className="F25 EndAlign White">
            IGN
          </text>
          <text x={x + 180} y={y + 44} className="F25 EndAlign Cyan">
            PSI
          </text>
        </>
      )}
    </g>
  );
};

export default StartValve;
