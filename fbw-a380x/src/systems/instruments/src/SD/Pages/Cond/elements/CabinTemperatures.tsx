import React from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Position } from '@instruments/common/types';
import { Triangle } from '@instruments/common/Shapes';

const CabinTemperatures: React.FC<Position> = ({ x, y }) => {
  const [cockpitCabinTemp] = useSimVar('L:A32NX_COND_CKPT_TEMP', 'celsius', 1000);

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
      <text x={x} y={y + 82} className="F26 Green">
        {cockpitCabinTemp.toFixed(0)}
      </text>
      <text x={x + 321} y={y} className="F26 Green">
        {minUpperDeckTemp.toFixed(0)}
      </text>
      <text x={x + 433} y={y} className="F26 Green">
        {maxUpperDeckTemp.toFixed(0)}
      </text>
      <text x={x + 308} y={y + 97} className="F26 Green">
        {minMainDeckTemp.toFixed(0)}
      </text>
      <text x={x + 417} y={y + 97} className="F26 Green">
        {maxMainDeckTemp.toFixed(0)}
      </text>

      <TemperatureController x={x + 615} y={y - 138} />
      <CabinZoneWarningGroup x={190} y={90} />
    </>
  );
};

const TemperatureController: React.FC<Position> = ({ x, y }) => {
  const [taddChannel1Failure] = useSimVar('L:A32NX_COND_TADD_CHANNEL_1_FAILURE', 'bool', 1000);
  const [taddChannel2Failure] = useSimVar('L:A32NX_COND_TADD_CHANNEL_2_FAILURE', 'bool', 1000);

  const noFailure = !taddChannel1Failure && !taddChannel2Failure;

  return (
    <g id="TemperatureControl" className={noFailure ? 'Hide' : 'Show'}>
      <text x={x} y={y} className="White F23 MiddleAlign">
        TEMP CTL
      </text>
      <text x={x - 20} y={y + 25} className={`${taddChannel1Failure ? 'Amber' : 'Green'} F23 MiddleAlign`}>
        1
      </text>
      <text x={x + 20} y={y + 25} className={`${taddChannel2Failure ? 'Amber' : 'Green'} F23 MiddleAlign`}>
        2
      </text>

      <path className={'White Line'} d={`M${x - 10},${y + 15} l 0,22 l -25,0`} fill={'none'} />
      <path className={'White Line'} d={`M${x + 30},${y + 15} l 0,22 l -25,0`} fill={'none'} />
    </g>
  );
};

const CabinZoneWarningGroup: React.FC<Position> = ({ x, y }) => {
  return (
    <g id="CabinZoneWarningGroup">
      <CabinZoneWarning x={x} y={y} zone="UPPER_DECK_1" />
      <CabinZoneWarning x={x + 80} y={y} zone="UPPER_DECK_2" />
      <CabinZoneWarning x={x + 80 * 2} y={y} zone="UPPER_DECK_3" />
      <CabinZoneWarning x={x + 80 * 3} y={y} zone="UPPER_DECK_4" />
      <CabinZoneWarning x={x + 80 * 4} y={y} zone="UPPER_DECK_5" />
      <CabinZoneWarning x={x + 80 * 5} y={y} zone="UPPER_DECK_6" />
      <CabinZoneWarning x={x + 80 * 6} y={y} zone="UPPER_DECK_7" />

      <CabinZoneWarning x={x - 10} y={y + 100} zone="MAIN_DECK_1" />
      <CabinZoneWarning x={x + 60} y={y + 100} zone="MAIN_DECK_2" />
      <CabinZoneWarning x={x + 71 * 2 - 10} y={y + 100} zone="MAIN_DECK_3" />
      <CabinZoneWarning x={x + 71 * 3 - 10} y={y + 100} zone="MAIN_DECK_4" />
      <CabinZoneWarning x={x + 71 * 4 - 10} y={y + 100} zone="MAIN_DECK_5" />
      <CabinZoneWarning x={x + 71 * 5 - 10} y={y + 100} zone="MAIN_DECK_6" />
      <CabinZoneWarning x={x + 71 * 6 - 10} y={y + 100} zone="MAIN_DECK_7" />
      <CabinZoneWarning x={x + 71 * 7 - 10} y={y + 100} zone="MAIN_DECK_8" />
    </g>
  );
};

interface CabinZoneWarningProps {
  x: number;
  y: number;
  zone: string;
}

const CabinZoneWarning: React.FC<CabinZoneWarningProps> = ({ x, y, zone }) => {
  // TODO: Replace with actual LVars when failures are simulated
  const ductOverheat = false;
  const trimAirFailure = false;

  return (
    <g id={`CabinZoneWarning-${zone}`}>
      <g id={`TrimAirFailure-${zone}`} className={trimAirFailure ? 'Show' : 'Hide'}>
        <text x={x} y={y} className="Amber F22">
          H
        </text>
        <Triangle x={x + 25} y={y} colour="Amber" fill={0} orientation={180} scale={1} />
      </g>
      <text x={x - 12} y={y + 25} className={`Amber F22 ${ductOverheat ? 'Show' : 'Hide'}`}>
        OVHT
      </text>
    </g>
  );
};

export default CabinTemperatures;
