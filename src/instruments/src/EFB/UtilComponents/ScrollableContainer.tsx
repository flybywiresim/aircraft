import React, { FC, useEffect, useRef, useState } from 'react';

interface ScrollableContainerProps {
    height: number;
    className?: string;
    innerClassName?: string;
    initialScroll?: number;
    onScroll?: (scrollTop: number) => void;
    onScrollStop?: (scrollTop: number) => void;
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
}) => {
    const [contentOverflows, setContentOverflows] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const position = useRef({ top: 0, y: 0 });

    useEffect(() => {
        if (contentRef.current) {
            if (contentRef.current.clientHeight > height * parseFloat(getComputedStyle(document.documentElement).fontSize)) {
                setContentOverflows(true);
            } else {
                setContentOverflows(false);
            }
        }
    }, [children]);

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

    const timeout = useRef<NodeJS.Timeout>();

    return (
        <div
            className={`w-full overflow-y-auto scrollbar ${className}`}
            style={{ height: `${height}rem` }}
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
};
