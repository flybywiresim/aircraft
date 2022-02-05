import React from 'react';
import { usePersistentProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';
import FOB from './FOB';
import N2 from './N2';
import EGT from './EGT';
import N1 from './N1';
import FF from './FF';
import N1Limit from './N1Limit';
import Idle from './Idle';
import Slats from './Slats';
import PacksNaiWai from './PacksNAIWAI';

const UpperDisplay: React.FC = () => {
    const [unit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');
    const [engSelectorPosition] = useSimVar('L:XMLVAR_ENG_MODE_SEL', 'enum', 1000);
    const [flightPhase] = useSimVar('L:A32NX_FWC_FLIGHT_PHASE', 'enum', 1000);

    const isActive = (engSelectorPosition === 2 && flightPhase === 1) || flightPhase > 1;

    return (
        <>
            {/*   */}
            <PacksNaiWai x={492} y={27} flightPhase={flightPhase} />
            <Idle x={374} y={55} />

            <N1Limit x={693} y={30} active={isActive} />

            <N1 engine={1} x={234} y={98} active={isActive} />
            <N1 engine={2} x={534} y={98} active={isActive} />
            <text className="Large Center" x={387} y={124}>N1</text>
            <text className="Medium Center Cyan" x={384} y={143}>%</text>

            <EGT engine={1} x={234} y={252} active={isActive} />
            <EGT engine={2} x={533} y={252} active={isActive} />
            <text className="Large Center" x={384} y={237}>EGT</text>
            <text className="Medium Center Cyan" x={379} y={260}>&deg;C</text>

            <N2 engine={1} x={192} y={281} active={isActive} />
            <N2 engine={2} x={493} y={281} active={isActive} />
            <text className="Large Center" x={385} y={316}>N2</text>
            <text className="Medium Center Cyan" x={383} y={336}>%</text>
            <line className="Separator" x1="311" y1="318" x2="343" y2="309" strokeLinecap="round" />
            <line className="Separator" x1="424" y1="309" x2="456" y2="318" strokeLinecap="round" />

            <FF engine={1} x={273} y={388} unit={unit} active={isActive} />
            <FF engine={2} x={576} y={388} unit={unit} active={isActive} />
            <text className="Large Center" x={385} y={377}>FF</text>
            <text className="Medium Center Cyan" x={384} y={399}>
                {unit === '1' ? 'KG' : 'LBS'}
                /H
            </text>
            <line className="Separator" x1="311" y1="377" x2="343" y2="368" strokeLinecap="round" />
            <line className="Separator" x1="424" y1="368" x2="456" y2="377" strokeLinecap="round" />

            <Slats x={536} y={453} />

            <FOB unit={unit} x={12} y={500} />
        </>
    );
};

export default UpperDisplay;
