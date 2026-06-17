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
  const [lhCrossBleedValveOpen] = useSimVar('L:A32NX_PNEU_XBLEED_VALVE_L_OPEN', 'bool', 500);
  const [centreCrossBleedValveOpen] = useSimVar('L:A32NX_PNEU_XBLEED_VALVE_C_OPEN', 'bool', 500);
  const [rhCrossBleedValveOpen] = useSimVar('L:A32NX_PNEU_XBLEED_VALVE_R_OPEN', 'bool', 500);
  const [apuBleedValveOpen] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'bool', 500);
  const allApuValvesOpen = apuBleedValveOpen;

  let bleedDuctHidden = false;
  if (engine == 1) {
    bleedDuctHidden =
      !engineBleedValveOpen && !allApuValvesOpen && !(lhCrossBleedValveOpen || centreCrossBleedValveOpen);
  } else if (engine == 2) {
    bleedDuctHidden = !engineBleedValveOpen && !lhCrossBleedValveOpen;
  } else if (engine == 3) {
    bleedDuctHidden = !engineBleedValveOpen && !centreCrossBleedValveOpen;
  } else {
    bleedDuctHidden = !engineBleedValveOpen && !(centreCrossBleedValveOpen && rhCrossBleedValveOpen);
  }

  // TODO: Connect these up properly, so the valves can be shown in amber once we have failure conditions.
  // For now, we pretend the valves are always in the commanded state.
  const shouldHpValveBeOpen = engineHpValveOpen;
  const shouldBleedValveBeOpen = engineBleedValveOpen;

  // TODO Degraded accuracy indication for fuel flow and used

  return (
    <g style={{ transform: `translate3d(${x}px, ${y}px, 0px)` }}>
      <text x={-18} y={32} className="White F29">
        {engine}
      </text>
      <image
        x={0}
        y={0}
        width={80}
        height={124}
        xlinkHref="/Images/fbw-a380x/Engine-Hyd-Bleed-Dithered.png"
        preserveAspectRatio="none"
      />

      <g className={engine === 1 ? 'Show' : 'Hide'}>
        {/* x=75   y=525 */}
        <rect className="BackgroundFill" height={20} width={28} x={39} y={85} />
        <rect className="BackgroundFill" height={19} width={28} x={7} y={44} />
        <text className="White F23" x={8} y={63}>
          IP
        </text>
        <text className="White F23" x={40} y={105}>
          HP
        </text>
      </g>

      {/* Engine Bleed valve */}
      <Valve
        x={32}
        y={-24}
        radius={19.5}
        css={`Line NoFill ${shouldBleedValveBeOpen === engineBleedValveOpen && (engineHpValveOpen || isEngineRunning) ? 'Green' : 'Amber'}`}
        position={engineBleedValveOpen ? 'V' : 'H'}
        sdacDatum={sdacDatum}
      />
      <path
        className={`SW2 ${shouldBleedValveBeOpen === engineBleedValveOpen && (engineHpValveOpen || isEngineRunning) ? 'Green' : 'Amber'}`}
        d="M 32,-4 l 0,46"
      />
      <path className={`${engineBleedValveOpen ? 'SW2 Green' : 'Hide'}`} d="M 32,-67 l 0,23" />

      {/* HP valve */}
      <Valve
        x={64}
        y={45}
        radius={19.5}
        css={`Line NoFill ${shouldHpValveBeOpen === engineHpValveOpen && (engineHpValveOpen || isEngineRunning) ? 'Green' : 'Amber'}`}
        position={engineHpValveOpen ? 'V' : 'H'}
        sdacDatum={sdacDatum}
      />
      <path
        className={`SW2 ${shouldHpValveBeOpen === engineHpValveOpen && (engineHpValveOpen || isEngineRunning) ? 'Green' : 'Amber'}`}
        d="M 64,65 l 0,20"
      />
      <path className={engineHpValveOpen ? 'SW2 Green NoFill' : 'Hide'} d="M 64,25 v -12 h -31" />

      {/* Engine Bleed units */}
      <g className={engine % 2 === 0 ? 'Hide' : 'Show'}>
        <text x={83} y={-113} className="Cyan F22">
          PSI
        </text>
        <text x={85} y={-71} className="Cyan F22">
          °C
        </text>
      </g>

      <g>
        <path className="Grey NoFill SW2" d="M -9,-141 h 83 v 73 h -83 v -7 z" />
        {/* Precooler inlet pressure */}
        <text
          x={34}
          y={-122}
          className={`F27 MiddleAlign ${!sdacDatum || precoolerInletPressTwo <= 4 || precoolerInletPressTwo > 60 ? 'Amber' : 'Green'}`}
        >
          {!sdacDatum || precoolerInletPressTwo < 0 ? 'XX' : precoolerInletPressTwo}
        </text>
        {/* Precooler outlet temperature */}
        <text
          x={34}
          y={-82}
          className={`F27 MiddleAlign ${!sdacDatum || precoolerOutletTempFive < 150 || precoolerOutletTempFive > 257 ? 'Amber' : 'Green'}`}
        >
          {!sdacDatum ? 'XX' : precoolerOutletTempFive}
        </text>
      </g>

      <path className={`${bleedDuctHidden ? 'Hide' : 'SW2 Green'}`} d="M 33,-237 v 95" />

      {/* Pack valve */}
      <BleedGauge
        x={33}
        y={-257}
        engine={engine}
        sdacDatum={sdacDatum}
        packValveOpen={packFlowValveOpen}
        packFlowRate={packFlowValveRate}
      />
    </g>
  );
};

export default BleedEngine;
