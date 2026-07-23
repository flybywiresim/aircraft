// @ts-strict-ignore
// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { FC, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'react-bootstrap-icons';

interface ScrollableContainerProps {
  height: number;
  className?: string;
  innerClassName?: string;
  initialScroll?: number;
  onScroll?: (scrollTop: number) => void;
  onScrollStop?: (scrollTop: number) => void;
  nonRigid?: boolean;
  /** When true, renders ▲/▼ buttons for precise scrolling next to the scrollbar. */
  scrollButtons?: boolean;
  /** Number of pixels to scroll per button click when scrollButtons is enabled. Defaults to 100. */
  scrollAmount?: number;
}

/**
 * A container that can be scrolled vertically.
 * @param height - height of the container, in rem, that if exceeded will cause the container to become scrollable
 */
export const ScrollableContainer: FC<ScrollableContainerProps> = ({
  children,
  className,
  height,
  onScroll,
  onScrollStop,
  initialScroll = 0,
  innerClassName,
  nonRigid,
  scrollButtons = false,
  scrollAmount = 100,
}) => {
  const [contentOverflows, setContentOverflows] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const position = useRef({ top: 0, y: 0 });
  const scrollButtonSpace = 3;

  useEffect(() => {
    if (contentRef.current) {
      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const scrollButtonSpaceInPixels = scrollButtons ? scrollButtonSpace * rootFontSize : 0;

      if (contentRef.current.clientHeight > height * rootFontSize - scrollButtonSpaceInPixels) {
        setContentOverflows(true);
      } else {
        setContentOverflows(false);
      }
    }
  }, [children, height, scrollButtons]);

  const handleMouseDown = (event: React.MouseEvent) => {
    position.current.top = containerRef.current ? containerRef.current.scrollTop : 0;
    position.current.y = event.clientY;

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  };

  const mouseMoveHandler = (event: MouseEvent) => {
    const dy = event.clientY - position.current.y;
    if (containerRef.current) {
      containerRef.current.scrollTop = position.current.top - dy;
    }
  };

  const mouseUpHandler = () => {
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
  };

  useEffect(() => {
    if (containerRef.current && containerRef.current.scrollHeight >= initialScroll) {
      containerRef.current.scrollTop = initialScroll;
    }
  }, []);

  const timeout = useRef<ReturnType<typeof setTimeout>>();

  const handleScrollUp = () => {
    containerRef.current?.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
  };

  const handleScrollDown = () => {
    containerRef.current?.scrollBy({ top: scrollAmount, behavior: 'smooth' });
  };

  const showScrollButtons = scrollButtons && contentOverflows;
  const scrollableHeight = showScrollButtons ? `calc(${height}rem - ${scrollButtonSpace}rem)` : `${height}rem`;

  const scrollableDiv = (
    <div
      className={`scrollbar w-full overflow-y-auto ${showScrollButtons ? 'my-6' : ''} ${className}`}
      style={nonRigid ? { maxHeight: scrollableHeight } : { height: scrollableHeight }}
      ref={containerRef}
      onScroll={(event) => {
        if (timeout.current) {
          clearTimeout(timeout.current);
        }

        const newScrollTop = event.currentTarget.scrollTop;

        timeout.current = setTimeout(() => {
          onScrollStop?.(newScrollTop);
        }, 250);

        onScroll?.(newScrollTop);
      }}
      onMouseDown={handleMouseDown}
    >
      <div className={`${contentOverflows && 'mr-6'} ${innerClassName}`} ref={contentRef}>
        {children}
      </div>
    </div>
  );

  if (showScrollButtons) {
    return (
      <div className="relative flow-root w-full">
        <button
          type="button"
          aria-label="Scroll up"
          onClick={handleScrollUp}
          className="absolute right-0 top-0 z-10 flex h-6 w-6 items-center justify-center rounded-t-md bg-theme-secondary text-theme-text transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
        >
          <ChevronUp size={14} />
        </button>
        {scrollableDiv}
        <button
          type="button"
          aria-label="Scroll down"
          onClick={handleScrollDown}
          className="absolute bottom-0 right-0 z-10 flex h-6 w-6 items-center justify-center rounded-b-md bg-theme-secondary text-theme-text transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
        >
          <ChevronDown size={14} />
        </button>
      </div>
    );
  }

  return scrollableDiv;
};
