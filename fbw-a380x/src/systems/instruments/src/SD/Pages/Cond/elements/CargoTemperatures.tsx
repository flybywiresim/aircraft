import React from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Position } from '@instruments/common/types';
import { useArinc429Var } from '@flybywiresim/fbw-sdk';

const CargoTemperatures: React.FC<Position> = ({ x, y }) => {
  const [fwdCargoTemp] = useSimVar('L:A32NX_COND_CARGO_FWD_TEMP', 'celsius', 1000);
  const [bulkCargoTemp] = useSimVar('L:A32NX_COND_CARGO_BULK_TEMP', 'celsius', 1000);

  const vcsB1DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B1_VCS_DISCRETE_WORD');
  const vcsB2DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B2_VCS_DISCRETE_WORD');
  const vcsB3DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B3_VCS_DISCRETE_WORD');
  const vcsB4DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B4_VCS_DISCRETE_WORD');

  let vcsDiscreteWordToUse;

  if (vcsB1DiscreteWord.isNormalOperation()) {
    vcsDiscreteWordToUse = vcsB1DiscreteWord;
  } else if (vcsB2DiscreteWord.isNormalOperation()) {
    vcsDiscreteWordToUse = vcsB2DiscreteWord;
  } else if (vcsB3DiscreteWord.isNormalOperation()) {
    vcsDiscreteWordToUse = vcsB3DiscreteWord;
  } else {
    vcsDiscreteWordToUse = vcsB4DiscreteWord;
  }

  const bulkHeaterFault = vcsDiscreteWordToUse.bitValueOr(22, true);
  // TODO: Replace with actual LVars when failures simulated
  const fwdCargoOverheat = false;
  const fwdCargoSmoke = false;
  const bulkCargoSmoke = false;

  return (
    <g id="CondCargo">
      <text x={x} y={y} className="F26 Green">
        {fwdCargoTemp.toFixed(0)}
      </text>
      <text x={x + 410} y={y} className="F26 Green">
        {bulkCargoTemp.toFixed(0)}
      </text>

      {/* Forward cargo warnings */}
      <text x={340} y={329} className={`Amber F22 MiddleAlign ${fwdCargoOverheat ? 'Show' : 'Hide'}`}>
        OVHT
      </text>
      <text x={340} y={380} className={`Red F22 MiddleAlign ${fwdCargoSmoke ? 'Show' : 'Hide'}`}>
        SMOKE
      </text>

      {/* Bulk cargo warnings */}
      <text x={680} y={329} className={`Amber F22 MiddleAlign ${bulkHeaterFault ? 'Show' : 'Hide'}`}>
        HEATER
      </text>
      <text x={640} y={380} className={`Red F22 MiddleAlign ${bulkCargoSmoke ? 'Show' : 'Hide'}`}>
        SMOKE
      </text>
    </g>
  );
};

export default CargoTemperatures;
