import { useInputManager } from '@instruments/common/input';
import React, { Children, FC, isValidElement, useState, useEffect, useRef } from 'react';
import { useHover } from 'use-events';
import { Layer } from './Layer';

type ButtonProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  onClick?: () => void;
  fill?: string;
  disabled?: boolean;
  highlighted?: boolean;
  textBackgroundColor?: string;
  textColor?: string;
  strokeWidth?: number;
  defaultColor?: string;
  hoverColor?: string;
  activeColor?: string;
};

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
  textBackgroundColor,
  textColor,
  strokeWidth = 5,
  defaultColor = 'white',
  hoverColor = 'cyan',
  activeColor = 'grey',
}) => {
  const textRef = useRef<SVGTextElement>(null);
  const [textBbox, setTextBbox] = useState<DOMRect>();
  const [hovered, hoverProps] = useHover();
  const inputManager = useInputManager();

  const handleOnClick = () => {
    if (!disabled) {
      inputManager.triggerUiReset();
      if (onClick) onClick();
    }
  };

  let textFill = '';
  if (textColor) {
    textFill = textColor;
  } else if (disabled) {
    textFill = '#ababab';
  } else {
    textFill = 'white';
  }

  const handleChild = (child) => {
    if (isValidElement(child)) {
      if (child.type.toString() === 'Symbol(react.fragment)' && child.props.children !== undefined) {
        return child.props.children.map((subchild) => handleChild(subchild));
      }
      if (child.type !== 'tspan') return child;
    }
    return (
      <text
        ref={textRef}
        x={width / 2}
        y={height / 2}
        fill={textFill}
        fontSize={22}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {child}
      </text>
    );
  };

  useEffect(() => setTextBbox(textRef.current?.getBBox()), [textRef]);
  return (
    <Layer x={x} y={y} {...hoverProps} onClick={handleOnClick}>
      <rect width={width} height={height} fill="transparent" />
      <polygon
        points={`
                0, 0
                ${width}, 0
                ${width - 5}, 5
                5, ${height - 5} 
                0, ${height}`}
        fill={hovered && !disabled ? hoverColor : highlighted ? activeColor : defaultColor}
      />

      <polygon
        points={`
                ${width}, 0
                ${width}, ${height} 
                0, ${height}
                5, ${height - 5}
                ${width - 5}, 5`}
        fill={hovered && !disabled ? hoverColor : highlighted ? defaultColor : activeColor}
      />

      <rect
        x={strokeWidth / 2}
        y={strokeWidth / 2}
        width={width - strokeWidth}
        height={height - strokeWidth}
        fill={highlighted ? '#a6a6a6' : fill ?? '#575757'}
      />
      {textBackgroundColor && (
        <rect
          x={textBbox?.x! - 2}
          y={textBbox?.y!}
          width={textBbox?.width! + 2}
          height={textBbox?.height! - 3}
          fill={textBackgroundColor}
        />
      )}
      {Children.map(children, (child) => handleChild(child))}
    </Layer>
  );
};
