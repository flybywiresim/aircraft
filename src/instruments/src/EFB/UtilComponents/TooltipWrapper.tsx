/* eslint-disable max-len */
import React, { useRef, useState, useEffect, forwardRef, RefObject } from 'react';
import { useAppDispatch } from '../Store/store';
import { setPosX, setPosY, setShown, setText } from '../Store/features/tooltip';

interface TooltipProps {
    text: string;
    posX: number;
    posY: number;
    shown: boolean;
}

export const Tooltip = forwardRef(({ text, posX, posY, shown }: TooltipProps, ref: RefObject<HTMLDivElement>) => (
    <div
        ref={ref}
        className={`absolute rounded-md z-40 px-1 whitespace-nowrap border bg-theme-accent border-theme-secondary transition duration-100 pointer-events-none ${shown ? 'opacity-100' : 'opacity-0'}`}
        style={{ top: `${posY}px`, left: `${posX}px` }}
    >
        {text}
    </div>
));

interface TooltipWrapperProps {
    text: string;
}

export const TooltipWrapper: React.FC<TooltipWrapperProps> = ({ children, text }) => {
    const dispatch = useAppDispatch();
    const [showTooltip, setShowTooltip] = useState(false);
    const [hiddenLocked, setHiddenLocked] = useState(false);

    const timeout = useRef<NodeJS.Timeout | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const TOOLTIP_SHOW_DELAY = 500;
    const PADDING_PX = 10;

    useEffect(() => {
        if (!showTooltip) return;

        dispatch(setText(text));

        if (contentRef.current && tooltipRef.current) {
            const contentBoundingClientRect = contentRef.current.getBoundingClientRect();
            const tooltipBoundingClientRect = tooltipRef.current.getBoundingClientRect();

            const totalHeight = contentBoundingClientRect.height + tooltipBoundingClientRect.height;
            const combinedVerticalOffset = contentBoundingClientRect.top + totalHeight + PADDING_PX;

            if (combinedVerticalOffset > window.innerHeight) {
                dispatch(setPosY(contentBoundingClientRect.top - tooltipBoundingClientRect.height - PADDING_PX));
            } else {
                dispatch(setPosY(contentBoundingClientRect.bottom + PADDING_PX));
            }

            const totalWidth = contentBoundingClientRect.width + tooltipBoundingClientRect.width;
            const combinedHorizontalOffset = contentBoundingClientRect.left + totalWidth + PADDING_PX;

            if (combinedHorizontalOffset > window.innerWidth) {
                dispatch(setPosX(contentBoundingClientRect.right - tooltipBoundingClientRect.width));
            } else {
                dispatch(setPosX(contentBoundingClientRect.left));
            }
        }
    }, [contentRef.current, tooltipRef.current, text, showTooltip]);

    return (
        // eslint-disable-next-line jsx-a11y/mouse-events-have-key-events
        <div
            onMouseOver={() => {
                if (timeout.current === null) {
                    timeout.current = setTimeout(() => {
                        setShowTooltip(true);

                        if (!hiddenLocked) {
                            dispatch(setShown(true));
                        }
                    }, TOOLTIP_SHOW_DELAY);
                }
            }}
            onMouseLeave={() => {
                if (timeout.current) {
                    clearTimeout(timeout.current);
                    timeout.current = null;
                }

                setShowTooltip(false);
                setHiddenLocked(false);
                dispatch(setShown(false));
            }}
        >
            <div
                className="h-full"
                ref={contentRef}
                onClick={() => {
                    setHiddenLocked(true);

                    if (showTooltip) {
                        dispatch(setShown(false));
                    }
                }}
            >
                {children}
            </div>

            {/* Dummy tooltip for use in calculations */}
            <Tooltip ref={tooltipRef} posX={0} posY={0} text={text} shown={false} />
        </div>
    );
};
