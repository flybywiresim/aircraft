import React, { useRef } from 'react';

import useMouse from '@react-hook/mouse-position';
// import { Button } from '../MFD/Components/Button';
// import { Cursor } from '../MFD/MultiFunctionDisplay';

export const Mailbox = () => {
    const ref = useRef(null);

    const mouse = useMouse(ref, {
        fps: 165,
        enterDelay: 100,
        leaveDelay: 100,
    });

    return (
        <g ref={ref} id='mailbox'>
            <rect x={0} y={768} width={768} height={256} fill='transparent' />
            {/* Lower status */}
            <path className='SW2 White' d='m 99 768 v 256' />
            <path className='SW2 White' d='m 360 992 v 32' />
            <path className='SW2 White' d='m 617 768 v 256' />
            <path className='SW2 White' d='m 99 992 h 518' />

            {/* ATC thing */}
            <text className='F26 Amber' x={110} y={843}>ATC DATALINK COM</text>
            <text className='F26 Amber' x={110} y={880}>NOT AVAIL</text>

            {/* Recall */}
            {/*<Button x={0} y={972} width={100} height={50} onClick={() => { }}>*/}
            {/*    <text x={5} y={25} style={{ dominantBaseline: 'middle' }} fontSize={24} fill='white'>RECALL</text>*/}
            {/*</Button>*/}
            {/*{mouse.isOver && <Cursor x={mouse.x!} y={mouse.pageY!} />}*/}
        </g>
    );
};
