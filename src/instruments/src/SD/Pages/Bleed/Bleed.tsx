import React, { FC } from 'react';
import { render } from '@instruments/common/index';
import { useSimVar } from '@instruments/common/simVars';
import { setIsEcamPage } from '@instruments/common/defaults';
import { PageTitle } from '../../Common/PageTitle';
import { EcamPage } from '../../Common/EcamPage';
import EngineBleed from './elements/EngineBleed';
import Valve from './elements/Valve';
import APUValve from './elements/APUValve';

import './Bleed.scss';

setIsEcamPage('bleed_page');

export const BleedPage: FC = () => {
    console.log('Bleed page');
    const sdacDatum = true;
    const [xbleedAirValveOpen] = useSimVar('L:A32NX_PNEU_XBLEED_VALVE_OPEN', 'bool', 500);

    const leftVerticalDuctColour = 'Amber';
    const rightVerticalDuctColour = 'Green';

    return (
        <EcamPage name="main-bleed">
            <PageTitle x={6} y={18} text="BLEED" />

            {/* Ram air */}
            <Valve x={300} y={93} radius={15} css="GreenLine" position="H" sdacDatum={sdacDatum} />

            {/* Cross Bleed */}
            <g id="cross-bleed">
                <path className={`${leftVerticalDuctColour}Line`} d={`M ${135},${227} l 0,82`} />
                <path className={xbleedAirValveOpen === 1 ? 'GreenLine' : 'Hide'} d={`M ${135},${267} l 329,0`} />
                <Valve x={355} y={267} radius={15} css="GreenLine" position={xbleedAirValveOpen === 1 ? 'H' : 'V'} sdacDatum={sdacDatum} />
                <path className={`${rightVerticalDuctColour}Line`} d={`M ${464},${227} l 0,82`} />
            </g>

            {/* APU */}
            <APUValve x={300} y={338} sdacDatum={sdacDatum} />

            <EngineBleed x={135} y={62} engine={1} sdacDatum={sdacDatum} />
            <EngineBleed x={464} y={62} engine={2} sdacDatum={sdacDatum} />
        </EcamPage>
    );
};

render(<BleedPage />);
