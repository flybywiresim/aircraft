import React from 'react';

type N2Props = {
    engine: 1 | 2,
    x: number,
    y: number,

};

const N2: React.FC<N2Props> = ({ x, y, engine }) => {
    console.log('N2');

    return (
        <>
            <g id={`N2-indicator-${engine}`}>
                <rect x={x - 6} y={y + 19} width={62} height={17} className="lightGreyBox" />
                <text className="Large End Green" x={x + 33} y={y + 35}>28</text>
                <text className="Large End Green" x={x + 42} y={y + 35}>.</text>
                <text className="Medium End Green" x={x + 55} y={y + 35}>8</text>
            </g>
        </>
    );
};

export default N2;
