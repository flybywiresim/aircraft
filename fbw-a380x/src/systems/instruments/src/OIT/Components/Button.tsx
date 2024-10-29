import React, { Children, FC, isValidElement } from 'react';
import { useHover } from 'use-events';
import { Layer } from '@instruments/common/utils';

type ButtonProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  onClick?: () => void;
  fill?: string;
  disabled?: boolean;
  highlighted?: boolean;
  gradient?: boolean;
  forceHover?: boolean;
};
const strokeWidth = 3;
export const Button: FC<ButtonProps> = ({
  x = 0,
  y = 0,
  width = 0,
  height = 41,
  children,
  onClick,
  disabled,
  fill,
  highlighted,
  gradient,
  forceHover,
}) => {
  const [hovered, hoverProps] = useHover();

  return (
    <Layer x={x} y={y} {...hoverProps} onClick={onClick}>
      <rect width={width} height={height} fill="transparent" />
      <rect x={0} y={0} width={width} height={height} fill="white" />

      {gradient && (
        <>
          <polygon
            points={`
                        0, 0
                        ${width}, 0
                        ${width - 5}, 5
                        5, ${height - 5} 
                        0, ${height}`}
            // eslint-disable-next-line no-nested-ternary
            fill={hovered || forceHover ? 'cyan' : highlighted ? 'grey' : 'white'}
          />

          <polygon
            points={`
                        ${width}, 0
                        ${width}, ${height}
                        0, ${height}
                        5, ${height - 5}
                        ${width - 5}, 5`}
            // eslint-disable-next-line no-nested-ternary
            fill={hovered || forceHover ? 'cyan' : highlighted ? 'white' : 'grey'}
          />
        </>
      )}

      <rect
        x={strokeWidth / 2}
        y={strokeWidth / 2}
        width={width - strokeWidth}
        height={height - strokeWidth}
        fill={highlighted ? '#a6a6a6' : fill ?? '#999'}
      />
      {Children.map(children, (child) => {
        if (isValidElement(child) && child.type !== 'tspan') {
          return child;
        }
        return (
          <text
            x={width / 2}
            y={height / 2}
            fill={disabled ? '#ababab' : 'white'}
            fontSize={16}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {child}
          </text>
        );
      })}
    </Layer>
  );
};
