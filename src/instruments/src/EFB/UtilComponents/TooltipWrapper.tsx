/* eslint-disable max-len */
import React, { useRef, useState, useEffect, forwardRef, RefObject } from 'react';
import { useAppDispatch, useAppSelector } from '../Store/store';
import { setPosX, setPosY, setShown, setText } from '../Store/features/tooltip';

interface TooltipProps {
    text?: string;
    posX: number;
    posY: number;
    shown: boolean;
}

export const Tooltip = forwardRef(({ text, posX, posY, shown }: TooltipProps, ref: RefObject<HTMLDivElement>) => {
    const { offsetY } = useAppSelector((state) => state.keyboard);

    return (
        <div
            ref={ref}
            className={`absolute rounded-md z-40 px-2 whitespace-nowrap border bg-theme-accent border-theme-secondary transition duration-100 pointer-events-none ${shown ? 'opacity-100' : 'opacity-0'}`}
            style={{ top: `${posY + offsetY}px`, left: `${posX}px` }}
        >
            {text}
        </div>
    );
});

interface TooltipWrapperProps {
    text?: string;
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
        if (!showTooltip || !text) return;

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

            const combinedHorizontalOffset = contentBoundingClientRect.left + tooltipBoundingClientRect.width + PADDING_PX;

            if (combinedHorizontalOffset > window.innerWidth) {
                dispatch(setPosX(contentBoundingClientRect.right - tooltipBoundingClientRect.width));
            } else {
                dispatch(setPosX(contentBoundingClientRect.left));
            }
        }
    }, [contentRef.current, tooltipRef.current, text, showTooltip]);

    return (
        // eslint-disable-next-line jsx-a11y/mouse-events-have-key-events
        <>
            {React.Children.map(children, (child) => React.cloneElement(
                child as React.ReactElement,
                {
                    ref: contentRef,
                    onMouseDown: (e: React.MouseEvent) => {
                        (child as React.ReactElement).props.onMouseDown?.(e);

                        setHiddenLocked(true);

                        if (showTooltip) {
                            dispatch(setShown(false));
                        }

                        if (timeout.current) {
                            clearTimeout(timeout.current);
                            timeout.current = null;
                        }
                    },
                    onMouseOver: (e: React.MouseEvent) => {
                        (child as React.ReactElement).props.onMouseOver?.(e);

                        if (timeout.current === null && text && !hiddenLocked) {
                            timeout.current = setTimeout(() => {
                                setShowTooltip(true);

                                dispatch(setShown(true));
                            }, TOOLTIP_SHOW_DELAY);
                        }
                    },
                    onMouseLeave: (e: React.MouseEvent) => {
                        (child as React.ReactElement).props.onMouseLeave?.(e);

                        if (timeout.current) {
                            clearTimeout(timeout.current);
                            timeout.current = null;
                        }

                        setShowTooltip(false);
                        setHiddenLocked(false);
                        dispatch(setShown(false));
                    },
                },
            ))}

            {/* Dummy tooltip for use in calculations */}
            <Tooltip ref={tooltipRef} posX={0} posY={0} text={text} shown={false} />
        </>
    );
};
