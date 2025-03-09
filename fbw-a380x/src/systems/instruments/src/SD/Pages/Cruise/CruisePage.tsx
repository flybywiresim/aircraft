import React from 'react';
import { usePersistentProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';
import { fuelForDisplay } from '@instruments/common/FuelFunctions';
import { PageTitle } from '../Generic/PageTitle';
import A380XCruise from './elements/A380Cruise';
import CruisePressure from './elements/CruisePressure';
import CruiseCond from './elements/CruiseCond';

import '../../../index.scss';
import { NXUnits } from '@flybywiresim/fbw-sdk';

export const CruisePage = () => {
  const [unit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');
  const [engine1FuelUsed] = useSimVar('L:A32NX_FUEL_USED:1', 'number', 1000);
  const [engine2FuelUsed] = useSimVar('L:A32NX_FUEL_USED:2', 'number', 1000);
  const [engine3FuelUsed] = useSimVar('L:A32NX_FUEL_USED:3', 'number', 1000);
  const [engine4FuelUsed] = useSimVar('L:A32NX_FUEL_USED:4', 'number', 1000);

  const engine1FuelUsedDisplay = fuelForDisplay(engine1FuelUsed, unit, 1, 5);
  const engine2FuelUsedDisplay = fuelForDisplay(engine2FuelUsed, unit, 1, 5);
  const engine3FuelUsedDisplay = fuelForDisplay(engine3FuelUsed, unit, 1, 5);
  const engine4FuelUsedDisplay = fuelForDisplay(engine4FuelUsed, unit, 1, 5);

  const engineTotalFuelUsedDisplay =
    engine1FuelUsedDisplay + engine2FuelUsedDisplay + engine3FuelUsedDisplay + engine4FuelUsedDisplay;

  const [engine1FuelFlow] = useSimVar('L:A32NX_ENGINE_FF:1', 'number', 1000); // KG/HR
  const [engine2FuelFlow] = useSimVar('L:A32NX_ENGINE_FF:2', 'number', 1000);
  const [engine3FuelFlow] = useSimVar('L:A32NX_ENGINE_FF:3', 'number', 1000);
  const [engine4FuelFlow] = useSimVar('L:A32NX_ENGINE_FF:4', 'number', 1000);

  const engine1FuelFlowDisplay = fuelForDisplay(engine1FuelFlow, unit);
  const engine2FuelFlowDisplay = fuelForDisplay(engine2FuelFlow, unit);
  const engine3FuelFlowDisplay = fuelForDisplay(engine3FuelFlow, unit);
  const engine4FuelFlowDisplay = fuelForDisplay(engine4FuelFlow, unit);

  // TODO Degraded accuracy indication for fuel flow and used

  return (
    <>
      <PageTitle x={6} y={29}>
        CRUISE
      </PageTitle>
      <A380XCruise />

      {/* Fuel Flow */}
      <text className="F29 Underline White" x={15} y={80}>
        FUEL
      </text>
      <path className="White SW3" d="M130,117 l 27,0" />
      <path className="White SW3" d="M285,117 l 27,0" />
      <path className="White SW3" d="M451,117 l 27,0" />
      <path className="White SW3" d="M601,117 l 27,0" />

      <text className="F29 LS1 EndAlign Green" x={112} y={127}>
        {engine1FuelFlowDisplay}
      </text>
      <text className="F29 LS1 EndAlign Green" x={263} y={127}>
        {engine2FuelFlowDisplay}
      </text>
      <text className="F29 LS1 EndAlign Green" x={578} y={127}>
        {engine3FuelFlowDisplay}
      </text>
      <text className="F29 LS1 EndAlign Green" x={730} y={127}>
        {engine4FuelFlowDisplay}
      </text>

      <text className="F26 MiddleAlign White" x={383} y={99}>
        FF
      </text>
      <text className="F22 MiddleAlign Cyan" x={383} y={131}>
        {NXUnits.userWeightUnit}/H
      </text>

      {/* Fuel Used */}
      <path className="White SW3" d="M134,217 l 27,0" />
      <path className="White SW3" d="M285,217 l 27,0" />
      <path className="White SW3" d="M451,217 l 27,0" />
      <path className="White SW3" d="M601,217 l 27,0" />

      <text className="F29 LS1 EndAlign Green" x={122} y={227}>
        {engine1FuelUsedDisplay}
      </text>
      <text className="F29 LS1 EndAlign Green" x={273} y={227}>
        {engine2FuelUsedDisplay}
      </text>
      <text className="F29 LS1 EndAlign Green" x={588} y={227}>
        {engine3FuelUsedDisplay}
      </text>
      <text className="F29 LS1 EndAlign Green" x={740} y={227}>
        {engine4FuelUsedDisplay}
      </text>

      <text className="F26 MiddleAlign White" x={383} y={199}>
        FU
      </text>
      <text className="F26 MiddleAlign White" x={383} y={228}>
        TOTAL
      </text>
      <text className="F29 LS1 EndAlign Green" x={428} y={265}>
        {engineTotalFuelUsedDisplay}
      </text>
      <text className="F22 MiddleAlign Cyan" x={383} y={285}>
        {NXUnits.userWeightUnit()}
      </text>

      <text className="F29 Underline White" x={18} y={330}>
        AIR
      </text>

      <CruisePressure />
      <CruiseCond />
    </>
  );
};
