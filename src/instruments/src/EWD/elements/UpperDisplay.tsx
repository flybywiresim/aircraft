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

const UpperDisplay: React.FC = () => {
    const [unit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');
    const [engSelectorPosition] = useSimVar('L:XMLVAR_ENG_MODE_SEL', 'enum', 1000);
    const [flightPhase] = useSimVar('L:A32NX_FWC_FLIGHT_PHASE', 'enum', 1000);

    const isActive = engSelectorPosition === 2 && flightPhase === 1;

    return (
        <>
            {/*  */}
            <Idle x={374} y={55} />

            <N1Limit x={690} y={30} active={isActive} />

            <N1 engine={1} x={233} y={97} active={isActive} />
            <N1 engine={2} x={527} y={97} active={isActive} />
            <text className="Large Center" x={384} y={120}>N1</text>
            <text className="Medium Center Cyan" x={381} y={139}>%</text>

            <EGT engine={1} x={233} y={246} active={isActive} />
            <EGT engine={2} x={527} y={246} active={isActive} />
            <text className="Large Center" x={381} y={232}>EGT</text>
            <text className="Medium Center Cyan" x={374} y={251}>&deg;C</text>

            <N2 engine={1} x={189} y={271} active={isActive} />
            <N2 engine={2} x={484} y={271} active={isActive} />
            <text className="Large Center" x={381} y={305}>N2</text>
            <text className="Medium Center Cyan" x={381} y={325}>%</text>
            <line className="Separator" x1="307" y1="308" x2="339" y2="299" strokeLinecap="round" />
            <line className="Separator" x1="420" y1="299" x2="452" y2="308" strokeLinecap="round" />

            <FF engine={1} x={269} y={376} unit={unit} active={isActive} />
            <FF engine={2} x={563} y={376} unit={unit} active={isActive} />
            <text className="Large Center" x={381} y={366}>FF</text>
            <text className="Medium Center Cyan" x={380} y={385}>
                {unit === '1' ? 'KG' : 'LBS'}
                /H
            </text>
            <line className="Separator" x1="307" y1="366" x2="339" y2="357" strokeLinecap="round" />
            <line className="Separator" x1="420" y1="357" x2="452" y2="366" strokeLinecap="round" />

            <FOB unit={unit} x={18} y={479} />
        </>
    );
};

export default UpperDisplay;
