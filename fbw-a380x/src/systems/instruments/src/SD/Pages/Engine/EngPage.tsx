import React from 'react';
import { useSimVar } from '@instruments/common/simVars';
// import { usePersistentProperty } from '@instruments/common/persistence';
import { PageTitle } from '../Generic/PageTitle';
import EngineColumn from './elements/EngineColumn';

import '../../../index.scss';
import { NXUnits } from '../../../../../../../../fbw-common/src/systems/instruments/src/NXUnits';

export const EngPage = () => {
  // const sdacDatum = true;
  // const [weightUnit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');
  const [engSelectorPosition] = useSimVar('L:XMLVAR_ENG_MODE_SEL', 'Enum', 1000);
  const [engine1State] = useSimVar('L:A32NX_ENGINE_STATE:1', 'enum', 500); // TODO: Update with correct SimVars
  const [engine2State] = useSimVar('L:A32NX_ENGINE_STATE:2', 'enum', 500); // TODO: Update with correct SimVars
  const [engine3State] = useSimVar('L:A32NX_ENGINE_STATE:3', 'enum', 500); // TODO: Update with correct SimVars
  const [engine4State] = useSimVar('L:A32NX_ENGINE_STATE:4', 'enum', 500); // TODO: Update with correct SimVars
  const engineState = [engine1State, engine2State, engine3State, engine4State];
  const engineRunning = engineState.some((value) => value > 0); // TODO Implement FADEC SimVars once available

  return (
    <>
      <PageTitle x={6} y={29}>
        ENGINE
      </PageTitle>

      <EngineColumn x={67} y={68} engine={1} ignition={engSelectorPosition === 2} anyEngineRunning={engineRunning} />
      <EngineColumn x={230} y={68} engine={2} ignition={engSelectorPosition === 2} anyEngineRunning={engineRunning} />
      <EngineColumn x={543} y={68} engine={3} ignition={engSelectorPosition === 2} anyEngineRunning={engineRunning} />
      <EngineColumn x={701} y={68} engine={4} ignition={engSelectorPosition === 2} anyEngineRunning={engineRunning} />

      {/* labels */}
      <text x={388} y={68} className="F25 EndAlign White">
        N2
      </text>
      <text x={414} y={68} className="F25 EndAlign Cyan">
        %
      </text>
      <text x={388} y={108} className="F25 EndAlign White">
        N3
      </text>
      <text x={414} y={108} className="F25 EndAlign Cyan">
        %
      </text>
      <text x={388} y={148} className="F25 EndAlign White">
        FF
      </text>
      <text x={410} y={182} className="F25 EndAlign Cyan">
        {NXUnits.userWeightUnit()}/H
      </text>

      <text x={410} y={240} className="F25 EndAlign White">
        OIL
      </text>
      <text x={398} y={276} className="F25 EndAlign Cyan">
        QT
      </text>
      <text x={398} y={316} className="F25 EndAlign Cyan">
        °C
      </text>

      <text x={410} y={386} className="F25 EndAlign Cyan">
        PSI
      </text>

      <text x={388} y={452} className="F25 EndAlign White">
        VIB
      </text>
      <text x={428} y={452} className="F25 EndAlign White">
        N1
      </text>
      <text x={428} y={486} className="F25 EndAlign White">
        N2
      </text>
      <text x={428} y={520} className="F25 EndAlign White">
        N3
      </text>
    </>
  );
};
