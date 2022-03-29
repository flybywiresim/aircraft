import React from 'react';

type STSProps = {
    x: number,
    y: number,
    active: boolean,
};

const STS: React.FC<STSProps> = ({ x, y, active }) => (
    <>
        { active && (
            <g id="STS">
                <text x={x} y={y} className="White EWDWarn" textAnchor="middle">
                    STS
                </text>
                <path
                    className="WhiteLine"
                    d={`M ${x - 28} ${y + 3} h 55 v -24 h -55 v 24`}
                    strokeLinecap="round"
                />
            </g>
        ) }
    </>
);
export default STS;
