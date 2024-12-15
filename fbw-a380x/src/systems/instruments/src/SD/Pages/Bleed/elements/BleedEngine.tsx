import React from 'react';
import { useSimVar } from '@instruments/common/simVars';

import Valve from './Valve';
import BleedGauge from './BleedGauge';

import '../../../../index.scss';

interface BleedPageProps {
  x: number;
  y: number;
  engine: number;
  sdacDatum: boolean;
}

const BleedEngine: React.FC<BleedPageProps> = ({ x, y, engine, sdacDatum }) => {
  const packIndex = engine > 2 ? 2 : 1;
  const packFlowValveIndex = engine > 2 ? engine - 2 : engine;

  const [engineState] = useSimVar(`L:A32NX_ENGINE_STATE:${engine}`, 'Enum', 1000);
  const isEngineRunning = engineState === 1;
  const [engineBleedValveOpen] = useSimVar(`L:A32NX_PNEU_ENG_${engine}_PR_VALVE_OPEN`, 'bool', 500);
  const [engineHpValveOpen] = useSimVar(`L:A32NX_PNEU_ENG_${engine}_HP_VALVE_OPEN`, 'bool', 500);
  const [precoolerOutletTemp] = useSimVar(`L:A32NX_PNEU_ENG_${engine}_PRECOOLER_OUTLET_TEMPERATURE`, 'celsius', 100);
  const precoolerOutletTempFive = Math.round(precoolerOutletTemp / 5) * 5;
  const [precoolerInletPress] = useSimVar(`L:A32NX_PNEU_ENG_${engine}_REGULATED_TRANSDUCER_PRESSURE`, 'psi', 10);
  const precoolerInletPressTwo = Math.round(precoolerInletPress / 2) * 2;
  const [packFlowValveOpen] = useSimVar(
    `L:A32NX_COND_PACK_${packIndex}_FLOW_VALVE_${packFlowValveIndex}_IS_OPEN`,
    'bool',
    500,
  );
  const [packFlowValveRate] = useSimVar(
    `L:A32NX_PNEU_PACK_${packIndex}_FLOW_VALVE_${packFlowValveIndex}_FLOW_RATE`,
    'number',
    100,
  );

  // TODO: Connect these up properly, so the valves can be shown in amber once we have failure conditions.
  // For now, we pretend the valves are always in the commanded state.
  const shouldHpValveBeOpen = engineHpValveOpen;
  const shouldBleedValveBeOpen = engineBleedValveOpen;

  // TODO Degraded accuracy indication for fuel flow and used

  return (
    <>
      <text x={x - 22} y={y + 28} className="White F29">
        {engine}
      </text>
      <image
        x={x}
        y={y}
        width={80}
        height={124}
        xlinkHref="/Images/fbw-a380x/Engine-Hyd-Bleed-Dithered.png"
        preserveAspectRatio="none"
      />

      <g className={engine === 1 ? 'Show' : 'Hide'}>
        {/* x=75   y=525 */}
        <rect className="BackgroundFill" height={19} width={28} x={x + 35} y={y + 82} />
        <rect className="BackgroundFill" height={19} width={28} x={x + 5} y={y + 40} />
        <text className="White F22" x={x + 6} y={y + 58}>
          IP
        </text>
        <text className="White F22" x={x + 37} y={y + 100}>
          HP
        </text>
      </g>

      {/* Engine Bleed valve */}
      <Valve
        x={x + 29}
        y={y - 29}
        radius={19}
        css={`Line ${shouldBleedValveBeOpen === engineBleedValveOpen && (engineHpValveOpen || isEngineRunning) ? 'Green' : 'Amber'}`}
        position={engineBleedValveOpen ? 'V' : 'H'}
        sdacDatum={sdacDatum}
      />
      <path
        className={`SW2 ${shouldBleedValveBeOpen === engineBleedValveOpen && (engineHpValveOpen || isEngineRunning) ? 'Green' : 'Amber'}`}
        d={`M ${x + 29},${y - 10} l 0,46`}
      />
      <path className={`${engineBleedValveOpen ? 'SW2 Green' : 'Hide'}`} d={`M ${x + 29},${y - 69} l 0,20`} />

      {/* HP valve */}
      <Valve
        x={x + 61}
        y={y + 40}
        radius={19}
        css={`Line ${shouldHpValveBeOpen === engineHpValveOpen && (engineHpValveOpen || isEngineRunning) ? 'Green' : 'Amber'}`}
        position={engineHpValveOpen ? 'V' : 'H'}
        sdacDatum={sdacDatum}
      />
      <path
        className={`SW2 ${shouldHpValveBeOpen === engineHpValveOpen && (engineHpValveOpen || isEngineRunning) ? 'Green' : 'Amber'}`}
        d={`M ${x + 61},${y + 59} l 0,20`}
      />

      {/* Engine Bleed temp */}
      <path className="Grey SW2" d={`M ${x + 30},${y - 145} l -40,0 l 0,75 l 80,0 l 0,-75 l -40,0`} />
      <g className={engine % 2 === 0 ? 'Hide' : 'Show'}>
        <text x={x + 78} y={y - 117} className="Cyan F23">
          PSI
        </text>
        <text x={x + 80} y={y - 75} className="Cyan F23">
          °C
        </text>
      </g>
      {/* Precooler inlet pressure */}
      <text
        x={x + 28}
        y={y - 125}
        className={`F29 MiddleAlign ${!sdacDatum || precoolerInletPressTwo <= 4 || precoolerInletPressTwo > 60 ? 'Amber' : 'Green'}`}
      >
        {!sdacDatum || precoolerInletPressTwo < 0 ? 'XX' : precoolerInletPressTwo}
      </text>
      {/* Precooler outlet temperature */}
      <text
        x={sdacDatum ? x + 28 : x}
        y={y - 86}
        className={`F29 MiddleAlign ${!sdacDatum || precoolerOutletTempFive < 150 || precoolerOutletTempFive > 257 ? 'Amber' : 'Green'}`}
      >
        {!sdacDatum ? 'XX' : precoolerOutletTempFive}
      </text>

      <path className={`${packFlowValveOpen ? 'SW2 Green' : 'Hide'}`} d={`M ${x + 29},${y - 240} l 0,94`} />

      {/* Pack valve */}
      <BleedGauge
        x={x + 29}
        y={y - 260}
        engine={engine}
        sdacDatum={sdacDatum}
        packValveOpen={packFlowValveOpen}
        packFlowRate={packFlowValveRate}
      />
    </>
  );
};

export default BleedEngine;
