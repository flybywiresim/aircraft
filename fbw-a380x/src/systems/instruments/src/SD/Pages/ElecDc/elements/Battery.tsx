import { useSimVar } from '@instruments/common/simVars';
import React, { FC } from 'react';
import { DcElecBus } from './BusBar';

const BAT_VOLTAGE_NORMAL_RANGE_UNLOADED = 25;
const BAT_VOLTAGE_NORMAL_RANGE_LOADED = 20;
const BAT_CURRENT_NORMAL_RANGE = -5;

interface BatteryProps {
  x: number;
  y: number;
  bus: DcElecBus;
}

export const Battery: FC<BatteryProps> = ({ x, y, bus }) => {
  let title: string;
  let lvarName: string;
  if (bus <= 2) {
    title = `BAT ${bus}`;
    lvarName = `${bus}`;
  } else if (bus === DcElecBus.DcEssBus) {
    title = 'ESS BAT';
    lvarName = 'ESS';
  } else {
    title = 'APU BAT';
    lvarName = 'APU';
  }

  const [potential] = useSimVar(`L:A32NX_ELEC_BAT_${bus}_POTENTIAL`, 'volts', 500);
  const [current] = useSimVar(`L:A32NX_ELEC_BAT_${bus}_CURRENT`, 'volts', 500);
  const [batPbAuto] = useSimVar(`L:A32NX_OVHD_ELEC_BAT_${lvarName}_PB_IS_AUTO`, 'bool', 500);

  let batCurrentNormal: boolean;
  let batVoltageNormal: boolean;
  if (bus !== DcElecBus.DcApu) {
    batCurrentNormal = current > BAT_CURRENT_NORMAL_RANGE;
    batVoltageNormal =
      potential >= BAT_VOLTAGE_NORMAL_RANGE_LOADED && (potential > BAT_VOLTAGE_NORMAL_RANGE_UNLOADED || current <= 0);
  } else {
    // TODO Implement special case for APU BAT normal range, depends on if the APU is starting.
    batCurrentNormal = true;
    batVoltageNormal = true;
  }

  return (
    <g id={`bat-${bus}-indication-box`} transform={`translate(${x} ${y})`}>
      <path className="LightGrey SW3 NoFill" d="M 0,0 l 0,107 l 127,0 l 0,-107 z" />
      <text
        x={65}
        y={22}
        className={`F25 MiddleAlign ${batCurrentNormal && batVoltageNormal && batPbAuto ? 'White' : 'Amber'} LS1 WS-8`}
      >
        {title}
      </text>
      <g className={batPbAuto ? 'Show' : 'Hide'}>
        <g>
          <text className="Cyan F22" x={77} y={63}>
            V
          </text>
          <text className="Cyan F22" x={77} y={97}>
            A
          </text>
        </g>
        {/* Voltage */}
        <text x={73} y={62} className={`F28 EndAlign ${batVoltageNormal ? 'Green' : 'Amber'} LS1`}>
          {Math.round(potential)}
        </text>
        {/* Current */}
        <text x={73} y={97} className={`F28 EndAlign ${batCurrentNormal ? 'Green' : 'Amber'} LS1`}>
          {Math.round(current)}
        </text>
      </g>
      <text className={`White F25 ${!batPbAuto ? 'Show' : 'Hide'}`} x={44} y={75}>
        OFF
      </text>
    </g>
  );
};
