import React, { FC } from 'react';
import { render } from '@instruments/common/index';
import { setIsEcamPage } from '@instruments/common/defaults';
import { PageTitle } from '../../Common/PageTitle';
import { EcamPage } from '../../Common/EcamPage';
import EngineBleed from './elements/EngineBleed';
import Valve from './elements/Valve';

import './Bleed.scss';

setIsEcamPage('bleed_page');

export const BleedPage: FC = () => {
    console.log('Bleed page');

    return (
        <EcamPage name="main-bleed">
            <PageTitle x={6} y={18} text="BLEED" />

            {/* Ram air */}
            <Valve x={300} y={93} radius={15} css="GreenLine" position="H" visible />

            {/* Cross Bleed */}
            <Valve x={355} y={267} radius={15} css="GreenLine" position="H" visible />

            {/* APU */}
            <Valve x={300} y={338} radius={15} css="GreenLine" position="V" visible />

            <EngineBleed x={135} y={62} engine={1} />
            <EngineBleed x={464} y={62} engine={2} />
        </EcamPage>
    );
};

render(<BleedPage />);
