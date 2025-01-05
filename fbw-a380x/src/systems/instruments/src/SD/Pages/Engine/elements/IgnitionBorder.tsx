import { useSimVar } from '@instruments/common/simVars';
import { Position, EngineNumber, IgnitionActive } from '@instruments/common/types';
import React from 'react';

const IgnitionBorder: React.FC<Position & EngineNumber & IgnitionActive> = ({ x, y, engine, ignition }) => {
  const [engineState] = useSimVar(`L:A32NX_ENGINE_STATE:${engine}`, 'number', 500);
  const [N1Percent] = useSimVar(`L:A32NX_ENGINE_N1:${engine}`, 'number', 100);
  const [N1Idle] = useSimVar('L:A32NX_ENGINE_IDLE_N1', 'number', 1000);
  const showBorder = !!(N1Percent < Math.floor(N1Idle) - 1 && engineState === 2);

  return (
    <>
      <g id={`SD-ignition-border-${engine}`}>
        {ignition && showBorder && (
          <>
            <path className="White SW2" d={`m ${x - 63} ${y + 97} l 0,-127 l 120,0 l 0,127`} />
            <path className="White SW2" d={`m ${x - 63} ${y + 458} l 0,127 l 120,0 l 0,-127`} />
          </>
        )}
      </g>
    </>
  );
};

export default IgnitionBorder;
