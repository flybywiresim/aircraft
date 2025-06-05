import { useSimVar } from '@instruments/common/simVars';
import React from 'react';

type EngineProps = {
  x: number;
  y: number;
  engineNumber: 1 | 2 | 3 | 4;
};

export const Engine = ({ x, y, engineNumber }: EngineProps) => {
  const isInnerEngine = engineNumber === 2 || engineNumber === 3;
  const hydSystem = engineNumber <= 2 ? 'GREEN' : 'YELLOW';
  const pumpIndex = (engineNumber - 1) * 2 + 1 - (engineNumber <= 2 ? 0 : 4);

  const [engineState] = useSimVar(`L:A32NX_ENGINE_N3:${engineNumber}`, 'number', 500);
  const isRunning = engineState > 50;

  const [reservoirLowLevel] = useSimVar(
    `L:A32NX_HYD_${engineNumber <= 2 ? 'GREEN' : 'YELLOW'}_RESERVOIR_LEVEL_IS_LOW`,
    'boolean',
    500,
  );

  const [pumpDisconnect] = useSimVar(`L:A32NX_HYD_ENG_${engineNumber}AB_PUMP_DISC`, 'boolean', 500);

  const [pumpAPressureSwitch] = useSimVar(
    `L:A32NX_HYD_${hydSystem}_PUMP_${pumpIndex}_SECTION_PRESSURE_SWITCH`,
    'boolean',
    500,
  );
  const [pumpAPbIsAuto] = useSimVar(`L:A32NX_OVHD_HYD_ENG_${engineNumber}A_PUMP_PB_IS_AUTO`, 'boolean', 500);

  const [pumpBPressureSwitch] = useSimVar(
    `L:A32NX_HYD_${hydSystem}_PUMP_${pumpIndex + 1}_SECTION_PRESSURE_SWITCH`,
    'boolean',
    500,
  );
  const [pumpBPbIsAuto] = useSimVar(`L:A32NX_OVHD_HYD_ENG_${engineNumber}B_PUMP_PB_IS_AUTO`, 'boolean', 500);

  const [fireValveOpen] = useFireValveOpenState(engineNumber);

  const pumpToLabelColor =
    pumpDisconnect || ((!pumpAPressureSwitch || !pumpAPbIsAuto) && (!pumpBPressureSwitch || !pumpBPbIsAuto))
      ? 'Amber'
      : 'Green';

  return (
    <g transform={`translate(${x} ${y})`}>
      <image xlinkHref="/Images/fbw-a380x/HYD_8-7_TRIMMED.png" x={0} y={0} width={146} height={211} />

      <text x={10} y={47} className={`${!isRunning ? 'Amber' : 'White'} F35`}>
        {engineNumber}
      </text>

      <EnginePump
        x={28}
        y={67}
        label="A"
        lowPressure={!pumpAPressureSwitch}
        pbAuto={pumpAPbIsAuto}
        disconnected={pumpDisconnect}
      />
      <EnginePump
        x={80}
        y={67}
        label="B"
        lowPressure={!pumpBPressureSwitch}
        pbAuto={pumpBPbIsAuto}
        disconnected={pumpDisconnect}
      />

      <FireShutoffValve x={56} y={164} isOpen={fireValveOpen} reservoirLowLevel={reservoirLowLevel} />

      <path d={`m 73 65 v ${isInnerEngine ? -123 : -165}`} className={`${pumpToLabelColor} SW4 LineRound`} />
    </g>
  );
};

function useFireValveOpenState(engineNumber: 1 | 2 | 3 | 4): [boolean] {
  // In the hydraulics simulation, there's one fire valve per engine pump, i.e 2 per engine. But there's only one symbol on the ECAM.
  // So we show the ECAM symbol closed only if the fire valves on both pumps are closed

  const [isFireValveAOpen] = useSimVar(
    `L:A32NX_HYD_${engineNumber <= 2 ? 'GREEN' : 'YELLOW'}_PUMP_${1 + 2 * ((engineNumber - 1) % 2)}_FIRE_VALVE_OPENED`,
    'boolean',
    1000,
  ); // 1, 3, 1, 3
  const [isFireValveBOpen] = useSimVar(
    `L:A32NX_HYD_${engineNumber <= 2 ? 'GREEN' : 'YELLOW'}_PUMP_${2 + 2 * ((engineNumber - 1) % 2)}_FIRE_VALVE_OPENED`,
    'boolean',
    1000,
  ); // 2, 4, 2, 4

  return [isFireValveAOpen || isFireValveBOpen];
}

type EnginePumpProps = {
  x: number;
  y: number;
  label: 'A' | 'B';
  lowPressure: boolean;
  pbAuto: boolean;
  disconnected: boolean;
};

const EnginePump = ({ x, y, label, lowPressure, pbAuto, disconnected }: EnginePumpProps) => {
  const size = 39;
  const isMirrored = label === 'B';

  const color = !lowPressure && pbAuto && !disconnected ? 'Green' : 'Amber';

  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={0} y={0} width={size} height={size} className={`${color} NoFill SW4`} />
      {pbAuto && !disconnected && !lowPressure && (
        <line className={`${color} SW4`} x1={size / 2} y1={0} x2={size / 2} y2={size} />
      )}
      {(!pbAuto || disconnected) && (
        <line className="Amber SW4 LineRound" x1={8} y1={size / 2} x2={size - 8} y2={size / 2} />
      )}
      {pbAuto && !disconnected && lowPressure && (
        <text x={5} y={30} className="Amber F25 TextOutline2">
          LO
        </text>
      )}
      <text x={isMirrored ? size + 5 : -20} y={31} className="White F28 TextOutline2">
        {label}
      </text>
      {disconnected && (
        <text x={isMirrored ? 0 : -19} y={size + 25} className="Amber F24">
          DISC
        </text>
      )}
    </g>
  );
};

type FireShutoffValveProps = {
  x: number;
  y: number;
  isOpen: boolean;
  reservoirLowLevel: boolean;
};

const FireShutoffValve = ({ x, y, isOpen, reservoirLowLevel }: FireShutoffValveProps) => {
  const radius = 17;

  const color = isOpen && !reservoirLowLevel ? 'Green' : 'Amber';

  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx={radius} cy={radius} r={radius} className={`${color} NoFill SW4`} />
      {isOpen ? (
        <line x1={radius} y1={0} x2={radius} y2={2 * radius} className={`${color} SW4`} />
      ) : (
        <line x1={0} y1={radius} x2={2 * radius} y2={radius} className={`${color} SW4`} />
      )}
      <path d="m 17 -55 v 54" className={`${color} SW4 LineRound`} />
    </g>
  );
};
