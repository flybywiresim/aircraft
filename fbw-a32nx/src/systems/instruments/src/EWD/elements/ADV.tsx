import { Layer } from '@instruments/common/utils';
import React from 'react';

type ADVProps = {
    x: number,
    y: number,
    active: boolean,
};

const ADV: React.FC<ADVProps> = ({ x, y, active }) => (
    <>
        { active && (
            <Layer x={x} y={y} id="ADV">
                <text x={1} y={0} textAnchor="middle" className="Standard White">
                    ADV
                </text>

                <path
                    className="WhiteLine"
                    d="M -24 3 h 48 v -24 h -48 z"
                />
            </Layer>
        ) }
    </>
);
export default ADV;
