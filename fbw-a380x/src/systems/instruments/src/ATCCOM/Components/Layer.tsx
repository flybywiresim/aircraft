import React, { SVGProps, FC } from 'react';

export const Layer: FC<SVGProps<SVGGElement> & { angle?: number }> = (props) => (
  <g {...props} transform={`translate(${props.x ?? 0} ${props.y ?? 0}) rotate(${props.angle ?? 0})`}>
    {props.children}
  </g>
);
