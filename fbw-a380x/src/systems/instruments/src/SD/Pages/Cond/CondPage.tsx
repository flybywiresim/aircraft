import React from 'react';
import { useArinc429Var, usePersistentProperty, useSimVar } from '@flybywiresim/fbw-sdk';
import { PageTitle } from '../Generic/PageTitle';
import A380Cond from './elements/A380Cond';
import CabinTemperatures from './elements/CabinTemperatures';
import CargoTemperatures from './elements/CargoTemperatures';
import ExtractValve from 'instruments/src/SD/Pages/Press/elements/ExtractValve';
import CondHotAir from './elements/CondHotAir';
import CondPack from './elements/CondPack';
import { CondFan } from './elements/CondFan';
import AvionicsVentilation from './elements/AvionicsVentilation';

import '../../../index.scss';

export const CondPage = () => {
  const [unit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');

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

  const fwdIsolationValveOpen = vcsDiscreteWordToUse.bitValueOr(14, false);
  const bulkIsolationValveOpen = vcsDiscreteWordToUse.bitValueOr(16, false);
  const [cabinExtractValveOpen] = useSimVar('L:A32NX_VENT_OVERPRESSURE_RELIEF_VALVE_IS_OPEN', 'bool', 100);
  // TODO: Replace with signal from systems once implemented
  const [ramAirIsOpen] = useSimVar('L:A32NX_OVHD_COND_RAM_AIR_PB_IS_ON', 'bool', 100);

  return (
    <>
      <PageTitle x={6} y={29}>
        COND
      </PageTitle>
      <text className="F24 Cyan" x={100} y={34}>
        {unit === '1' ? '°C' : '°F'}
      </text>

      <A380Cond />
      <CabinTemperatures x={65} y={158} />
      <CargoTemperatures x={250} y={360} />
      <AvionicsVentilation x={49} y={313} />

      {/* Fwd Cargo Isol Valve */}
      <ExtractValve
        x={248}
        y={408}
        value={fwdIsolationValveOpen}
        min={0}
        max={3}
        radius={42}
        css={fwdIsolationValveOpen ? 'Green Line' : 'Amber Line'}
        circleCss={`${fwdIsolationValveOpen ? 'Green' : 'Amber'} SW3 BackgroundFill`}
      />
      {/* Bulk Cargo Isol Valve */}
      <ExtractValve
        x={548}
        y={408}
        value={bulkIsolationValveOpen}
        min={0}
        max={3}
        radius={42}
        css={bulkIsolationValveOpen ? 'Green Line' : 'Amber Line'}
        circleCss={`${bulkIsolationValveOpen ? 'Green' : 'Amber'} SW3 BackgroundFill`}
      />
      {/* Cabin Air Extract Valve */}
      <ExtractValve
        x={724}
        y={97}
        value={cabinExtractValveOpen}
        min={0}
        max={1}
        radius={42}
        startAngle={172}
        endAngle={140}
      />
      {/* RAM Air 1 */}
      <ExtractValve x={327} y={512} value={ramAirIsOpen} min={0} max={1} radius={42} startAngle={270} endAngle={240} />
      {/* RAM Air 2 */}
      <ExtractValve x={505} y={512} value={ramAirIsOpen} min={0} max={1} radius={42} startAngle={270} endAngle={240} />
      {/* Avionics Overboard Valve */}
      <ExtractValve x={96} y={457} value={0} min={0} max={3} radius={42} />
      {/* Avionics Extract Valve */}
      <ExtractValve x={154} y={446} value={0} min={0} max={1} radius={42} startAngle={90} endAngle={180} />

      <CondHotAir x={300} y={649} hotAir={1} />
      <CondHotAir x={490} y={649} hotAir={2} />

      <CondPack x={200} y={600} pack={1} />
      <CondPack x={580} y={600} pack={2} />

      <CondFan />
    </>
  );
};
