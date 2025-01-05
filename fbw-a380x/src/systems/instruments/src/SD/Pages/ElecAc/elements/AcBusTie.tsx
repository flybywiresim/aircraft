import { useSimVar } from '@instruments/common/simVars';
import React, { FC } from 'react';

export const AcBusTie: FC = () => {
  const [btc1Closed] = useSimVar('L:A32NX_ELEC_CONTACTOR_980XU1_IS_CLOSED', 'bool', 500);
  const [btc2Closed] = useSimVar('L:A32NX_ELEC_CONTACTOR_980XU2_IS_CLOSED', 'bool', 500);
  const [btc3Closed] = useSimVar('L:A32NX_ELEC_CONTACTOR_980XU3_IS_CLOSED', 'bool', 500);
  const [btc4Closed] = useSimVar('L:A32NX_ELEC_CONTACTOR_980XU4_IS_CLOSED', 'bool', 500);
  const [sicClosed] = useSimVar('L:A32NX_ELEC_CONTACTOR_900XU_IS_CLOSED', 'bool', 500);
  const [apuLcAClosed] = useSimVar('L:A32NX_ELEC_CONTACTOR_990XS1_IS_CLOSED', 'bool', 500);
  const [apuLcBClosed] = useSimVar('L:A32NX_ELEC_CONTACTOR_990XS2_IS_CLOSED', 'bool', 500);

  const showBtc1 = btc1Closed && (btc2Closed || apuLcAClosed || sicClosed);
  const showBtc2 = btc2Closed && (btc1Closed || apuLcAClosed || sicClosed);
  const showBtc3 = btc3Closed && (btc4Closed || apuLcBClosed || sicClosed);
  const showBtc4 = btc4Closed && (btc3Closed || apuLcBClosed || sicClosed);

  const showBtc1ToBtc2 = btc1Closed && (btc2Closed || apuLcAClosed || sicClosed);
  const showBtc3ToBtc4 = btc4Closed && (btc3Closed || apuLcBClosed || sicClosed);

  const showBtc2ToAgc1 = (btc1Closed || btc2Closed) && (apuLcAClosed || sicClosed);
  const showBtc3ToAgc2 = (btc3Closed || btc4Closed) && (apuLcBClosed || sicClosed);

  return (
    <g id="ac-tie" transform="translate(0 0)">
      <path id="ac1-to-btc1" className={`Green SW2 ${showBtc1 ? '' : 'Hide'}`} d="M 140,258l 0,-60" />
      <path id="ac2-to-btc2" className={`Green SW2 ${showBtc2 ? '' : 'Hide'}`} d="M 234,258l 0,-60" />
      <path id="ac3-to-btc3" className={`Green SW2 ${showBtc3 ? '' : 'Hide'}`} d="M 535,258l 0,-60" />
      <path id="ac4-to-btc4" className={`Green SW2 ${showBtc4 ? '' : 'Hide'}`} d="M 629,258l 0,-60" />

      <path id="btc1-to-btc2" className={`Green SW2 ${showBtc1ToBtc2 ? '' : 'Hide'}`} d="M 140,198 l 94,0" />
      <path id="btc3-to-btc4" className={`Green SW2 ${showBtc3ToBtc4 ? '' : 'Hide'}`} d="M 535,198 l 94,0" />

      <path id="btc2-to-agc1" className={`Green SW2 ${showBtc2ToAgc1 ? '' : 'Hide'}`} d="M 234,198 l 103,0" />
      <path id="btc3-to-agc2" className={`Green SW2 ${showBtc3ToAgc2 ? '' : 'Hide'}`} d="M 432,198 l 103,0" />

      <path id="sic" className={`Green SW2 ${sicClosed ? '' : 'Hide'}`} d="M 337,198 l 95,0" />
    </g>
  );
};
