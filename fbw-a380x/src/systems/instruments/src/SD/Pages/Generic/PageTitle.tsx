import React, { FunctionComponent } from 'react';

export const PageTitle: FunctionComponent<{ x: number; y: number }> = (props) => (
  <text x={props.x} y={props.y} className="F36 White TextUnderline">
    {props.children}
  </text>
);

export const MoreLabel: FunctionComponent<{ x: number; y: number; moreActive: boolean }> = (props) => (
  <>
    <text x={props.x - 27} y={props.y} className={`F24 White LS-8 ${props.moreActive ? 'Hide' : ''}`}>
      ...
    </text>
    <text
      x={props.x - (props.moreActive ? 15 : 0)}
      y={props.y}
      className={`F26 White ${props.moreActive ? 'TextUnderline' : ''}`}
    >
      MORE
    </text>
  </>
);
