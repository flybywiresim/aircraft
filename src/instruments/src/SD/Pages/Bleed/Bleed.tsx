import React, { FC } from 'react';
import { render } from '@instruments/common/index';
import { setIsEcamPage } from '@instruments/common/defaults';
import { PageTitle } from '../../Common/PageTitle';
import { EcamPage } from '../../Common/EcamPage';
import { EngineBleed } from './elements/EngineBleed';

import './Bleed.scss';

setIsEcamPage('bleed_page');

export const BleedPage: FC = () => {
    console.log('Bleed page ');

    return (
        <EcamPage name="main-bleed">
            <PageTitle x={6} y={18} text="BLEED" />
            <EngineBleed x={138} y={58} engine={1} />
            <EngineBleed x={466} y={58} engine={2} />
        </EcamPage>
    );
};

render(<BleedPage />);
