import React from 'react';
import { Reservoir } from './Reservoir';
import { Engine } from 'instruments/src/SD/Pages/Hyd/elements/Engine';
import { useSimVar } from '@instruments/common/simVars';

type HydraulicSystemProps = {
  label: 'GREEN' | 'YELLOW';
};

export const HydraulicSystem = ({ label }: HydraulicSystemProps) => {
  const isLeftSide = label === 'GREEN';

  return (
    <g>
      <Engine x={isLeftSide ? 8 : 612} y={231} engineNumber={isLeftSide ? 1 : 4} />

      <Engine x={isLeftSide ? 165 : 457} y={189} engineNumber={isLeftSide ? 2 : 3} />

      <Reservoir x={isLeftSide ? 72 : 676} y={467} side={label} />

      <SystemLabel x={isLeftSide ? 38 : 500} y={isLeftSide ? 92 : 94} label={label} />
    </g>
  );
};

type SystemLabelProps = {
  x: number;
  y: number;
  label: 'GREEN' | 'YELLOW';
};
const SystemLabel = ({ x, y, label }: SystemLabelProps) => {
  const isGreen = label === 'GREEN';

  const [pressure] = useSimVar(`L:A32NX_HYD_${label}_SYSTEM_1_SECTION_PRESSURE`, 'psi', 1000);
  const [systemPressureSwitch] = useSimVar(`L:A32NX_HYD_${label}_SYSTEM_1_SECTION_PRESSURE_SWITCH`, 'boolean', 500);

  const pressureNearest100 = pressure >= 200 ? Math.round(pressure / 100) * 100 : 0;

  const transducerColor = pressureNearest100 > 2900 ? 'Green' : 'Amber';
  const pressureSwitchColor = systemPressureSwitch ? 'Green' : 'Amber';

  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="m 114 -31 l 12 20 l -24 0 z" className={`${pressureSwitchColor} SW3 NoFill LineJoinRound`} />
      <rect x={0} y={0} width={228} height={isGreen ? 38 : 36} className={`${pressureSwitchColor} NoFill SW3`} />
      <text x={7} y={29} className={`${systemPressureSwitch ? 'White' : 'Amber'} F23`}>
        {label}
      </text>
      <text x={isGreen ? 172 : 179} y={31} textAnchor="end" className={`${transducerColor} F30`}>
        {pressureNearest100}
      </text>
      <text x={isGreen ? 175 : 181} y={29} className="Cyan F23">
        PSI
      </text>

      <ElecPump
        x={isGreen ? 258 : -26}
        y={isGreen ? 4 : 3}
        label="A"
        side={label}
        systemPressureSwitch={systemPressureSwitch}
      />
      <ElecPump
        x={isGreen ? 258 : -26}
        y={isGreen ? 36 : 34}
        label="B"
        side={label}
        systemPressureSwitch={systemPressureSwitch}
      />
    </g>
  );
};

type ElecPumpProps = {
  x: number;
  y: number;
  label: 'A' | 'B';
  side: 'GREEN' | 'YELLOW';
  systemPressureSwitch: boolean;
};
const ElecPump = ({ x, y, label, side, systemPressureSwitch }: ElecPumpProps) => {
  const isGreen = side === 'GREEN';

  const [engine1N3] = useSimVar('L:A32NX_ENGINE_N3:1', 'number', 500);
  const [engine2N3] = useSimVar('L:A32NX_ENGINE_N3:2', 'number', 500);
  const [engine3N3] = useSimVar('L:A32NX_ENGINE_N3:3', 'number', 500);
  const [engine4N3] = useSimVar('L:A32NX_ENGINE_N3:4', 'number', 500);
  const anyEngineIsRunning = engine1N3 > 50 || engine2N3 > 50 || engine3N3 > 50 || engine4N3 > 50;

  const [isElecPumpActive] = useSimVar(`L:A32NX_HYD_${side[0]}${label}_EPUMP_ACTIVE`, 'boolean', 1000);
  const [pumpPressureSwitch] = useSimVar(
    `L:A32NX_HYD_${side}_PUMP_${label === 'A' ? 5 : 6}_SECTION_PRESSURE_SWITCH`,
    'boolean',
    500,
  );
  const [offPbIsAuto] = useSimVar(`L:A32NX_OVHD_HYD_EPUMP${side[0]}${label}_OFF_PB_IS_AUTO`, 'boolean', 1000);
  const [isOverheat] = useSimVar(`L:A32NX_HYD_${side[0]}${label}_EPUMP_OVHT`, 'boolean', 500);

  let triangleColor = '';
  if (offPbIsAuto && !isElecPumpActive) {
    triangleColor = 'White';
  } else if (!offPbIsAuto || !pumpPressureSwitch) {
    triangleColor = 'Amber';
  } else if (offPbIsAuto && isElecPumpActive && pumpPressureSwitch) {
    triangleColor = 'Green';
  }

  return (
    <g transform={`translate(${x} ${y})`} className={anyEngineIsRunning ? 'Hide' : ''}>
      <text x={isGreen ? 21 : -35} y={10} className={`F25 ${triangleColor === 'Amber' ? 'Amber' : 'White'}`}>
        {label}
      </text>
      <path
        d={`m 0 0 l ${isGreen ? '' : '-'}13 -9 l 0 18 z`}
        className={`${triangleColor} ${isElecPumpActive ? `${triangleColor}Fill` : ''} SW3`}
      />
      <path
        d={`m 0 0 h ${isGreen ? '-30' : '27'}`}
        className={`${triangleColor} SW2 ${isElecPumpActive && systemPressureSwitch ? '' : 'Hide'}`}
      />
      <text x={-14} y={label === 'A' ? -14 : 34} className={isOverheat ? 'Amber F19' : 'Hide'}>
        OVHT
      </text>
    </g>
  );
};
