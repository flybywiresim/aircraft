import React from 'react';

type DAProps = {
    x: number,
    y: number,
    active: boolean,
};

const DownArrow: React.FC<DAProps> = ({ x, y, active }) => (
    <>
        { active && (

            <g id="DownArrow">

                <path
                    d={`m ${x} ${y} h 5 v 18 h 5 l -7.5,11 l -7.5,-11 h 5 v -18`}
                    style={{
                        fill: '#00ff00',
                        stroke: 'none',
                    }}
                />
            </g>
        ) }
    </>
);
export default DownArrow;
