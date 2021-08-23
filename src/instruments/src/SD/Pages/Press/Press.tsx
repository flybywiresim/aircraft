import React, { FC } from 'react';
import { render } from '@instruments/common/index';
import { setIsEcamPage } from '@instruments/common/defaults';
import { PageTitle } from '../../Common/PageTitle';
import { EcamPage } from '../../Common/EcamPage';

import './Press.scss';

setIsEcamPage('press_page');

export const PressPage: FC = () => {
    console.log('Pressure');

    return (
        <EcamPage name="main-press">
            <PageTitle x={6} y={18} text="CAB PRESS" />

        </EcamPage>
    );
};

render(<PressPage />);
