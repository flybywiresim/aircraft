import React, {
  Children,
  isValidElement,
  ReactNode,
  useState,
  FC,
  useRef,
  useEffect,
  Dispatch,
  SetStateAction,
} from 'react';
import { useHover } from 'use-events';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { useInputManager } from '@instruments/common/input';
import { Layer } from './Layer';
import { Button } from './Button';

type DropdownProps = {
  x: number;
  y?: number;
  width?: number;
  height?: number;
  selectable?: boolean;
  title: string | ReactNode;
  dropDownWidth?: number;
  active?: boolean;
  disabled?: boolean;
  scrollable?: boolean;
  horizontal?: boolean;
  expandLeft?: boolean;
  showBlackBoundingBox?: boolean;
};

const childHeight = 40;
const scrollBarWidth = 15;
let lastMousePosition = 0;
const maxHeight = 400;

export const Dropdown: FC<DropdownProps> = ({
  x,
  y = 0,
  width = 192,
  height = 60,
  selectable,
  title,
  children,
  dropDownWidth,
  active,
  disabled,
  scrollable,
  horizontal,
  expandLeft,
  showBlackBoundingBox = false,
}) => {
  const [open, setOpen] = useState(false);
  const textRef = useRef<SVGTextElement>(null);
  const [textBbox, setTextBbox] = useState<DOMRect>();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [clipPathId] = useState((Math.random() * 1000).toString());
  const inputManager = useInputManager();
  const childWidth = dropDownWidth ?? width;

  const onUiReset = (): void => {
    setOpen(false);
  };

  const onButtonClick = (): void => {
    if (open) {
      inputManager.clearUiResetHandler();
    } else {
      inputManager.triggerUiReset();
      inputManager.setUiResetHandler(onUiReset);
    }
    setOpen(!open);
  };

  // default is horizontal and expand to the right
  let childrenRectangleY = height + 1.5;
  let childrenRectangleX = 1.5;
  let textAnchor = 'middle';
  let textX = 6;
  if (horizontal) {
    childrenRectangleY = 1.5;
    if (expandLeft) {
      childrenRectangleX = -childWidth + 1.5;
      textX = width - 7;
      textAnchor = 'end';
    } else {
      childrenRectangleX = width;
      textAnchor = 'start';
      textX = 7;
    }
  } else {
    textX = width / 2 - 15;
  }

  const blackBoundingBox = { topLeft: [0, 0], dimension: [width - 37, height - 8] };
  if (horizontal && expandLeft) {
    blackBoundingBox.topLeft = [33, 4];
  } else {
    blackBoundingBox.topLeft = [4, 4];
  }

  useEffect(() => setTextBbox(textRef.current?.getBBox()), [textRef]);
  if (open && disabled) setOpen(false);
  return (
    <Layer x={x} y={y}>
      <Button
        width={width}
        height={height}
        onClick={onButtonClick}
        fill={selectable ? (disabled ? '#575757' : 'black') : undefined}
        disabled={disabled}
        highlighted={open}
      >
        {horizontal && expandLeft && (
          <path
            fill={disabled ? '#ababab' : '#ffffff'}
            d={`m 22 ${height / 2 - 9} v 17 l -13 -8 l 13 -8 z`}
            strokeLinejoin="round"
          />
        )}
        {selectable ? (
          <text x={5} y={height / 2} fill="cyan" fontSize={30} dominantBaseline="central">
            {title}
          </text>
        ) : (
          <>
            <rect
              x={textBbox?.x! - 3}
              y={textBbox?.y! - 3}
              width={textBbox?.width! + 6}
              height={textBbox?.height! + 6}
              stroke={active ? 'white' : 'none'}
              strokeWidth={2}
              fill="none"
            />
            <text
              ref={textRef}
              x={textX}
              y={height / 2 + (horizontal ? 2 : 0)}
              fill={disabled ? '#ababab' : 'white'}
              fontSize={22}
              textAnchor={textAnchor}
              dominantBaseline="central"
            >
              {title}
            </text>
          </>
        )}

        {disabled && showBlackBoundingBox && (
          <rect
            x={blackBoundingBox.topLeft[0]}
            y={blackBoundingBox.topLeft[1]}
            width={blackBoundingBox.dimension[0]}
            height={blackBoundingBox.dimension[1]}
            fill="none"
            stroke="black"
            strokeWidth={1}
          />
        )}
        {horizontal && !expandLeft && (
          <path
            fill={disabled ? '#ababab' : '#ffffff'}
            d={`m ${width - 22} ${height / 2 - 9} l 13 8 l -13 8 v 17 z`}
            strokeLinejoin="round"
          />
        )}
        {!horizontal && (
          <path
            fill={disabled ? '#ababab' : '#ffffff'}
            d={`m ${width - 30} ${height / 2 - 5} h 20 l -10 14 l -10 -14 z`}
            strokeLinejoin="round"
          />
        )}
      </Button>
      <clipPath id={clipPathId}>
        <rect
          x={childrenRectangleX - 1.5}
          y={horizontal ? 0 : height}
          width={childWidth + 3}
          height={Math.min(Children.count(children) * childHeight + 6, maxHeight)}
        />
      </clipPath>
      {open && (
        <g>
          <rect
            x={childrenRectangleX}
            y={childrenRectangleY}
            width={childWidth - 3}
            height={Math.min(Children.count(children) * childHeight, maxHeight)}
            fill="#575757"
            stroke="white"
            strokeWidth={2}
          />
          <g clipPath={`url(#${clipPathId})`}>
            {Children.map(children, (child, index) => {
              if (isValidElement(child)) {
                let childY = childHeight * index + 2 - scrollPosition;
                if (!horizontal) {
                  childY += height;
                }
                return React.cloneElement(child, {
                  x: childrenRectangleX,
                  y: childY,
                  width: childWidth - 1.5,
                  centered: child.props.centered ?? (!selectable && !horizontal),
                  onSelect: () => {
                    if (!disabled) {
                      if (child.props.onSelect) {
                        child.props.onSelect();
                      }
                      setOpen(false);
                    }
                  },
                });
              }
              return null;
            })}
          </g>
          {scrollable && (
            <ScrollBar
              x={width - scrollBarWidth - 3}
              y={height + 3}
              width={scrollBarWidth}
              maxHeight={Math.min(maxHeight, Children.count(children) * childHeight)}
              totalChildHeight={Children.count(children) * childHeight}
              scrollPosition={scrollPosition}
              setScrollPosition={setScrollPosition}
            />
          )}
        </g>
      )}
    </Layer>
  );
};

