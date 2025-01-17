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
  fill?: string;
  selectable?: boolean;
  title: string | ReactNode;
  dropDownWidth?: number;
  active?: boolean;
  disabled?: boolean;
  scrollable?: boolean;
  clipItems?: boolean;
  maxHeight?: number;
};
const scrollBarWidth = 15;
let lastMousePosition = 0;

// eslint-disable-next-line max-len
export const Dropdown: FC<DropdownProps> = ({
  x,
  y = 0,
  width = 192,
  height = 60,
  dropDownWidth = 192,
  fill,
  selectable,
  title,
  children,
  active,
  disabled,
  scrollable,
  clipItems = true,
  maxHeight = Infinity,
}) => {
  const [open, setOpen] = useState(false);
  const textRef = useRef<SVGTextElement>(null);
  const [textBbox, setTextBbox] = useState<DOMRect>();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [clipPathId] = useState((Math.random() * 1000).toString());
  const [hovered, hoverProps] = useHover();
  const childYPositions = useRef([2]);

  Children.forEach(children, (child, index) => {
    if (isValidElement(child)) {
      console.log(childYPositions.current);
      childYPositions.current[index + 1] = child.props.height + childYPositions.current[index];
    }
  });

  useEffect(() => setTextBbox(textRef.current?.getBBox()), [textRef]);
  if (open && disabled) setOpen(false);

  let totalHeight = 1;
  Children.forEach(children, (child: React.ReactElement) => {
    totalHeight += child.props.height ?? 0;
  });

  return (
    <Layer {...hoverProps} x={x} y={y}>
      <Button
        width={selectable ? width - height : width}
        height={height}
        onClick={() => setOpen(!open)}
        fill={selectable ? 'black' : '#666'}
        disabled={disabled}
        highlighted={open}
        gradient
        forceHover={hovered}
      >
        {selectable ? (
          <text
            x={(width - height) / 2}
            y={height / 2}
            fill={fill}
            fontSize={18}
            dominantBaseline="middle"
            textAnchor="middle"
          >
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
              x={width / 2 - 12}
              y={height / 2}
              fill={disabled ? '#ababab' : fill}
              fontSize={18}
              dominantBaseline="middle"
              textAnchor="middle"
            >
              {title}
            </text>

            <path fill="#ffffff" d={`m ${width - 30} ${height / 2 - 3} h 20 l -6 7 l -6 -7 z`} strokeLinejoin="round" />
          </>
        )}
        {selectable && (
          <Button
            x={width - height}
            width={height}
            height={height}
            onClick={() => setOpen(!open)}
            fill="#666"
            disabled={disabled}
            highlighted={open}
            forceHover={hovered}
            gradient
          >
            <path
              fill="#ffffff"
              d={`m ${height / 2 - 14} ${height / 2 - 3} h 20 l -6 7 l -6 -7 z`}
              strokeLinejoin="round"
            />
          </Button>
        )}
      </Button>
      <clipPath id={clipPathId}>
        <rect x={0} y={height} width={width} height={Math.min(totalHeight, maxHeight)} />
      </clipPath>
      {open && (
        <g onClick={() => setOpen(false)}>
          <rect
            x={1.5}
            y={height + 1.5}
            width={Math.max(width, dropDownWidth) - 3}
            height={Math.min(totalHeight, maxHeight)}
            fill="black"
            stroke="white"
            strokeWidth={1}
          />
          <g clipPath={clipItems ? `url(#${clipPathId})` : ''}>
            {Children.map(children, (child, index) => {
              if (isValidElement(child)) {
                return React.cloneElement(child, {
                  y: height + childYPositions.current[index],
                  width: child.props.width
                    ? child.props.width
                    : (dropDownWidth ?? width) - (scrollable ? scrollBarWidth + 3 : 0),
                  centered: child.props.centered ?? !selectable,
                });
              }
              return <></>;
            })}
          </g>
          {scrollable && (
            <ScrollBar
              x={width - scrollBarWidth - 3}
              y={height + 3}
              width={scrollBarWidth}
              maxHeight={Math.min(maxHeight, totalHeight)}
              totalChildHeight={totalHeight}
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
  y?: number;
  onSelect?: () => void;
  width?: number;
  height?: number;
  centered?: boolean;
};

export const DropdownItem: FC<DropdownItemProps> = ({ y = 0, onSelect, width = 0, height = 0, centered, children }) => {
  const [hovered, hoverProps] = useHover();

  return (
    <Layer y={y} {...hoverProps} onClick={onSelect}>
      <rect
        x={3}
        y={1}
        width={width - 6}
        height={height - 2}
        fill="transparent"
        stroke={hovered ? 'hsl(203, 100%, 49%)' : 'none'}
        strokeWidth={2}
      />
      <text
        x={centered ? width / 2 : 10}
        y={height / 2}
        fill="white"
        fontSize={18}
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
  return (
    <DropdownItem {...props} centered={false} onSelect={() => history.push(path + props.link)}>
      {props.children}
    </DropdownItem>
  );
};

export const DropdownDivider = ({ y = 0, width = 0, height = 1 }: DropdownItemProps) => (
  <Layer y={y}>
    <rect x={3} y={0} width={width - 6} height={height} fill="#666" />
  </Layer>
);
