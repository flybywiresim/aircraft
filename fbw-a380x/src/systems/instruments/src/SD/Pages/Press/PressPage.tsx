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

export const PressPage = () => (
    <>
        <PageTitle x={6} y={29}>CAB PRESS</PageTitle>

        {/* Landing Elevation */}
        <LandingElevation x={430} y={32} />

        {/* Delta Pression, Cab Alt and V/S gauges */}
        <DeltaP x={132} y={246} />
        <path className="White Line" d="M230,78 l 0,280" />
        <CabAlt x={369} y={246} />
        <path className="White Line" d="M490,78 l 0,280" />
        <CabinVerticalSpeed x={613} y={246} />

        <A380XBleed />

        {/* Outflow valves */}
        <text x={382} y={452} className="White F22 MiddleAlign">AUTO</text>
        <text x={382} y={474} className="White F22 MiddleAlign">CTL</text>
        <OutflowValve x={214} y={552} engine={1} />
        <path className="White Line" d="M212,460 l 42,0" />
        <OutflowValve x={303} y={552} engine={2} />
        <path className="White Line" d="M300,460 l 40,0" />
        <OutflowValve x={509} y={552} engine={3} />
        <path className="White Line" d="M422,460 l 41,0" />
        <OutflowValve x={604} y={552} engine={4} />
        <path className="White Line" d="M510,460 l 48,0" />

        <text x={100} y={485} className="White F22 MiddleAlign">AVNCS</text>
        <text x={100} y={507} className="White F22 MiddleAlign">EXTRACT</text>
        <text x={100} y={529} className="White F22 MiddleAlign">OVBD</text>
        <ExtractValve x={72} y={552} value={0} min={0} max={4} radius={42} />

        <text x={712} y={412} className="White F22 MiddleAlign LS1">CAB AIR</text>
        <text x={712} y={434} className="White F22 MiddleAlign LS1">EXTRACT</text>
        <ExtractValve x={656} y={456} value={4} min={0} max={4} radius={42} />

        {/* Packs */}
        <Packs x={12} y={641} pack={1} />
        <Packs x={647} y={641} pack={2} />

    </>
);
