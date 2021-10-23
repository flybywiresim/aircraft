import React, { useRef } from 'react';

import './Slider.scss';

export type SliderProps = { className?: string, value?: number, onInput?: (v: number) => void; };

export const Slider = (props: SliderProps) => {
    const sliderRef = useRef<HTMLInputElement>(null);

    function handleChange() {
        const newValue = Number(sliderRef?.current?.value ?? 0);

        if (props.onInput) {
            props.onInput(newValue);
        }
    }

    function handleInput() {
        if (sliderRef.current) {
            // eslint-disable-next-line max-len
            sliderRef.current.style.background = `linear-gradient(to right, var(--color-highlight) 0%, var(--color-highlight) ${sliderRef.current.value}%, var(--color-accent) ${sliderRef.current.value}%, var(--color-accent) 100%)`;
        }
    }

    return (
        <input
            value={props.value}
            ref={sliderRef}
            onChange={handleChange}
            onInput={handleInput}
            type="range"
            min="1"
            max="100"
            className={`themed-slider rounded-full ${props.className}`}
        />
    );
};
