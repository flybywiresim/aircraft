// import { usePersistentProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';
import { EngineNumber, IgnitionActive, Position } from '@instruments/common/types';
import React, { FC } from 'react';
import DecimalValues from './DecimalValues';
import IgnitionBorder from './IgnitionBorder';
import NacelleTemperatureGauge from './NacelleTemperatureGauge';
import OilPressureGauge from './OilPressureGauge';
import OilQuantityGauge from './OilQuantityGauge';
import StartValve from './StartValve';
import { NXUnits } from '@flybywiresim/fbw-sdk';

interface EngineColumnProps {
  anyEngineRunning: boolean;
}

const EngineColumn: FC<Position & EngineNumber & IgnitionActive & EngineColumnProps> = ({
  x,
  y,
  engine,
  ignition,
  anyEngineRunning,
}) => {
  const [N2] = useSimVar(`L:A32NX_ENGINE_N2:${engine}`, 'number', 100); // TODO: Update with correct SimVars
  const [N3] = useSimVar(`L:A32NX_ENGINE_N3:${engine}`, 'number', 100); // TODO: Update with correct SimVars
  const [starterValveOpen] = useSimVar(`L:A32NX_PNEU_ENG_${engine}_STARTER_VALVE_OPEN`, 'number', 500); // TODO: Update with correct SimVars
  const starting = !!(N2 < 58.5 && ignition && starterValveOpen); // TODO Should be N3
  const [fadecManuallyPowered] = useSimVar(`L:A32NX_OVHD_FADEC_${engine}`, 'bool', 500);
  const [engineFirePbReleased] = useSimVar(`L:A32NX_FIRE_BUTTON_ENG${engine}`, 'bool', 500);

  const fadecPowered = (ignition || anyEngineRunning || fadecManuallyPowered) && !engineFirePbReleased;

  const [fuelFlow] = useSimVar(`L:A32NX_ENGINE_FF:${engine}`, 'number', 100);

  const [n1Vibration] = useSimVar(`TURB ENG VIBRATION:${engine}`, 'number', 100);
  const n2Vibration = n1Vibration;
  const n3Vibration = n1Vibration;

  const [oilQuantity] = useSimVar(`L:A32NX_ENGINE_OIL_QTY:${engine}`, 'number', 500); // TODO: Update with correct SimVars
  const [engineOilTemperature] = useSimVar(`GENERAL ENG OIL TEMPERATURE:${engine}`, 'celsius', 100); // TODO: Update with correct SimVars
  // fbw-a380x\src\wasm\fadec_a380x\src\Fadec\EngineControl_A380X.cpp
  // has all the engine oil simvars in a large section commented out

  return (
    <>
      <IgnitionBorder x={x} y={y} engine={engine} ignition={ignition} />
      {/* N2 */}
      <DecimalValues x={x} y={y} value={N2} active={fadecPowered} />
      <path className="White SW2" d={`M${engine > 2 ? x - 96 : x + 64},${y - 10} l 26, 0`} />
      {/* N3 */}
      <rect x={x - 55} y={y + 10} width={98} height={34} className={`LightGreyBox ${starting ? 'Show' : 'Hide'}`} />
      <DecimalValues x={x} y={y + 38} value={N3} active={fadecPowered} />
      <path className="White SW2" d={`M${engine > 2 ? x - 96 : x + 64},${y + 28} l 26, 0`} />
      {/* Fuel Flow */}
      {!fadecPowered && (
        <text x={x} y={y + 86} className="Amber F29 MiddleAlign">
          XX
        </text>
      )}
      {fadecPowered && (
        <text x={x + 30} y={y + 92} className="Green EndAlign F29">
          {Math.ceil(NXUnits.kgToUser(fuelFlow) / 10) * 10}
        </text>
      )}
      {/* OIL */}
      <OilQuantityGauge x={x} y={y + 206} engine={engine} active={fadecPowered} value={oilQuantity} />
      <DecimalValues x={x} y={y + 206} value={oilQuantity} active={fadecPowered} />
      {!fadecPowered && (
        <text x={x} y={y + 242} className="Amber F29 MiddleAlign">
          XX
        </text>
      )}
      {fadecPowered && (
        <text x={x + 20} y={y + 248} className={`${engineOilTemperature > 177 ? 'Amber' : 'Green'} EndAlign F29`}>
          {engineOilTemperature < 0 ? 0 : Math.round(engineOilTemperature)}
        </text>
      )}
      <path className="White SW2" d={`M${engine > 2 ? x - 96 : x + 64},${y + 82} l 26, 0`} />
      {/* Oil Pressure */}
      <OilPressureGauge x={x} y={y + 320} engine={engine} active={fadecPowered} />
      {/* VIB N1 */}
      <DecimalValues x={x} y={y + 380} value={n1Vibration} active={fadecPowered} shift={-14} />
      <path className="White SW2" d={`M${engine > 2 ? x - 96 : x + 64},${y + 370} l 26, 0`} />
      {/* VIB N2 */}
      <DecimalValues x={x} y={y + 416} value={n2Vibration} active={fadecPowered} shift={-14} />
      <path className="White SW2" d={`M${engine > 2 ? x - 96 : x + 64},${y + 406} l 26, 0`} />
      {/* VIB N3 */}
      <DecimalValues x={x} y={y + 450} value={n3Vibration} active={fadecPowered} shift={-14} />
      <path className="White SW2" d={`M${engine > 2 ? x - 96 : x + 64},${y + 440} l 26, 0`} />

      {/* NAC / Ignition */}
      {(starting || ignition) && <StartValve x={x} y={y + 536} engine={engine} />}
      {!starterValveOpen && !ignition && (
        <NacelleTemperatureGauge x={x} y={y + 536} engine={engine} active={fadecPowered} value={240} />
      )}
    </>
  );
};

export default EngineColumn;
