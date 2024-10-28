import React, { useRef } from 'react';

import { Layer } from '@instruments/common/utils';

export const Mailbox = () => {
  const ref = useRef(null);

  return (
    <>
      <Layer ref={ref} x={0} y={0}>
        <rect x={0} y={768} width={768} height={256} fill="transparent" />
        {/* Lower status */}
        <path className="SW2 White" d="m 99 768 v 256" />
        <path className="SW2 White" d="m 360 992 v 32" />
        <path className="SW2 White" d="m 617 768 v 256" />
        <path className="SW2 White" d="m 99 992 h 518" />

        {/* Message area */}
        <text className="F26 Green" x={110} y={795} />
        {/*<text className='F26 Amber' x={110} y={833}>ATC DATALINK COM</text>
            <text className='F26 Amber' x={110} y={870}>NOT AVAIL</text>*/}

        {/* Buttons */}
        <Layer x={0} y={970}>
          <rect x={0} y={0} width={99} height={50} fill="#3c3c3c" strokeWidth={2} stroke="lightgray" />
          <text className="F24 White" x={5} y={35} fill="#3c3c3c">
            RECALL
          </text>
        </Layer>
        <Layer x={619} y={768}>
          <rect x={0} y={0} width={148} height={50} fill="#3c3c3c" strokeWidth={2} stroke="lightgray" />
          <text className="F24 White" x={68} y={35} fill="#3c3c3c">
            CLOSE
          </text>
        </Layer>
        <Layer x={619} y={970}>
          <rect x={0} y={0} width={148} height={50} fill="#3c3c3c" strokeWidth={2} stroke="lightgray" />
          <text className="F24 White" x={68} y={35} fill="#3c3c3c">
            PRINT
          </text>
        </Layer>
        {/*{mouse.isOver && <Cursor x={mouse.x!} y={mouse.pageY!} />}*/}
      </Layer>
    </>
  );
};
