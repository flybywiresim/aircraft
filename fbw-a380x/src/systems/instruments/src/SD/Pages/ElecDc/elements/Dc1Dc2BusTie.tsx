import { useSimVar } from '@instruments/common/simVars';
import React, { FC } from 'react';

export const Dc1Dc2BusTie: FC = () => {
  const [iblc2Closed] = useSimVar('L:A32NX_ELEC_CONTACTOR_980PC_IS_CLOSED', 'bool', 500);

  return (
    <g id="dc1-to-dc2-tie" className={iblc2Closed ? 'Show' : 'Hide'} transform="translate(0 0)">
      <path
        className="Green SW2 NoFill"
        d="M 145,384 l 60,0 m-10,10 l 20,-20 m -10,10 m 60,0 m-10,10 l 20,-20 m -10,10 l 132,0"
      />
    </g>
  );
};
