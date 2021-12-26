import React from 'react';
import { usePersistentProperty } from '@instruments/common/persistence';
import FOB from './FOB';
import N2 from './N2';
import EGT from './EGT';
import N1 from './N1';
import FF from './FF';
import N1Limit from './N1Limit';

const UpperDisplay: React.FC = () => {
    console.log('Upper Display');
    const [unit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');

    return (
        <>
            {/*  */}
            <N1Limit x={690} y={30} />

            <N1 engine={1} x={233} y={97} />
            <N1 engine={2} x={527} y={97} />
            <text className="Large Center" x={384} y={120}>N1</text>
            <text className="Medium Center Cyan" x={381} y={139}>%</text>

            <EGT engine={1} x={233} y={246} />
            <EGT engine={2} x={527} y={246} />
            <text className="Large Center" x={381} y={232}>EGT</text>
            <text className="Medium Center Cyan" x={374} y={251}>&deg;C</text>

            <N2 engine={1} x={189} y={271} />
            <N2 engine={2} x={484} y={271} />
            <text className="Large Center" x={381} y={305}>N2</text>
            <text className="Medium Center Cyan" x={381} y={325}>%</text>
            <line className="Separator" x1="307" y1="308" x2="339" y2="299" strokeLinecap="round" />
            <line className="Separator" x1="420" y1="299" x2="452" y2="308" strokeLinecap="round" />

            <FF engine={1} x={269} y={376} unit={unit} />
            <FF engine={2} x={563} y={376} unit={unit} />
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
