import React, { FC } from 'react';
import { render } from '@instruments/common/index';
import { setIsEcamPage } from '@instruments/common/defaults';
import { PageTitle } from '../../Common/PageTitle';
import { EcamPage } from '../../Common/EcamPage';

import './Status.scss';

setIsEcamPage('status_page');

export const StatusPage: FC = () => {
    console.log('Status');

    return (
        <EcamPage name="main-status">
            <PageTitle x={6} y={18} text="STATUS" />

        </EcamPage>
    );
};

render(<StatusPage />);
