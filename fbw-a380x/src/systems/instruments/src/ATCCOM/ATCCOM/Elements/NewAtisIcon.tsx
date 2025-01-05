import React, { FC } from 'react';

type NewAtisIconProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export const NewAtisIcon: FC<NewAtisIconProps> = ({ x = 0, y = 0, width = 40, height = 26 }) => (
  <>
    <rect x={x} y={y} width={width} height={height} fill="white" />
    <rect x={x + 2} y={y + 2} width={width - 4} height={height - 4} stroke="black" strokeWidth={1} fill="none" />
    <path
      d={`M ${x + 2} ${y + 2} l ${width * 0.4} ${height * 0.52} h ${width * 0.1} l ${width * 0.4} -${height * 0.52}`}
      stroke="black"
      strokeWidth={1}
      fill="none"
    />
    <path
      d={`M ${x + 2} ${y + height - 2} l ${width * 0.32} -${height * 0.45}`}
      stroke="black"
      strokeWidth={1}
      fill="none"
    />
    <path
      d={`M ${x + width - 2} ${y + height - 2} l -${width * 0.32} -${height * 0.45}`}
      stroke="black"
      strokeWidth={1}
      fill="none"
    />
  </>
);
