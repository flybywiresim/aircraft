import { useSimVar } from '@instruments/common/simVars';
import React, { FC } from 'react';

export const Ac23BusTie: FC = () => {
  const [btc5Closed] = useSimVar('L:A32NX_ELEC_CONTACTOR_980XU5_IS_CLOSED', 'bool', 500);
  const [btc6Closed] = useSimVar('L:A32NX_ELEC_CONTACTOR_980XU6_IS_CLOSED', 'bool', 500);

  return (
    <g id="ac2-to-ac3-tie" className={btc5Closed && btc6Closed ? 'Show' : 'Hide'} transform="translate(0 0)">
      <path className="Green SW2" d="M 234, 275 l 248, 0" />
    </g>
  );
};
