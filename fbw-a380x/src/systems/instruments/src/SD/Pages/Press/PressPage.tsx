import React from 'react';
import { PageTitle } from '../Generic/PageTitle';
import LandingElevation from './elements/LandingElevation';
import DeltaP from './elements/DeltaP';
import A380XBleed from './elements/A380Press';
import CabAlt from './elements/CabAlt';
import CabinVerticalSpeed from './elements/CabinVerticalSpeed';
import Packs from './elements/Packs';

import '../../../index.scss';
import OutflowValve from './elements/OutflowValve';
import ExtractValve from './elements/ExtractValve';
import { useArinc429Var } from '@flybywiresim/fbw-sdk';

export const PressPage = () => {
  const cpcsB1DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B1_CPCS_DISCRETE_WORD');
  const cpcsB2DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B2_CPCS_DISCRETE_WORD');
  const cpcsB3DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B3_CPCS_DISCRETE_WORD');
  const cpcsB4DiscreteWord = useArinc429Var('L:A32NX_COND_CPIOM_B4_CPCS_DISCRETE_WORD');

  let cpcsToUse;

  if (cpcsB1DiscreteWord.isNormalOperation()) {
    cpcsToUse = 1;
  } else if (cpcsB2DiscreteWord.isNormalOperation()) {
    cpcsToUse = 2;
  } else if (cpcsB3DiscreteWord.isNormalOperation()) {
    cpcsToUse = 3;
  } else if (cpcsB4DiscreteWord.isNormalOperation()) {
    cpcsToUse = 4;
  } else {
    cpcsToUse = 0;
  }

  return (
    <>
      <PageTitle x={6} y={29}>
        CAB PRESS
      </PageTitle>

      {/* Landing Elevation */}
      <LandingElevation x={430} y={32} />

      {/* Delta Pression, Cab Alt and V/S gauges */}
      <DeltaP x={132} y={246} system={cpcsToUse} />
      <path className="White Line" d="M230,78 l 0,280" />
      <CabAlt x={369} y={246} system={cpcsToUse} />
      <path className="White Line" d="M490,78 l 0,280" />
      <CabinVerticalSpeed x={613} y={246} system={cpcsToUse} />

      <A380XBleed />

      {/* Outflow valves */}
      <text x={382} y={452} className="White F22 MiddleAlign">
        AUTO
      </text>
      <text x={382} y={474} className="White F22 MiddleAlign">
        CTL
      </text>
      <OutflowValve x={214} y={552} engine={1} system={cpcsToUse} />
      <path className="White Line" d="M212,460 l 42,0" />
      <OutflowValve x={303} y={552} engine={2} system={cpcsToUse} />
      <path className="White Line" d="M300,460 l 40,0" />
      <OutflowValve x={509} y={552} engine={3} system={cpcsToUse} />
      <path className="White Line" d="M422,460 l 41,0" />
      <OutflowValve x={604} y={552} engine={4} system={cpcsToUse} />
      <path className="White Line" d="M510,460 l 48,0" />

      <text x={100} y={485} className="White F22 MiddleAlign">
        AVNCS
      </text>
      <text x={100} y={507} className="White F22 MiddleAlign">
        EXTRACT
      </text>
      <text x={100} y={529} className="White F22 MiddleAlign">
        OVBD
      </text>
      <ExtractValve x={72} y={552} value={0} min={0} max={4} radius={42} />

      <text x={712} y={412} className="White F22 MiddleAlign LS1">
        CAB AIR
      </text>
      <text x={712} y={434} className="White F22 MiddleAlign LS1">
        EXTRACT
      </text>
      <ExtractValve x={656} y={456} value={4} min={0} max={4} radius={42} />

      {/* Packs */}
      <Packs x={12} y={641} pack={1} />
      <Packs x={647} y={641} pack={2} />
    </>
  );
};
