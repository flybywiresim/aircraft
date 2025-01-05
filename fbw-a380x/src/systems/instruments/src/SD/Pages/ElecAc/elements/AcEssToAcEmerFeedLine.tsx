import { useSimVar } from '@instruments/common/simVars';
import React, { FC } from 'react';

export const AcEssToAcEmerFeedLine: FC = () => {
  const [emerBusCtorClosed] = useSimVar('L:A32NX_ELEC_CONTACTOR_3XB.1_IS_CLOSED', 'bool', 500);

  return (
    <g id="acess-to-acemer-feed" className={emerBusCtorClosed ? 'Show' : 'Hide'} transform="translate(0 0)">
      <path className="Green SW2" d="M 385 137 l 0 -72" />
    </g>
  );
};
