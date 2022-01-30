import React, { FC, useEffect, useRef, useState } from 'react';

interface ScrollableContainerProps {
    height: number;
}

/**
 * A container that can be scrolled vertically.
 * @param height - height of the container, in rem, that if exceeded will cause the container to become scrollable
 * @param resizeDependencies - optional dependency list to trigger a re-calculation of the height of the content
 */
export const ScrollableContainer: FC<ScrollableContainerProps> = ({ children, height }) => {
    const [contentOverflows, setContentOverflows] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const position = useRef({ top: 0, y: 0 });

    useEffect(() => {
        if (contentRef.current) {
            if (contentRef.current.clientHeight > height * parseFloat(getComputedStyle(document.documentElement).fontSize)) {
                setContentOverflows(true);
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

    return (
        <div
            className={`w-full ${contentOverflows && 'overflow-y-scroll'} h-full scrollbar`}
            style={{ height: `${height}rem` }}
            ref={containerRef}
            onMouseDown={handleMouseDown}
        >
            <div className={`${contentOverflows && 'mr-6'} h-full`} ref={contentRef}>
                {children}
            </div>
        </div>
    );
};
