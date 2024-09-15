import { useSimVar } from '@instruments/common/simVars';
import React, { FC } from 'react';

interface AcEssFeedLineProps {
  side: 1 | 2;
}

export const AcEssFeedLine: FC<AcEssFeedLineProps> = ({ side }) => {
  // TODO This contactor is not yet implemented.
  // const [pepdcToEmerPwrCtrCtorClosed] = useSimVar(`L:A32NX_ELEC_CONTACTOR_993XC${side}_IS_CLOSED`, 'bool', 500);
  const [acEssBusSwitchingCtorClosed] = useSimVar(`L:A32NX_ELEC_CONTACTOR_3XC${side}_IS_CLOSED`, 'bool', 500);

  return (
    <g
      id={`ac-normal-to-acess-feed-${side}`}
      className={acEssBusSwitchingCtorClosed ? 'Show' : 'Hide'}
      transform="translate(0 0)"
    >
      <path
        className="Green SW2 NoFill"
        d={`M ${side === 1 ? '111' : '658'} 258 l 0 -102 l ${side === 1 ? '' : '-'}205 0`}
      />
    </g>
  );
};
