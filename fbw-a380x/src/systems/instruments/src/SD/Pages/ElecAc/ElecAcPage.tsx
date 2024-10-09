import React from 'react';
import { PageTitle } from '../Generic/PageTitle';
import { ElectricalNetwork } from './elements/ElectricalNetwork';
import { ApuGeneratorSet } from './elements/ApuGeneratorSet';
import { AcElecBus, BusBar } from './elements/BusBar';
import { StaticInverter } from './elements/StaticInverter';
import { EmergencyGenerator } from './elements/EmergencyGenerator';
import { AcEssFeedLine } from './elements/AcEssFeedLine';
import { AcEssToAcEmerFeedLine } from './elements/AcEssToAcEmerFeedLine';
import { Ac23BusTie } from './elements/Ac23BusTie';
import { AcBusTie } from './elements/AcBusTie';

import '../../../index.scss';

export const ElecAcPage = () => (
  <>
    <PageTitle x={6} y={29}>
      ELEC AC
    </PageTitle>

    <BusBar x={316} y={28} bus={AcElecBus.AcEmerBus} />
    <BusBar x={316} y={137} bus={AcElecBus.AcEssBus} />

    <Ac23BusTie />

    <AcBusTie />

    <AcEssToAcEmerFeedLine />

    <ApuGeneratorSet x={386} y={389} />

    <StaticInverter x={497} y={47} />
    <EmergencyGenerator x={290} y={95} />

    <ElectricalNetwork x={58} y={258} bus={AcElecBus.Ac1Bus} />
    <ElectricalNetwork x={181} y={258} bus={AcElecBus.Ac2Bus} />
    <ElectricalNetwork x={482} y={258} bus={AcElecBus.Ac3Bus} />
    <ElectricalNetwork x={605} y={258} bus={AcElecBus.Ac4Bus} />

    <AcEssFeedLine side={1} />
    <AcEssFeedLine side={2} />
  </>
);
