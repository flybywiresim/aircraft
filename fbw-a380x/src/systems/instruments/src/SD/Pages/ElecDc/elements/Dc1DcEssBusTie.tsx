import { useSimVar } from '@instruments/common/simVars';
import React, { FC } from 'react';

export const Dc1DcEssBusTie: FC = () => {
  const [iblc1Closed] = useSimVar('L:A32NX_ELEC_CONTACTOR_6PC2_IS_CLOSED', 'bool', 500);

  return (
    <g id="dc1-to-dc-ess-tie" className={iblc1Closed ? 'Show' : 'Hide'} transform="translate(0 0)">
      <path className="Green SW2 NoFill" d="M 120,367 l 0,-80 l 49,0" />
    </g>
  );
};
