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
            <N1 engine={1} x={182} y={72} />
            <N1 engine={2} x={412} y={72} />
            <text className="Large Center" x={300} y={90}>N1</text>
            <text className="Medium Center Cyan" x={298} y={105}>%</text>

            <EGT engine={1} x={182} y={188} />
            <EGT engine={2} x={412} y={188} />
            <text className="Large Center" x={298} y={177}>EGT</text>
            <text className="Medium Center Cyan" x={292} y={192}>&deg;C</text>

            <N2 engine={1} x={148} y={208} />
            <N2 engine={2} x={378} y={208} />
            <text className="Large Center" x={298} y={235}>N2</text>
            <text className="Medium Center Cyan" x={298} y={250}>%</text>
            <line className="Separator" x1="240" y1="237" x2="265" y2="230" strokeLinecap="round" />
            <line className="Separator" x1="328" y1="230" x2="353" y2="237" strokeLinecap="round" />

            <FF engine={1} x={210} y={290} unit={unit} />
            <FF engine={2} x={440} y={290} unit={unit} />
            <text className="Large Center" x={298} y={282}>FF</text>
            <text className="Medium Center Cyan" x={294} y={297}>
                {unit === '1' ? 'KG' : 'LBS'}
                /H
            </text>
            <line className="Separator" x1="240" y1="282" x2="265" y2="275" strokeLinecap="round" />
            <line className="Separator" x1="328" y1="275" x2="353" y2="282" strokeLinecap="round" />

            <FOB unit={unit} x={14} y={370} />
        </>
    );
};

export default UpperDisplay;
