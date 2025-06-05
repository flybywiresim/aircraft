import { useInputManager } from '@instruments/common/input';
import React, { Children, isValidElement, FC, useEffect, useRef, useState } from 'react';
import { useHover } from 'use-events';
import { Layer } from './Layer';

type CheckboxProps = {
  x: number;
  y?: number;
  strokeWidth?: number;
  buttonWidth?: number;
  verticalSpacing?: number;
  textSpacing?: number;
  uniqueSelection?: boolean;
  disabled?: boolean;
};

export const Checkbox: FC<CheckboxProps> = ({
  x,
  y = 0,
  strokeWidth = 2,
  buttonWidth = 10,
  verticalSpacing = 40,
  textSpacing = 40,
  uniqueSelection,
  disabled = false,
  children,
}) => (
  <Layer x={x} y={y}>
    {Children.map(children, (child, index) => {
      if (isValidElement(child)) {
        return React.cloneElement(child, {
          y: verticalSpacing * index + 2,
          strokeWidth,
          buttonWidth,
          textSpacing,
          uniqueSelection,
          disabled: child.props.disabled || disabled,
        });
      }
    })}
  </Layer>
);

type CheckboxItemProps = {
  x?: number;
  y?: number;
  strokeWidth?: number;
  selected?: boolean;
  buttonWidth?: number;
  textSpacing?: number;
  uniqueSelection?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
};

export const CheckboxItem: FC<CheckboxItemProps> = ({
  x = 0,
  y = 0,
  strokeWidth = 2,
  selected = false,
  buttonWidth = 10,
  textSpacing = 40,
  uniqueSelection,
  disabled = false,
  onSelect,
  children,
}) => {
  const textRef = useRef<SVGTextElement>(null);
  const [textBbox, setTextBbox] = useState<DOMRect>();
  const [hovered, hoverRef] = useHover();
  const inputManager = useInputManager();

  const onClick = () => {
    if (!disabled) {
      inputManager.triggerUiReset();
      if (onSelect) onSelect();
    }
  };

  useEffect(() => setTextBbox(textRef.current?.getBBox()), [textRef]);

  return (
    <Layer y={y} onClick={onClick}>
      {uniqueSelection ? (
        <>
          <circle
            {...hoverRef}
            cx={x + buttonWidth / 2}
            cy={y + buttonWidth / 2}
            r={buttonWidth}
            stroke={hovered && !disabled ? 'cyan' : 'white'}
            strokeWidth={1}
          />
          {selected && (
            <circle
              {...hoverRef}
              cx={x + buttonWidth / 2}
              cy={y + buttonWidth / 2}
              r={buttonWidth - strokeWidth}
              fill="cyan"
            />
          )}
          <text
            x={x + textSpacing}
            y={y + buttonWidth * 1.5 + 1}
            {...hoverRef}
            fill={!disabled ? 'white' : '#ababab'}
            fontSize={21}
          >
            {children}
          </text>
        </>
      ) : (
        <>
          <rect
            {...hoverRef}
            x={x - 4}
            y={y - 4}
            width={buttonWidth + textSpacing + textBbox?.width! + 18}
            height={buttonWidth + 8}
            stroke={hovered && !disabled ? 'cyan' : 'transparent'}
            strokeWidth={3}
          />
          {selected ? (
            <>
              {/* Check-icon */}
              <path
                d={`M ${x} ${y + Math.round(buttonWidth / 2) + 3}
                                    L ${x + Math.round(buttonWidth / 2.5) - 2} ${y + buttonWidth}
                                    L ${x + Math.round(buttonWidth / 2.5) + 2} ${y + buttonWidth}
                                    L ${x + buttonWidth} ${y + Math.round(buttonWidth / 5) + 3}
                                    L ${x + buttonWidth} ${y + Math.round(buttonWidth / 5) - 2}
                                    L ${x + Math.round(buttonWidth / 2.5)} ${y + buttonWidth - 4}
                                    L ${x} ${y + Math.round(buttonWidth / 2) - 2}Z`}
                fill="cyan"
              />
            </>
          ) : (
            <></>
          )}
          <rect
            {...hoverRef}
            x={x}
            y={y}
            width={buttonWidth}
            height={buttonWidth}
            stroke="white"
            strokeWidth={1}
            fill="transparent"
          />
          <text
            ref={textRef}
            x={x + textSpacing + buttonWidth}
            y={y + Math.round(buttonWidth / 2) + 9}
            {...hoverRef}
            fill={selected ? 'cyan' : !disabled ? 'white' : '#ababab'}
            fontSize={21}
          >
            {children}
          </text>
        </>
      )}
    </Layer>
  );
};
