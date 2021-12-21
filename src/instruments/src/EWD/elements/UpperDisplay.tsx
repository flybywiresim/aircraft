import React from 'react';
import { usePersistentProperty } from '@instruments/common/persistence';
import FOB from './FOB';
import N2 from './N2';
import EGT from './EGT';
import N1 from './N1';
import FF from './FF';

const UpperDisplay: React.FC = () => {
    console.log('Upper Display');
    const [unit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');

    return (
        <>
            <N1 engine={1} x={233} y={92} />
            <N1 engine={2} x={527} y={92} />
            <text className="Large Center" x={384} y={115}>N1</text>
            <text className="Medium Center Cyan" x={381} y={134}>%</text>

            <EGT engine={1} x={233} y={241} />
            <EGT engine={2} x={527} y={241} />
            <text className="Large Center" x={381} y={227}>EGT</text>
            <text className="Medium Center Cyan" x={374} y={246}>&deg;C</text>

            <N2 engine={1} x={189} y={266} />
            <N2 engine={2} x={484} y={266} />
            <text className="Large Center" x={381} y={300}>N2</text>
            <text className="Medium Center Cyan" x={381} y={320}>%</text>
            <line className="Separator" x1="307" y1="303" x2="339" y2="294" strokeLinecap="round" />
            <line className="Separator" x1="420" y1="294" x2="452" y2="303" strokeLinecap="round" />

            <FF engine={1} x={269} y={371} unit={unit} />
            <FF engine={2} x={563} y={371} unit={unit} />
            <text className="Large Center" x={381} y={361}>FF</text>
            <text className="Medium Center Cyan" x={380} y={380}>
                {unit === '1' ? 'KG' : 'LBS'}
                /H
            </text>
            <line className="Separator" x1="307" y1="361" x2="339" y2="352" strokeLinecap="round" />
            <line className="Separator" x1="420" y1="352" x2="452" y2="361" strokeLinecap="round" />

            <FOB unit={unit} x={18} y={474} />
        </>
    );
};

export default UpperDisplay;
