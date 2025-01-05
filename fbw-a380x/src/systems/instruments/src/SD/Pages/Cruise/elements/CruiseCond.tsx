import React from 'react';
import { useSimVar } from '@instruments/common/simVars';

export const CruiseCond = () => {
  const [cockpitCabinTemp] = useSimVar('L:A32NX_COND_CKPT_TEMP', 'celsius', 1000);

  const [fwdCargoTemp] = useSimVar('L:A32NX_COND_CARGO_FWD_TEMP', 'celsius', 1000);
  const [aftCargoTemp] = useSimVar('L:A32NX_COND_CARGO_BULK_TEMP', 'celsius', 1000);

  return (
    <>
      <text className="F22 Cyan" x="19" y="506">
        °C
      </text>
      <text id="CockpitTemp" className="F29 Green EndAlign" x="109" y="528">
        {cockpitCabinTemp.toFixed(0)}
      </text>

      <CabinTemperatures />

      {/* Cargo Temps */}
      <text id="fwdCargoTemp" className="F29 Green EndAlign" x="178" y="595">
        {fwdCargoTemp.toFixed(0)}
      </text>
      <text id="AftCargoTemp" className="F29 Green EndAlign" x="378" y="595">
        {aftCargoTemp.toFixed(0)}
      </text>
    </>
  );
};

const CabinTemperatures = () => {
  const mainCabinZones = [
    'MAIN_DECK_1',
    'MAIN_DECK_2',
    'MAIN_DECK_3',
    'MAIN_DECK_4',
    'MAIN_DECK_5',
    'MAIN_DECK_6',
    'MAIN_DECK_7',
    'MAIN_DECK_8',
  ];

  const upperCabinZones = [
    'UPPER_DECK_1',
    'UPPER_DECK_2',
    'UPPER_DECK_3',
    'UPPER_DECK_4',
    'UPPER_DECK_5',
    'UPPER_DECK_6',
    'UPPER_DECK_7',
  ];

  let [minMainDeckTemp] = useSimVar(`L:A32NX_COND_MAIN_DECK_1_TEMP`, 'celsius', 1000);
  let maxMainDeckTemp = minMainDeckTemp;

  for (const zone of mainCabinZones) {
    const [temperature] = useSimVar(`L:A32NX_COND_${zone}_TEMP`, 'celsius', 1000);
    if (temperature > maxMainDeckTemp) {
      maxMainDeckTemp = temperature;
    } else if (temperature < minMainDeckTemp) {
      minMainDeckTemp = temperature;
    }
  }

  let [minUpperDeckTemp] = useSimVar(`L:A32NX_COND_UPPER_DECK_1_TEMP`, 'celsius', 1000);
  let maxUpperDeckTemp = minUpperDeckTemp;

  for (const zone of upperCabinZones) {
    const [temperature] = useSimVar(`L:A32NX_COND_${zone}_TEMP`, 'celsius', 1000);
    if (temperature > maxUpperDeckTemp) {
      maxUpperDeckTemp = temperature;
    } else if (temperature < minUpperDeckTemp) {
      minUpperDeckTemp = temperature;
    }
  }

  return (
    <>
      <text id="ForwardUpperTemp" className="F29 Green EndAlign" x="210" y="506">
        {minUpperDeckTemp.toFixed(0)}
      </text>
      <text className="F24 White LS2" x="239" y="506">
        TO
      </text>
      <text id="AftUpperTemp" className="F29 Green EndAlign" x="340" y="506">
        {maxUpperDeckTemp.toFixed(0)}
      </text>

      <text id="ForwardLowerTemp" className="F29 Green EndAlign" x="210" y="552">
        {minMainDeckTemp.toFixed(0)}
      </text>
      <text className="F24 White LS2" x="239" y="552">
        TO
      </text>
      <text id="AftLowerTemp" className="F29 Green EndAlign" x="340" y="552">
        {maxMainDeckTemp.toFixed(0)}
      </text>
    </>
  );
};

export default CruiseCond;
