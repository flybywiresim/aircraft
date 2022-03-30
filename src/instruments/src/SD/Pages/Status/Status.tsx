import React, { FC } from 'react';
import { render } from '@instruments/common/index';
import { setIsEcamPage } from '@instruments/common/defaults';
import { PageTitle } from '../../Common/PageTitle';
import { EcamPage } from '../../Common/EcamPage';
import StatusDisplay from './elements/StatusDisplay';
import DownArrow from './elements/DownArrow';

import './Status.scss';

setIsEcamPage('status_page');

export const StatusPage: FC = () => (
    <EcamPage name="main-status">
        <PageTitle x={250} y={23} text="STATUS" />

        <line className="Separator" x1="380" y1="72" x2="380" y2="460" />
        <StatusDisplay x={10} y={90} side="LEFT" />
        <StatusDisplay x={408} y={90} side="RIGHT" />

        <DownArrow x={377} y={464} active={false} />

    </EcamPage>
);

render(<StatusPage />);
