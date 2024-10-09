import React, { FunctionComponent } from 'react';

export const StatusTitle: FunctionComponent<{ x: number; y: number; separatorLineWidth?: number }> = (props) => (
  <>
    {props.separatorLineWidth && (
      <line x1={0} y1={0} x2={props.separatorLineWidth} y2={0} style={{ stroke: 'white', strokeWidth: 2 }} />
    )}
    <text x={props.x} y={props.y} className="F26 White TextUnderline MiddleAlign">
      {props.children}
    </text>
    {props.separatorLineWidth && (
      <line x1={756 - props.separatorLineWidth} y1={0} x2={756} y2={0} style={{ stroke: 'white', strokeWidth: 2 }} />
    )}
  </>
);
