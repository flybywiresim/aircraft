import React, { useEffect, useState } from 'react';
import { useHover } from '@instruments/common/hooks/index';
import { useInputManager } from '@instruments/common/input';
import { OnClick, OneDimensionalSize, Position, TwoDimensionalSize } from '../../Common/types';

export const TabSet: React.FC<Position & TwoDimensionalSize> = ({ x, y, width, height, children: tabs }) => {
  const [clipPathId] = useState(Math.round(Math.random() * 1000).toString());

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const inputManager = useInputManager();

  const [tabCount, setTabCount] = useState(() => React.Children.count(tabs));
  const [tabWidth, setTabWidth] = useState(0);
  const [tabContentWidth, setTabContentWidth] = useState(0);
  const [overlap, setOverlap] = useState(0);

  const onTabClick = (index: number) => {
    inputManager.triggerUiReset();
    setActiveTabIndex(index);
  };

  useEffect(() => {
    setTabCount(React.Children.count(tabs));

    const padding = 36;

    const overlap = 24;

    setTabWidth(width / tabCount);
    setTabContentWidth(width / tabCount - padding);
    setOverlap(overlap);
  }, [tabs]);

  return (
    <>
      <clipPath id={clipPathId}>
        <path d={`m ${x} ${y - 36} h ${width} v ${height + 36} h -${width} z`} />
      </clipPath>

      <g clipPath={`url(#${clipPathId})`}>
        {/* Frame */}
        <path
          stroke="white"
          fill="none"
          strokeLinecap="round"
          strokeWidth={2.5}
          d={`m ${x} ${y} v ${height} h ${width} v -${height}`}
        />

        {React.Children.map(tabs, (child) => child)
          ?.map((child, index) => {
            if (React.isValidElement(child)) {
              const tabX = x + index * tabWidth;

              const offsetCount = tabCount - 1;
              const overlapToRegain = offsetCount * overlap;
              const extraWidthPerTab = overlapToRegain / tabCount;

              const xOffset = index > 0 ? (overlap - extraWidthPerTab) * index : 0;

              return React.cloneElement(child, {
                key: child.props.title,
                x: tabX - xOffset,
                y,
                size: tabContentWidth + extraWidthPerTab,
                onClick: onTabClick,
                active: index === activeTabIndex,
                index,
              });
            }
            return child;
          })
          .reverse()
          .sort((a) => (a.props.active ? 1 : -1))}
      </g>
    </>
  );
};

type TabProps = Partial<Position & OneDimensionalSize & OnClick & { active: boolean; index: number; title: string }>;

export const Tab: React.FC<TabProps> = ({ x = 0, y = 0, size = 0, onClick, active, title }) => {
  const [ref, isHovered] = useHover();
  const [clipPathId] = useState(Math.round(Math.random() * 1000).toString());

  return (
    <g ref={ref} onClick={onClick}>
      <clipPath id={clipPathId}>
        <path d={`m ${x - 18} ${y + 2} h ${size + 56} v -36 h ${-(size + 36)} z`} />
      </clipPath>

      <path
        stroke="white"
        fill={active ? '#000' : isHovered ? '#777' : '#555'}
        strokeWidth={active ? 2.5 : 1.5}
        d={`m ${x - 1000} ${y} h 1000 l 18 -35 h ${size} l 18 35 h 1000`}
      />

      <text fontSize={20} letterSpacing={0.75} fill="white" textAnchor="middle" x={x + size / 2 + 10} y={y - 10}>
        {title}
      </text>

      {active && <rect fill="#000000" x={x + 8} y={y - 2} width={size + 10} height={5} />}
    </g>
  );
};
