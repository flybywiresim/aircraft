import React, { FC } from 'react';
import { useHover } from 'use-events';
import { Layer } from '../../Components/Layer';

type SwitchButtonProps = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  first: string;
  second: string;
  onClick: () => void;
};

export const SwitchButton: FC<SwitchButtonProps> = ({ x, y, width = 110, height = 75, first, second, onClick }) => {
  const [hovered, hoverProps] = useHover();

  return (
    <Layer x={x} y={y} {...hoverProps} onClick={onClick}>
      <rect width={width} height={height} fill="transparent" />
      <polygon
        points={`
                0, 0
                ${width}, 0
                ${width - 5}, 5
                5, ${height - 5} 
                0, ${height}`}
        fill={hovered ? 'cyan' : 'white'}
      />
      <polygon
        points={`
                ${width}, 0
                ${width}, ${height} 
                0, ${height}
                5, ${height - 5}
                ${width - 5}, 5`}
        fill={hovered ? 'cyan' : '#a6a6a6'}
      />
      <rect x={2} y={2} width={width - 4} height={height - 4} fill={hovered ? 'none' : '#6b6b6b'} />
      <rect x={4} y={4} width={width - 8} height={height - 8} fill="#000" />
      <text y={height / 2} textAnchor="middle" dominantBaseline="central">
        <tspan x={width / 2} dy={-14} fill="grey" fontSize={22}>
          {first}
        </tspan>
        <tspan x={width / 2} dy={30} fill="white" fontSize={28}>
          {second}
        </tspan>
      </text>
    </Layer>
  );
};
