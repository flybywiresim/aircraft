import React, { FC } from 'react';
import { render } from '@instruments/common/index';
import { useSimVar } from '@instruments/common/simVars';
import { setIsEcamPage } from '@instruments/common/defaults';
import { PageTitle } from '../../Common/PageTitle';
import { EcamPage } from '../../Common/EcamPage';
import EngineBleed from './elements/EngineBleed';
import Valve from './elements/Valve';
import APUValve from './elements/APUValve';
import { Triangle } from '../../Common/Shapes';

import './Bleed.scss';

setIsEcamPage('bleed_page');

export const BleedPage: FC = () => {
    const sdacDatum = true;
    const [xbleedAirValveOpen] = useSimVar('L:A32NX_PNEU_XBLEED_VALVE_OPEN', 'bool', 500);
    const [engine1PRValveOpen] = useSimVar('L:A32NX_PNEU_ENG_1_PR_VALVE_OPEN', 'bool', 500);
    const [engine2PRValveOpen] = useSimVar('L:A32NX_PNEU_ENG_2_PR_VALVE_OPEN', 'bool', 500);
    const [apuBleedAirValveOpen] = useSimVar('L:A32NX_PNEU_BLEED_AIR_VALVE_OPEN', 'bool', 500);
    const [apuMasterSwitchOn] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'bool', 500);
    const [apuIsAvailable] = useSimVar('L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE', 'bool', 500);
    const [packFlowValve1Open] = useSimVar('L:A32NX_COND_PACK_FLOW_VALVE_1_IS_OPEN', 'bool', 500);
    const [packFlowValve2Open] = useSimVar('L:A32NX_COND_PACK_FLOW_VALVE_2_IS_OPEN', 'bool', 500);
    const [ramAirToggle] = useSimVar('L:A32NX_AIRCOND_RAMAIR_TOGGLE', 'bool', 500);

    const leftVerticalDuctColour = !xbleedAirValveOpen && (!apuBleedAirValveOpen || (!apuMasterSwitchOn && !apuIsAvailable)) && !engine1PRValveOpen ? 'Amber' : 'Green';
    const rightVerticalDuctColour = !xbleedAirValveOpen && !engine2PRValveOpen ? 'Amber' : 'Green';
    const indicationBleedUsers = !packFlowValve1Open && !packFlowValve2Open && ramAirToggle === 0 ? 'Amber' : 'Green';

    return (
        <EcamPage name="main-bleed">
            <PageTitle x={6} y={18} text="BLEED" />

            {/* Indication of bleed users */}
            <Triangle x={185} y={24} colour={indicationBleedUsers} orientation={0} fill={0} scale={0.75} />
            <Triangle x={300} y={24} colour={indicationBleedUsers} orientation={0} fill={0} scale={0.75} />
            <Triangle x={429} y={24} colour={indicationBleedUsers} orientation={0} fill={0} scale={0.75} />
            <path className={`${indicationBleedUsers}Line`} d="M 135,62 l 0,-19 l 329,0 l 0,19" />

            {/* Ram air */}
            <Valve x={300} y={93} radius={15} css="GreenLine" position="H" sdacDatum={sdacDatum} />

            {/* Cross Bleed Duct  */}
            <g id="cross-bleed">
                <path className={`${leftVerticalDuctColour}Line`} d={`M ${135},${227} l 0,82`} />
                <path className={xbleedAirValveOpen === 1 ? 'GreenLine' : 'Hide'} d={`M ${135},${267} l 329,0`} />
                <Valve x={355} y={267} radius={15} css="GreenLine" position={xbleedAirValveOpen === 1 ? 'H' : 'V'} sdacDatum={sdacDatum} />
                <path className={`${rightVerticalDuctColour}Line`} d={`M ${464},${227} l 0,82`} />
            </g>

            {/* APU */}
            <APUValve x={300} y={338} sdacDatum={sdacDatum} />

            <EngineBleed x={135} y={62} engine={1} sdacDatum={sdacDatum} enginePRValveOpen={engine1PRValveOpen} packFlowValveOpen={packFlowValve1Open} />
            <EngineBleed x={464} y={62} engine={2} sdacDatum={sdacDatum} enginePRValveOpen={engine2PRValveOpen} packFlowValveOpen={packFlowValve2Open} />
        </EcamPage>
    );
};

render(<BleedPage />);
