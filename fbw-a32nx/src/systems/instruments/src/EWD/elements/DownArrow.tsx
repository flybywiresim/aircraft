import { Layer } from '@instruments/common/utils';
import React from 'react';

type DAProps = {
    x: number,
    y: number,
    active: boolean,
};

const DownArrow: React.FC<DAProps> = ({ x, y, active }) => (
    <>
        { active && (
            <Layer x={x} y={y} id="DownArrow">
                <path
                    d="m 0 0 h 5 v 18 h 5 l -7.5,11 l -7.5,-11 h 5 v -18"
                    className="GreenFill"
                />
            </Layer>
        ) }
    </>
);
export default DownArrow;
