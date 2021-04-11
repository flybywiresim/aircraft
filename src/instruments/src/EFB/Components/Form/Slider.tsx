import React, { useRef } from 'react';

import './Slider.scss';

export type SliderProps = {
    className?: string,
    value?: number,
    onInput?: (v: number) => void,
    min?: number,
    max?: number,
};

export const Slider = (props: SliderProps) => {
    const sliderRef = useRef<HTMLInputElement>(null);
    const { min, max, onInput, className } = props;

    const handleInput = () => {
        const newValue = Number(sliderRef?.current?.value ?? 0);

        if (onInput) {
            onInput(newValue);
        }
    };

    return (
        <input
            value={props.value}
            ref={sliderRef}
            onChange={handleInput}
            type="range"
            min={min ?? 1}
            max={max ?? 100}
            className={`slider slider h-1 pb-1.5 pt-0.5 rounded-full ${className}`}
        />
    );
};
