import React from 'react';
import EGT from './EGT';
import N1 from './N1';

const UpperDisplay: React.FC = () => {
    console.log('Upper Display');

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
        </>
    );
};

export default UpperDisplay;
