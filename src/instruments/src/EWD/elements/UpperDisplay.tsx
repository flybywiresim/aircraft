import React from 'react';
import N1 from './N1';

const UpperDisplay: React.FC = () => {
    console.log('Upper Display');

    return (
        <>
            <N1 engine={1} x={184} y={72} />
            <text className="Large Center" x={300} y={90}>N1</text>
            <text className="Medium Center Cyan" x={300} y={105}>%</text>
        </>
    );
};

export default UpperDisplay;