export type ScrollBarProps = {
  x: number;
  y: number;
  width?: number;
  maxHeight: number;
  totalChildHeight: number;
  scrollPosition: number;
  setScrollPosition: Dispatch<SetStateAction<number>>;
};
export const ScrollBar: FC<ScrollBarProps> = ({
  x,
  y,
  width = 48,
  maxHeight,
  totalChildHeight,
  scrollPosition,
  setScrollPosition,
}) => {
  const inputManager = useInputManager();
  const [dragging, setDragging] = useState(false);
  const [hovered, hoverRef] = useHover();
  const handleMouseDown = (e: any) => {
    inputManager.setMouseUpHandler(handleMouseUp);
    inputManager.setMouseMoveHandler(handleMouseMove);
    lastMousePosition = e.pageY;
  };

  const handleMouseUp = () => {
    setDragging(false);
    inputManager.clearHandlers();
  };

  const handleMouseMove = (e: MouseEvent) => {
    const delta = e.pageY - lastMousePosition;
    setScrollPosition((p) => {
      let newPos = p + delta;
      newPos = Math.max(0, newPos);
      newPos = Math.min(newPos, totalChildHeight - maxHeight);
      return newPos;
    });
    lastMousePosition = e.pageY;
  };

  return (
    <rect
      {...hoverRef}
      x={x}
      y={y + scrollPosition * Math.min(maxHeight / totalChildHeight, 1)}
      width={width}
      height={maxHeight * Math.min(maxHeight / totalChildHeight, 1) - 3}
      fill={hovered || dragging ? 'cyan' : '#b0afae'}
      onMouseDown={handleMouseDown}
    />
  );
};

type DropdownItemProps = {
  x?: number;
  y?: number;
  onSelect?: () => void;
  width?: number;
  centered?: boolean;
  disabled?: boolean;
};
export const DropdownItem: FC<DropdownItemProps> = ({
  x = 10,
  y = 0,
  onSelect,
  width = 0,
  centered,
  disabled = false,
  children,
}) => {
  const [hovered, hoverProps] = useHover();

  return (
    <Layer
      x={x}
      y={y}
      {...hoverProps}
      onClick={() => {
        if (!disabled && onSelect) {
          onSelect();
        }
      }}
    >
      <polygon
        points={`
                0, 0
                ${width}, 0
                ${width}, ${childHeight}
                0, ${childHeight}`}
        stroke={hovered && !disabled ? 'cyan' : 'none'}
        strokeWidth={3}
        fill="transparent"
      />

      <rect
        x={1}
        y={1}
        width={width - 2}
        height={childHeight - 2}
        fill="transparent"
        stroke={hovered && !disabled ? 'cyan' : 'none'}
        strokeWidth={2}
      />
      <text
        x={centered ? width / 2 : 10}
        y={childHeight / 2}
        fill={disabled ? '#ababab' : 'white'}
        fontSize={21}
        dominantBaseline="central"
        textAnchor={centered ? 'middle' : 'start'}
      >
        {children}
      </text>
    </Layer>
  );
};

export const DropdownLink: FC<DropdownItemProps & { link: string }> = (props) => {
  const history = useHistory();
  const { path } = useRouteMatch();
  const historyPath = props.link.startsWith('/') ? props.link : `${path}/${props.link}`;

  return (
    <DropdownItem
      {...props}
      centered={false}
      onSelect={() => {
        if (props.onSelect) props.onSelect();
        history.push(historyPath);
      }}
    >
      {props.children}
    </DropdownItem>
  );
};
