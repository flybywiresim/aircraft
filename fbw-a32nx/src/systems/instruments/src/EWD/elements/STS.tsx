import { Layer } from '@instruments/common/utils';
import React from 'react';

type STSProps = {
    x: number,
    y: number,
    active: boolean,
};

const STS: React.FC<STSProps> = ({ x, y, active }) => (
    <>
        { active && (
            <Layer x={x} y={y} id="STS">
                <text x={1} y={0} className="Standard White" textAnchor="middle">
                    STS
                </text>
                <path
                    className="WhiteLine"
                    d="M -24 3 h 48 v -24 h -48 z"
                />
            </Layer>
        ) }
    </>
);
export default STS;
