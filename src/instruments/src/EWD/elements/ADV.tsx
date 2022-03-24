import React from 'react';

type ADVProps = {
    x: number,
    y: number,
    active: boolean,
};

const ADV: React.FC<ADVProps> = ({ x, y, active }) => (
    <>
        { active && (
            <g id="ADV">
                <text
                    x={x}
                    y={y}
                    fill="White"
                    textAnchor="middle"
                    className="EWDWarn White"
                >
                    ADV
                </text>

                <path
                    className="WhiteLine"
                    d={`M ${x - 27} ${y + 3} h 55 v -24 h -55 v 24`}
                    strokeLinecap="round"
                />
            </g>
        ) }
    </>
);
export default ADV;
