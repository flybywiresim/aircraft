import React from 'react';
import { PageTitle } from '../Generic/PageTitle';
import { ElectricalNetwork } from './elements/ElectricalNetwork';
import { DcElecBus } from './elements/BusBar';
import { Dc1Dc2BusTie } from './elements/Dc1Dc2BusTie';
import { Dc1DcEssBusTie } from './elements/Dc1DcEssBusTie';

import '../../../index.scss';

export const ElecDcPage = () => (
  <>
    <PageTitle x={6} y={29}>
      ELEC DC
    </PageTitle>

    <ElectricalNetwork x={37} y={91} bus={DcElecBus.Dc1Bus} />
    <ElectricalNetwork x={199} y={91} bus={DcElecBus.DcEssBus} />
    <Dc1Dc2BusTie />
    <Dc1DcEssBusTie />
    <ElectricalNetwork x={397} y={91} bus={DcElecBus.Dc2Bus} />
    <ElectricalNetwork x={625} y={91} bus={DcElecBus.DcApu} />
  </>
);
