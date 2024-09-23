import { useSimVar } from '@instruments/common/simVars';
import React, { FC } from 'react';
import { Triangle } from '@instruments/common/Shapes';
import { AcElecBus } from './BusBar';

const ENG_GEN_VOLTAGE_NORMAL_RANGE_LOWER = 110;
const ENG_GEN_VOLTAGE_NORMAL_RANGE_UPPER = 120;
const ENG_GEN_LOAD_NORMAL_RANGE_UPPER = 108;

interface EngineGeneratorProps {
  x: number;
  y: number;
  bus: AcElecBus;
}

export const EngineGenerator: FC<EngineGeneratorProps> = ({ x, y, bus }) => {
  const [potential] = useSimVar(`L:A32NX_ELEC_ENG_GEN_${bus}_POTENTIAL`, 'volts', 500);
  const [load] = useSimVar(`L:A32NX_ELEC_ENG_GEN_${bus}_LOAD`, 'number', 500);

  const engGenLoadNormal = load < ENG_GEN_LOAD_NORMAL_RANGE_UPPER;
  const engGenVoltageNormal =
    potential > ENG_GEN_VOLTAGE_NORMAL_RANGE_LOWER && potential < ENG_GEN_VOLTAGE_NORMAL_RANGE_UPPER;

  const [lineContactorClosed] = useSimVar(`L:A32NX_ELEC_CONTACTOR_990XU${bus}_IS_CLOSED`, 'number', 500);
  const [genPushbuttonAuto] = useSimVar(`GENERAL ENG MASTER ALTERNATOR:${bus}`, 'number', 500);
  const [engineState] = useSimVar(`L:A32NX_ENGINE_STATE:${bus}`, 'Enum', 1000);
  const engineGenFailed = false;

  return (
    <g id={`engine-generator-${bus}-indication`} transform={`translate(${x} ${y})`}>
      <image xlinkHref="/Images/fbw-a380x/SD_ELEC_AC_ENG.png" x={-18} y={-19} width={111} height={185} />

      <path className="BackgroundFill" d="M 0,0 l 0,84 l 76,0 l 0,-84 z" />

      <text
        x={5}
        y={23}
        className={`F26 ${genPushbuttonAuto && engineState === 1 && !engineGenFailed ? 'White' : 'Amber'}`}
      >
        GEN
      </text>
      <text
        x={59}
        y={23}
        className={`F28 ${genPushbuttonAuto && engineState === 1 && !engineGenFailed ? 'White' : 'Amber'}`}
      >
        {bus}
      </text>

      {bus % 2 === 1 && (
        <g>
          <text className="Cyan F22" x={94} y={52}>
            %
          </text>
          <text className="Cyan F22" x={94} y={81}>
            V
          </text>
        </g>
      )}

      {/* Load */}
      <text
        x={67}
        y={52}
        className={`F29 EndAlign ${engGenLoadNormal ? 'Green' : 'Amber'} LS1 ${genPushbuttonAuto ? '' : 'Hide'}`}
      >
        {Math.round(load)}
      </text>
      {/* Voltage */}
      <text
        x={67}
        y={80}
        className={`F29 EndAlign ${engGenVoltageNormal ? 'Green' : 'Amber'} LS1 ${genPushbuttonAuto ? '' : 'Hide'}`}
      >
        {Math.round(potential)}
      </text>
      {/* OFF Indication */}
      <text x={67} y={62} className={`F29 EndAlign White LS1 ${genPushbuttonAuto ? 'Hide' : ''}`}>
        OFF
      </text>

      {/* GEN line contactor indication */}
      <Triangle
        x={38}
        y={-14}
        colour={`Green ${lineContactorClosed ? '' : 'Hide'}`}
        fill={0}
        orientation={0}
        scale={1}
      />
      <path className={`SW2 Green ${lineContactorClosed ? '' : 'Hide'}`} d="M 38,-14 l 0,-151" />
    </g>
  );
};
